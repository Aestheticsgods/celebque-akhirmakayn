import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { calculateFees } from '@/lib/stripe';

const STRIPE_MOCK_MODE =
  process.env.STRIPE_MOCK_MODE === 'true' ||
  process.env.STRIPE_SECRET_KEY?.includes('REPLACE_ME');

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { creatorId } = body;

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const creator = await prisma.creator.findUnique({ where: { id: creatorId } });
    if (!creator) return NextResponse.json({ error: 'Creator not found' }, { status: 404 });

    if (!creator.subscriptionFee || creator.subscriptionFee <= 0) {
      return NextResponse.json({ error: 'Creator has no subscription fee set' }, { status: 400 });
    }

    // Check if user already has an active subscription
    const existing = await prisma.subscription.findUnique({
      where: { subscriberId_creatorId: { subscriberId: user.id, creatorId } },
    });
    if (existing?.isActive) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Local/dev fallback when Stripe account access is unavailable.
    if (STRIPE_MOCK_MODE) {
      const mockSubscriptionId = `sub_mock_${Date.now()}`;
      const mockInvoiceId = `in_mock_${Date.now()}`;

      const { creatorEarning, platformFee } = calculateFees(creator.subscriptionFee);

      await prisma.$transaction([
        prisma.subscription.upsert({
          where: {
            subscriberId_creatorId: {
              subscriberId: user.id,
              creatorId,
            },
          },
          create: {
            subscriberId: user.id,
            creatorId,
            isActive: true,
            stripeSubscriptionId: mockSubscriptionId,
            stripeCustomerId: `cus_mock_${user.id}`,
          },
          update: {
            isActive: true,
            endDate: null,
            stripeSubscriptionId: mockSubscriptionId,
          },
        }),
        prisma.creator.update({
          where: { id: creator.id },
          data: {
            availableBalance: { increment: creatorEarning },
            monthlyRevenue: { increment: Math.round(creatorEarning / 100) },
          },
        }),
        prisma.transaction.create({
          data: {
            userId: creator.userId,
            type: 'CREATOR_EARNING',
            amount: creatorEarning,
            description: 'Mock subscription earning (local mode)',
            status: 'COMPLETED',
            relatedUserId: user.id,
            stripeId: mockInvoiceId,
          },
        }),
        prisma.transaction.create({
          data: {
            userId: creator.userId,
            type: 'PLATFORM_FEE',
            amount: platformFee,
            description: 'Mock platform fee (local mode)',
            status: 'COMPLETED',
            stripeId: mockInvoiceId,
          },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'SUBSCRIPTION_PAYMENT',
            amount: creator.subscriptionFee,
            description: `Mock subscription to ${creator.displayName}`,
            status: 'COMPLETED',
            relatedUserId: creator.userId,
            stripeId: mockInvoiceId,
          },
        }),
      ]);

      return NextResponse.json({
        url: `${appUrl}/payment/success?mock=1`,
      });
    }

    // Get or lazily create a Stripe Product + recurring Price for this creator
    let stripePriceId = creator.stripePriceId;
    let shouldCreateNewPrice = !stripePriceId;

    if (stripePriceId) {
      try {
        const existingPrice = await stripe.prices.retrieve(stripePriceId);
        if (
          existingPrice.deleted ||
          existingPrice.unit_amount !== creator.subscriptionFee ||
          existingPrice.currency !== 'eur' ||
          existingPrice.type !== 'recurring'
        ) {
          shouldCreateNewPrice = true;
        }
      } catch {
        shouldCreateNewPrice = true;
      }
    }

    if (shouldCreateNewPrice) {
      let productId = creator.stripeProductId;

      if (!productId) {
        const product = await stripe.products.create({
          name: `${creator.displayName} — Monthly Subscription`,
          metadata: { creatorId: creator.id },
        });
        productId = product.id;
      }

      const price = await stripe.prices.create({
        product: productId,
        unit_amount: creator.subscriptionFee,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { creatorId: creator.id },
      });

      stripePriceId = price.id;

      await prisma.creator.update({
        where: { id: creatorId },
        data: { stripePriceId: price.id, stripeProductId: productId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: stripePriceId, quantity: 1 }],
      customer_email: user.email,
      success_url: `${appUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/payment/cancel`,
      metadata: {
        creatorId,
        subscriberId: user.id,
      },
      subscription_data: {
        metadata: {
          creatorId,
          subscriberId: user.id,
        },
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error('[stripe/checkout] Error:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
