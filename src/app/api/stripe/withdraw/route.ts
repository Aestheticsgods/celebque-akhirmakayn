import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';

const STRIPE_MOCK_MODE =
  process.env.STRIPE_MOCK_MODE === 'true' ||
  process.env.STRIPE_SECRET_KEY?.includes('REPLACE_ME');

// Minimum withdrawal: $10 = 1000 cents
const MIN_WITHDRAWAL_CENTS = 1000;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amountCents } = body; // amount in cents to withdraw

    if (!amountCents || typeof amountCents !== 'number' || amountCents < MIN_WITHDRAWAL_CENTS) {
      return NextResponse.json(
        { error: `Minimum withdrawal is $${MIN_WITHDRAWAL_CENTS / 100}` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creator: true },
    });

    if (!user?.creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const creator = user.creator;

    if (!creator.stripeAccountId || !creator.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: 'You must connect your Stripe account before withdrawing' },
        { status: 400 }
      );
    }

    if (creator.availableBalance < amountCents) {
      return NextResponse.json(
        { error: 'Insufficient available balance' },
        { status: 400 }
      );
    }

    if (STRIPE_MOCK_MODE) {
      const mockTransferId = `tr_mock_${Date.now()}`;

      await prisma.$transaction([
        prisma.creator.update({
          where: { id: creator.id },
          data: {
            availableBalance: { decrement: amountCents },
          },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: 'PAYOUT',
            amount: amountCents,
            description: 'Mock withdrawal (local mode)',
            status: 'COMPLETED',
            stripeId: mockTransferId,
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        transferId: mockTransferId,
        amountCents,
        mock: true,
      });
    }

    // Create a Stripe Transfer from your platform account to the creator's connected account
    const transfer = await stripe.transfers.create({
      amount: amountCents,
      currency: 'usd',
      destination: creator.stripeAccountId,
      description: `Payout for creator ${creator.displayName}`,
      metadata: { creatorId: creator.id },
    });

    // Deduct balance and record transaction atomically
    await prisma.$transaction([
      prisma.creator.update({
        where: { id: creator.id },
        data: {
          availableBalance: { decrement: amountCents },
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'PAYOUT',
          amount: amountCents,
          description: `Withdrawal to connected Stripe account`,
          status: 'COMPLETED',
          stripeId: transfer.id,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      transferId: transfer.id,
      amountCents,
    });
  } catch (error) {
    console.error('[stripe/withdraw] Error:', error);
    return NextResponse.json({ error: 'Withdrawal failed' }, { status: 500 });
  }
}
