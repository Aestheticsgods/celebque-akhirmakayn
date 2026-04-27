import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { buildPaymentLinkRedirectUrl, getPaymentLinkTarget } from '@/lib/stripePaymentLinks';

function getSafeErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Unexpected error during tip checkout';
}

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

    if (creator.userId === user.id) {
      return NextResponse.json({ error: 'Cannot tip yourself' }, { status: 400 });
    }

    const { paymentLinkId, url } = await getPaymentLinkTarget('tip');

    await prisma.$transaction([
      prisma.transaction.updateMany({
        where: {
          userId: user.id,
          type: 'DEPOSIT',
          status: 'PENDING',
        },
        data: {
          status: 'CANCELLED',
          description: 'Replaced by a newer tip checkout',
        },
      }),
      prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'DEPOSIT',
          amount: 0,
          description: `Pending tip checkout for creator ${creator.id}`,
          status: 'PENDING',
          relatedUserId: creator.userId,
          stripeId: paymentLinkId,
        },
      }),
    ]);

    return NextResponse.json({
      url: buildPaymentLinkRedirectUrl(url, user.email),
    });
  } catch (error) {
    console.error('[stripe/tip] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to start tip checkout',
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}