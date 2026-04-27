import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';


// GET - Get followers for a user
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type') || 'followers'; // followers | following

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const follows = await prisma.follow.findMany({
      where: type === 'followers' ? { followingId: userId } : { followerId: userId },
      include: {
        follower: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
          },
        },
        following: {
          select: {
            id: true,
            name: true,
            image: true,
            bio: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = follows.map((f: any) => (type === 'followers' ? f.follower : f.following));

    return NextResponse.json(
      { data: result },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching follows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch follows' },
      { status: 500 }
    );
  }
}

// POST - Follow a user
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
    const { followingId } = body;

    if (!followingId) {
      return NextResponse.json(
        { error: 'Following ID is required' },
        { status: 400 }
      );
    }

    const [follower, following] = await Promise.all([
      prisma.user.findUnique({ where: { email: session.user.email } }),
      prisma.user.findUnique({ where: { id: followingId } }),
    ]);

    if (!follower) {
      return NextResponse.json(
        { error: 'Follower not found' },
        { status: 404 }
      );
    }

    if (!following) {
      return NextResponse.json(
        { error: 'User to follow not found' },
        { status: 404 }
      );
    }

    if (follower.id === following.id) {
      return NextResponse.json(
        { error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId,
        },
      },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: 'Already following this user' },
        { status: 400 }
      );
    }

    const follow = await prisma.follow.create({
      data: {
        followerId: follower.id,
        followingId,
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: 'FOLLOW',
        title: 'New Follower',
        message: `${follower.name || 'Someone'} started following you`,
        relatedId: follower.id,
        relatedType: 'USER',
      },
    });

    return NextResponse.json(follow, { status: 201 });
  } catch (error) {
    console.error('Error creating follow:', error);
    return NextResponse.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    );
  }
}
