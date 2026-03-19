import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// GET all posts with filters and pagination
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const creatorId = searchParams.get('creatorId');
    const visibility = searchParams.get('visibility');

    const skip = (page - 1) * limit;

    const where: any = {};

    // Only filter by visibility if explicitly specified
    if (visibility) {
      where.visibility = visibility;
    }

    if (creatorId) {
      where.creatorId = creatorId;
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          creator: true,
          _count: {
            select: {
              comments: true,
              likes: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json(
      {
        data: posts.map((post: any) => ({
          ...post,
          commentCount: post._count.comments,
          likeCount: post._count.likes,
        })),
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
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST - Create a new post
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
    const { caption, content, mediaUrls, mediaType, visibility, isLocked, tags } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.isCreator) {
      return NextResponse.json(
        { error: 'User must be a creator to post content' },
        { status: 403 }
      );
    }

    // Get creator profile
    const creator = await prisma.creator.findUnique({
      where: { userId: user.id },
    });

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    // Validate mediaUrls
    if (!mediaUrls || mediaUrls.length === 0) {
      return NextResponse.json(
        { error: 'At least one media URL is required' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        creatorId: creator.id,
        caption: caption || null,
        content: content || null,
        mediaUrls: mediaUrls,
        mediaType: mediaType || 'image',
        visibility: visibility || 'PUBLIC',
        isLocked: isLocked || false,
        tags: tags || [],
      },
      include: {
        creator: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}
