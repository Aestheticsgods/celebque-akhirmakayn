import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';


// GET - Check subscription status
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params; // creator ID

    const creator = await prisma.creator.findUnique({
      where: { id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    if (!session?.user?.email) {
      return NextResponse.json(
        {
          subscriberCount: (
            await prisma.subscription.count({
              where: { creatorId: id, isActive: true },
            })
          ),
          isSubscribed: false,
        },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    const subscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId: user?.id || '',
          creatorId: id,
        },
      },
    });

    const subscriberCount = await prisma.subscription.count({
      where: { creatorId: id, isActive: true },
    });

    return NextResponse.json(
      {
        subscriberCount,
        isSubscribed: !!subscription && subscription.isActive,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Failed to check subscription' },
      { status: 500 }
    );
  }
}

// DELETE - Unsubscribe
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params; // creator ID

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId: user.id,
          creatorId: id,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    await prisma.subscription.delete({
      where: {
        subscriberId_creatorId: {
          subscriberId: user.id,
          creatorId: id,
        },
      },
    });

    return NextResponse.json(
      { message: 'Unsubscribed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe' },
      { status: 500 }
    );
  }
}
