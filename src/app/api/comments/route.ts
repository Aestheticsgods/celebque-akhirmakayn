import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';


// GET - Get all comments for a post
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!postId) {
      return NextResponse.json(
        { error: 'Post ID is required' },
        { status: 400 }
      );
    }

    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { postId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          likes: {
            select: { userId: true },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.comment.count({ where: { postId } }),
    ]);

    return NextResponse.json(
      {
        data: comments.map((comment: any) => ({
          ...comment,
          likeCount: comment.likes.length,
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
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

// POST - Create a comment
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
    const { postId, content } = body;

    if (!postId || !content) {
      return NextResponse.json(
        { error: 'Post ID and content are required' },
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

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        postId,
        userId: user.id,
        content,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update comment count
    await prisma.post.update({
      where: { id: postId },
      data: { commentCount: { increment: 1 } },
    });

    // Create notification for post creator
    if (post.userId !== user.id) {
      await prisma.notification.create({
        data: {
          userId: post.userId,
          type: 'COMMENT',
          title: 'New Comment',
          message: `${user.name || 'Someone'} commented on your post`,
          relatedId: postId,
          relatedType: 'POST',
        },
      });
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
