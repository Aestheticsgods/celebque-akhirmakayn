import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';


// GET - Check if user liked a post
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (!session?.user?.email) {
      return NextResponse.json(
        { likeCount: post.likeCount, userLiked: false },
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { likeCount: post.likeCount, userLiked: false },
        { status: 200 }
      );
    }

    const like = await prisma.like.findFirst({
      where: {
        userId: user.id,
        postId: id,
        commentId: null,
      },
    });

    return NextResponse.json(
      {
        likeCount: post.likeCount,
        userLiked: !!like,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching like status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch like status' },
      { status: 500 }
    );
  }
}

// POST - Like a post
export async function POST(
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

    const [user, post] = await Promise.all([
      prisma.user.findUnique({ where: { email: session.user.email } }),
      prisma.post.findUnique({ where: { id } }),
    ]);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already liked
    const existingLike = await prisma.like.findFirst({
      where: {
        userId: user.id,
        postId: id,
        commentId: null,
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      await prisma.post.update({
        where: { id },
        data: { likeCount: { decrement: 1 } },
      });

      return NextResponse.json(
        { message: 'Post unliked', liked: false },
        { status: 200 }
      );
    }

    // Create like
    await prisma.like.create({
      data: {
        userId: user.id,
        postId: id,
      },
    });

    await prisma.post.update({
      where: { id },
      data: { likeCount: { increment: 1 } },
    });

    // Create notification for creator
    const creatorId = post.userId;
    if (creatorId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: creatorId,
          type: 'LIKE',
          title: 'New Like',
          message: `${user.name || 'Someone'} liked your post`,
          relatedId: id,
          relatedType: 'POST',
        },
      });
    }

    return NextResponse.json(
      { message: 'Post liked', liked: true },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error liking post:', error);
    return NextResponse.json(
      { error: 'Failed to like post' },
      { status: 500 }
    );
  }
}
