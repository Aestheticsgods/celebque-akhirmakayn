import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe, calculateFees } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

// Stripe requires the raw body for signature verification.
export const config = { api: { bodyParser: false } };

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { creatorId, subscriberId } = session.metadata ?? {};
  if (!creatorId || !subscriberId) return;

  const stripeSubscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : (session.subscription as Stripe.Subscription)?.id;

  if (!stripeSubscriptionId) return;

  // Create or re-activate the subscription record
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

  const amountPaidCents = invoice.amount_paid;
  if (amountPaidCents <= 0) return;

  const { platformFee, creatorEarning } = calculateFees(amountPaidCents);

  // Credit creator earnings
  await prisma.$transaction([
    // Update creator balance
    prisma.creator.update({
      where: { id: subscription.creatorId },
      data: {
        availableBalance: { increment: creatorEarning },
        monthlyRevenue: { increment: Math.round(creatorEarning / 100) },
      },
    }),
    // Log creator earning transaction
    prisma.transaction.create({
      data: {
        userId: subscription.creator.userId,
        type: 'CREATOR_EARNING',
        amount: creatorEarning,
        description: `Subscription payment from subscriber`,
        status: 'COMPLETED',
        relatedUserId: subscription.subscriberId,
        stripeId: invoice.id,
      },
    }),
    // Log platform fee transaction
    prisma.transaction.create({
      data: {
        userId: subscription.creator.userId,
        type: 'PLATFORM_FEE',
        amount: platformFee,
        description: 'Platform fee (20%)',
        status: 'COMPLETED',
        stripeId: invoice.id,
      },
    }),
    // Log subscriber payment transaction
    prisma.transaction.create({
      data: {
        userId: subscription.subscriberId,
        type: 'SUBSCRIPTION_PAYMENT',
        amount: amountPaidCents,
        description: `Subscription to ${subscription.creator.displayName}`,
        status: 'COMPLETED',
        relatedUserId: subscription.creator.userId,
        stripeId: invoice.id,
      },
    }),
  ]);
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
