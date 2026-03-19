import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { centsToEuros } from '@/lib/pricing';

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

    return NextResponse.json(
      {
        ...creator,
        subscriptionFee: centsToEuros(creator.subscriptionFee),
        subscriberCount: creator.subscribers.length,
        postCount: creator.posts.length,
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
