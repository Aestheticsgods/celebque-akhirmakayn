import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';


// DELETE - Unfollow a user
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

    const { id } = await params; // user to unfollow

    const follower = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!follower) {
      return NextResponse.json(
        { error: 'Follower not found' },
        { status: 404 }
      );
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: id,
        },
      },
    });

    if (!follow) {
      return NextResponse.json(
        { error: 'Not following this user' },
        { status: 404 }
      );
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: id,
        },
      },
    });

    return NextResponse.json(
      { message: 'Unfollowed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unfollowing:', error);
    return NextResponse.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    );
  }
}

// GET - Check if following
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    if (!session?.user?.email) {
      return NextResponse.json(
        { isFollowing: false },
        { status: 200 }
      );
    }

    const follower = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!follower) {
      return NextResponse.json(
        { isFollowing: false },
        { status: 200 }
      );
    }

    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: id,
        },
      },
    });

    return NextResponse.json(
      { isFollowing: !!follow },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error checking follow status:', error);
    return NextResponse.json(
      { error: 'Failed to check follow status' },
      { status: 500 }
    );
  }
}
