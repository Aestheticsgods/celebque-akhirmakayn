import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { centsToDollars } from '@/lib/pricing';

// GET current user's creator profile
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        creator: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const creator = await prisma.creator.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        posts: true,
        subscribers: true,
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    if (!user.isCreator) {
      await prisma.user.update({
        where: { id: user.id },
        data: { isCreator: true, role: 'CREATOR' },
      });
    }

    const [activeSubscriberCount, recentTipTransactions] = await Promise.all([
      prisma.subscription.count({ where: { creatorId: creator.id, isActive: true } }),
      prisma.transaction.findMany({
      where: {
        userId: creator.userId,
        type: 'CREATOR_EARNING',
        description: 'Tip from supporter',
        status: 'COMPLETED',
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      }),
    ]);

    const supporterIds = Array.from(
      new Set(
        recentTipTransactions
          .map((transaction: (typeof recentTipTransactions)[number]) => transaction.relatedUserId)
          .filter((relatedUserId: string | null): relatedUserId is string => Boolean(relatedUserId))
      )
    );

    const supporters = supporterIds.length
      ? await prisma.user.findMany({
          where: { id: { in: supporterIds } },
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        })
      : [];

    const supportersById = new Map<string, (typeof supporters)[number]>(
      supporters.map((supporter: (typeof supporters)[number]) => [supporter.id, supporter])
    );

    return NextResponse.json(
      {
        ...creator,
        subscriptionFee: centsToDollars(creator.subscriptionFee),
        subscriberCount: activeSubscriberCount,
        postCount: creator.posts.length,
        recentTips: recentTipTransactions.map((transaction: (typeof recentTipTransactions)[number]) => {
          const supporter = transaction.relatedUserId
            ? supportersById.get(transaction.relatedUserId)
            : undefined;

          return {
            id: transaction.id,
            amount: centsToDollars(transaction.amount),
            createdAt: transaction.createdAt,
            supporter: supporter
              ? {
                  id: supporter.id,
                  name: supporter.name,
                  username: supporter.username,
                  image: supporter.image,
                }
              : null,
          };
        }),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator profile' },
      { status: 500 }
    );
  }
}
