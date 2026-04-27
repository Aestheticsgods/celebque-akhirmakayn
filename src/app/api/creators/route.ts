import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { GLOBAL_SUBSCRIPTION_FEE_CENTS, centsToDollars } from '@/lib/pricing';

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

// GET all creators with pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { displayName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    const [creators, total] = await Promise.all([
      prisma.creator.findMany({
        where,
        select: {
          id: true,
          userId: true,
          displayName: true,
          username: true,
          avatar: true,
          banner: true,
          bio: true,
          subscriptionFee: true,
          isVerified: true,
          category: true,
          user: {
            select: {
              email: true,
              image: true,
            },
          },
          subscribers: {
            where: { isActive: true },
            select: { subscriberId: true },
          },
          posts: {
            select: { id: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.creator.count({ where }),
    ]);

    const creatorsWithStats = creators.map((creator: any) => ({
      ...creator,
      avatar: normalizeAssetUrl(creator.avatar || creator.user?.image) || undefined,
      banner: normalizeAssetUrl(creator.banner) || undefined,
      subscriptionFee: centsToDollars(creator.subscriptionFee),
      subscriberCount: creator.subscribers.length,
      postCount: creator.posts.length,
    }));

    return NextResponse.json(
      {
        data: creatorsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching creators:', error);
    return NextResponse.json(
      { error: 'Failed to fetch creators' },
      { status: 500 }
    );
  }
}

// POST - Create a new creator profile
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
    const { displayName, username, bio, category, website } = body;

    if (!displayName || !username) {
      return NextResponse.json(
        { error: 'Display name and username are required' },
        { status: 400 }
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

    if (user.isCreator) {
      return NextResponse.json(
        { error: 'User is already a creator' },
        { status: 400 }
      );
    }

    // Check if username is unique
    const existingCreator = await prisma.creator.findUnique({
      where: { username },
    });

    if (existingCreator) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 400 }
      );
    }

    const creator = await prisma.creator.create({
      data: {
        userId: user.id,
        displayName,
        username,
        bio: bio || null,
        subscriptionFee: GLOBAL_SUBSCRIPTION_FEE_CENTS,
        category: category || null,
        website: website || null,
      },
    });

    // Update user role
    await prisma.user.update({
      where: { id: user.id },
      data: { isCreator: true, role: 'CREATOR' },
    });

    return NextResponse.json(
      {
        ...creator,
        subscriptionFee: centsToDollars(creator.subscriptionFee),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating creator:', error);
    return NextResponse.json(
      { error: 'Failed to create creator profile' },
      { status: 500 }
    );
  }
}
