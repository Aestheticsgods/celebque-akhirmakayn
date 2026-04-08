import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import type { Prisma } from '@prisma/client';
import { stripe, calculateFees } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { getPaymentLinkTarget } from '@/lib/stripePaymentLinks';

function getSessionEmail(session: Stripe.Checkout.Session) {
  return session.customer_details?.email || session.customer_email || null;
}

function getSessionPaymentLinkId(session: Stripe.Checkout.Session) {
  const paymentLink = session.payment_link;
  if (!paymentLink) return null;
  return typeof paymentLink === 'string' ? paymentLink : paymentLink.id;
}

async function resolvePaymentLinkKind(session: Stripe.Checkout.Session) {
  const paymentLinkId = getSessionPaymentLinkId(session);
  if (!paymentLinkId) return null;

  const [subscriptionLink, tipLink] = await Promise.all([
    getPaymentLinkTarget('subscription'),
    getPaymentLinkTarget('tip'),
  ]);

  if (paymentLinkId === subscriptionLink.paymentLinkId) return 'subscription';
  if (paymentLinkId === tipLink.paymentLinkId) return 'tip';

  return null;
}

async function findPendingPaymentLinkTransaction(
  session: Stripe.Checkout.Session,
  type: 'SUBSCRIPTION_PAYMENT' | 'DEPOSIT'
) {
  const email = getSessionEmail(session);
  const paymentLinkId = getSessionPaymentLinkId(session);

  if (!email || !paymentLinkId) return null;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const pendingTransaction = await prisma.transaction.findFirst({
    where: {
      userId: user.id,
      type,
      status: 'PENDING',
      stripeId: paymentLinkId,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!pendingTransaction?.relatedUserId) return null;

  const creator = await prisma.creator.findUnique({
    where: { userId: pendingTransaction.relatedUserId },
  });

  if (!creator) return null;

  return { creator, pendingTransaction, user };
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { creatorId, subscriberId } = session.metadata ?? {};

  if (creatorId && subscriberId) {
    const stripeSubscriptionId =
      typeof session.subscription === 'string'
        ? session.subscription
        : (session.subscription as Stripe.Subscription)?.id;

    if (!stripeSubscriptionId) return;

    await prisma.subscription.upsert({
      where: { subscriberId_creatorId: { subscriberId, creatorId } },
      create: {
        subscriberId,
        creatorId,
        isActive: true,
        stripeSubscriptionId,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
      },
      update: {
        isActive: true,
        endDate: null,
        stripeSubscriptionId,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
      },
    });

    return;
  }

  const paymentLinkKind = await resolvePaymentLinkKind(session);
  if (paymentLinkKind !== 'subscription') return;

  const match = await findPendingPaymentLinkTransaction(session, 'SUBSCRIPTION_PAYMENT');
  if (!match) return;

  const stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription)?.id;

  if (!stripeSubscriptionId) return;

  await prisma.$transaction([
    prisma.subscription.upsert({
      where: {
        subscriberId_creatorId: {
          subscriberId: match.user.id,
          creatorId: match.creator.id,
        },
      },
      create: {
        subscriberId: match.user.id,
        creatorId: match.creator.id,
        isActive: true,
        stripeSubscriptionId,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
      },
      update: {
        isActive: true,
        endDate: null,
        stripeSubscriptionId,
        stripeCustomerId: typeof session.customer === 'string' ? session.customer : undefined,
      },
    }),
    prisma.transaction.update({
      where: { id: match.pendingTransaction.id },
      data: {
        stripeId: stripeSubscriptionId,
        description: `Pending subscription payment for creator ${match.creator.id}`,
      },
    }),
  ]);
}

async function handleTipCheckoutCompleted(session: Stripe.Checkout.Session) {
  if (session.payment_status !== 'paid') return;

  const match = await findPendingPaymentLinkTransaction(session, 'DEPOSIT');
  if (!match) return;

  const amountPaidCents = session.amount_total ?? 0;
  if (amountPaidCents <= 0) return;

  const stripePaymentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.id;

  const existingTip = await prisma.transaction.findFirst({
    where: {
      stripeId: stripePaymentId,
      type: 'CREATOR_EARNING',
    },
  });

  if (existingTip) return;

  const { platformFee, creatorEarning } = calculateFees(amountPaidCents);

  await prisma.$transaction([
    prisma.creator.update({
      where: { id: match.creator.id },
      data: {
        availableBalance: { increment: creatorEarning },
        monthlyRevenue: { increment: Math.round(creatorEarning / 100) },
      },
    }),
    prisma.transaction.update({
      where: { id: match.pendingTransaction.id },
      data: {
        status: 'COMPLETED',
        amount: amountPaidCents,
        description: `Tip to ${match.creator.displayName}`,
        stripeId: stripePaymentId,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: match.creator.userId,
        type: 'CREATOR_EARNING',
        amount: creatorEarning,
        description: 'Tip from supporter',
        status: 'COMPLETED',
        relatedUserId: match.user.id,
        stripeId: stripePaymentId,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: match.creator.userId,
        type: 'PLATFORM_FEE',
        amount: platformFee,
        description: 'Platform fee (15%) on tip',
        status: 'COMPLETED',
        stripeId: stripePaymentId,
      },
    }),
  ]);
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // The subscription field may be a string ID or an expanded object depending on SDK version
  const rawSub = (invoice as any).subscription ?? (invoice as any).parent?.subscription_details?.subscription;
  const stripeSubscriptionId =
    typeof rawSub === 'string' ? rawSub : (rawSub as Stripe.Subscription)?.id;

  if (!stripeSubscriptionId) return;

  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId },
    include: { creator: true, subscriber: true },
  });

  if (!subscription) return;

  const existingInvoiceCredit = await prisma.transaction.findFirst({
    where: {
      stripeId: invoice.id,
      type: 'CREATOR_EARNING',
    },
  });

  if (existingInvoiceCredit) return;

  const amountPaidCents = invoice.amount_paid;
  if (amountPaidCents <= 0) return;

  const { platformFee, creatorEarning } = calculateFees(amountPaidCents);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const pendingSubscriberPayment = await tx.transaction.findFirst({
      where: {
        userId: subscription.subscriberId,
        relatedUserId: subscription.creator.userId,
        type: 'SUBSCRIPTION_PAYMENT',
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });

    await tx.creator.update({
      where: { id: subscription.creatorId },
      data: {
        availableBalance: { increment: creatorEarning },
        monthlyRevenue: { increment: Math.round(creatorEarning / 100) },
      },
    });

    await tx.transaction.create({
      data: {
        userId: subscription.creator.userId,
        type: 'CREATOR_EARNING',
        amount: creatorEarning,
        description: 'Subscription payment from subscriber',
        status: 'COMPLETED',
        relatedUserId: subscription.subscriberId,
        stripeId: invoice.id,
      },
    });

    await tx.transaction.create({
      data: {
        userId: subscription.creator.userId,
        type: 'PLATFORM_FEE',
        amount: platformFee,
        description: 'Platform fee (15%)',
        status: 'COMPLETED',
        stripeId: invoice.id,
      },
    });

    if (pendingSubscriberPayment) {
      await tx.transaction.update({
        where: { id: pendingSubscriberPayment.id },
        data: {
          status: 'COMPLETED',
          amount: amountPaidCents,
          description: `Subscription to ${subscription.creator.displayName}`,
          stripeId: invoice.id,
        },
      });
    } else {
      await tx.transaction.create({
        data: {
          userId: subscription.subscriberId,
          type: 'SUBSCRIPTION_PAYMENT',
          amount: amountPaidCents,
          description: `Subscription to ${subscription.creator.displayName}`,
          status: 'COMPLETED',
          relatedUserId: subscription.creator.userId,
          stripeId: invoice.id,
        },
      });
    }
  });
}

async function handleSubscriptionDeleted(sub: Stripe.Subscription) {
  if (!sub.id) return;

  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: sub.id },
    data: {
      isActive: false,
      endDate: new Date(),
    },
  });
}

async function handleAccountUpdated(account: Stripe.Account) {
  if (!account.id) return;

  const chargesEnabled = account.charges_enabled ?? false;
  const payoutsEnabled = account.payouts_enabled ?? false;
  const complete = chargesEnabled && payoutsEnabled;

  await prisma.creator.updateMany({
    where: { stripeAccountId: account.id },
    data: { stripeOnboardingComplete: complete },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing Stripe signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        await handleTipCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'account.updated':
        await handleAccountUpdated(event.data.object as Stripe.Account);
        break;

      default:
        // Unhandled event — ignore silently
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[webhook] Handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
