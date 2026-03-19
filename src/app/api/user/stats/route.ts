import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// GET - Aggregate stats for the current user (subscriptions, posts, likes)
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
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const [subscriptionsCount, postsCount, likesReceivedCount] = await Promise.all([
      prisma.subscription.count({
        where: { subscriberId: user.id, isActive: true },
      }),
      prisma.post.count({
        where: { userId: user.id },
      }),
      // Likes received on this user's posts
      prisma.like.count({
        where: {
          post: {
            userId: user.id,
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        subscriptionsCount,
        postsCount,
        likesReceivedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user stats' },
      { status: 500 }
    );
  }
}

