import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { centsToDollars } from '@/lib/pricing';

function normalizeAssetUrl(url: unknown): unknown {
  if (typeof url !== 'string' || !url) return url;
  if (url.startsWith('/api/media/')) return url;
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith('/uploads/media/')) {
      const filename = parsed.pathname.split('/').pop();
      if (filename) return `/api/media/${filename}${parsed.search}${parsed.hash}`;
    }
  } catch {
    if (url.startsWith('/uploads/media/')) {
      const filename = url.split('/').pop();
      if (filename) return `/api/media/${filename}`;
    }
  }
  if (!url.startsWith('/') && !url.startsWith('http') && /\.(png|jpg|jpeg|gif|webp|mp4|webm)$/i.test(url)) {
    return `/api/media/${url}`;
  }
  return url;
}

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
            image: true,
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
        avatar: normalizeAssetUrl(creator.avatar || creator.user?.image) || undefined,
        banner: normalizeAssetUrl(creator.banner) || undefined,
        subscriptionFee: centsToDollars(creator.subscriptionFee),
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

    const { displayName, bio, avatar, banner, category, website } = body;

    const updatedCreator = await prisma.creator.update({
      where: { id },
      data: {
        ...(displayName && { displayName }),
        ...(bio !== undefined && { bio }),
        ...(avatar && { avatar }),
        ...(banner && { banner }),
        ...(category && { category }),
        ...(website && { website }),
      },
    });

    return NextResponse.json(
      {
        ...updatedCreator,
        subscriptionFee: centsToDollars(updatedCreator.subscriptionFee),
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
