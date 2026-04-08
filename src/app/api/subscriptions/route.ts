import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { centsToDollars } from '@/lib/pricing';


// GET - Get subscriptions for current user
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

    const subscriptions = await prisma.subscription.findMany({
      where: { subscriberId: user.id, isActive: true },
      include: {
        creator: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Return a plain array so client components that expect an array
    // (profile, subscriptions, promotions pages) can consume it directly.
    return NextResponse.json(
      subscriptions.map((subscription: (typeof subscriptions)[number]) => ({
        ...subscription,
        creator: subscription.creator
          ? {
              ...subscription.creator,
              subscriptionFee: centsToDollars(subscription.creator.subscriptionFee),
            }
          : subscription.creator,
      })),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// POST - Subscribe to a creator
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { creatorId } = body;

    if (!creatorId) {
      return NextResponse.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    const [user, creator] = await Promise.all([
      prisma.user.findUnique({ where: { email: session.user.email } }),
      prisma.creator.findUnique({ where: { id: creatorId } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    if (creator.userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot subscribe to yourself' },
        { status: 400 }
      );
    }

    // Check existing subscription
    const existingSubscription = await prisma.subscription.findUnique({
      where: {
        subscriberId_creatorId: {
          subscriberId: user.id,
          creatorId,
        },
      },
    });

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'Already subscribed to this creator' },
        { status: 400 }
      );
    }

    const subscription = await prisma.subscription.create({
      data: {
        subscriberId: user.id,
        creatorId,
      },
      include: {
        creator: true,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: creator.userId,
        type: 'SUBSCRIPTION',
        title: 'New Subscriber',
        message: `${user.name || 'Someone'} subscribed to you`,
        relatedId: user.id,
        relatedType: 'USER',
      },
    });

    return NextResponse.json(
      {
        ...subscription,
        creator: subscription.creator
          ? {
              ...subscription.creator,
              subscriptionFee: centsToDollars(subscription.creator.subscriptionFee),
            }
          : subscription.creator,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
