import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { eurosToCents, centsToEuros } from '@/lib/pricing';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();

    if (!session || !session.user?.email) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { displayName, bio, subscriptionPrice } = await request.json();

    if (!displayName || subscriptionPrice === undefined) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const subscriptionFeeCents = eurosToCents(Number(subscriptionPrice));

    if (!Number.isFinite(subscriptionFeeCents) || subscriptionFeeCents < 100) {
      return Response.json(
        { error: 'Subscription price must be at least €1.00' },
        { status: 400 }
      );
    }

    // Get the current user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creator: true },
    });

    if (!user) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user is already a creator
    if (user.creator) {
      return Response.json(
        { error: 'User is already a creator' },
        { status: 400 }
      );
    }

    // Create creator profile
    const creator = await prisma.creator.create({
      data: {
        userId: user.id,
        displayName,
        username: displayName.toLowerCase().replace(/\s+/g, '_'),
        bio: bio || '',
        subscriptionFee: subscriptionFeeCents,
        avatar: user.image || undefined,
      },
    });

    // Update user to mark as creator
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { isCreator: true },
      include: { creator: true },
    });

    return Response.json({
      success: true,
      user: updatedUser,
      creator: {
        ...creator,
        subscriptionFee: centsToEuros(creator.subscriptionFee),
      },
    });
  } catch (error) {
    console.error('Upgrade to creator error:', error);
    return Response.json(
      { error: 'Failed to upgrade to creator' },
      { status: 500 }
    );
  }
}
