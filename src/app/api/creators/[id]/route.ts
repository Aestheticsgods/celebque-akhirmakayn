import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { centsToEuros, eurosToCents } from '@/lib/pricing';

// GET single creator by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const creator = await prisma.creator.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isVerified: true,
          },
        },
        posts: {
          select: { id: true },
        },
        subscribers: {
          select: { subscriberId: true },
        },
      },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        ...creator,
        subscriptionFee: centsToEuros(creator.subscriptionFee),
        postCount: creator.posts.length,
        subscriberCount: creator.subscribers.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching creator:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creator' },
      { status: 500 }
    );
  }
}

// PUT - Update creator profile
export async function PUT(
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

    const { id } = await params;
    const body = await req.json();

    const creator = await prisma.creator.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (creator.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { displayName, bio, avatar, banner, subscriptionFee, category, website } = body;

    const subscriptionFeeCents = subscriptionFee !== undefined
      ? eurosToCents(Number(subscriptionFee))
      : undefined;

    const updatedCreator = await prisma.creator.update({
      where: { id },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatar && { avatar }),
        ...(banner && { banner }),
        ...(subscriptionFeeCents !== undefined && { subscriptionFee: subscriptionFeeCents }),
        ...(category && { category }),
        ...(website && { website }),
      },
    });

    return NextResponse.json(
      {
        ...updatedCreator,
        subscriptionFee: centsToEuros(updatedCreator.subscriptionFee),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating creator:', error);
    return NextResponse.json(
      { error: 'Failed to update creator' },
      { status: 500 }
    );
  }
}

// DELETE - Delete creator profile
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

    const { id } = await params;

    const creator = await prisma.creator.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (creator.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.creator.delete({
      where: { id },
    });

    // Update user
    await prisma.user.update({
      where: { id: creator.userId },
      data: { isCreator: false, role: 'USER' },
    });

    return NextResponse.json(
      { message: 'Creator profile deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting creator:', error);
    return NextResponse.json(
      { error: 'Failed to delete creator' },
      { status: 500 }
    );
  }
}
