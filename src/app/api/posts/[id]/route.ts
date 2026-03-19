import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

// GET single post by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const post = await prisma.post.findUnique({
      where: { id },
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
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        likes: {
          select: { userId: true },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return NextResponse.json(
      {
        ...post,
        commentCount: post._count.comments,
        likeCount: post._count.likes,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// PUT - Update post
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

    const post = await prisma.post.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (post.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { caption, content, visibility, isLocked, isPinned, tags } = body;

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        ...(caption !== undefined && { caption }),
        ...(content !== undefined && { content }),
        ...(visibility && { visibility }),
        ...(isLocked !== undefined && { isLocked }),
        ...(isPinned !== undefined && { isPinned }),
        ...(tags && { tags }),
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

    return NextResponse.json(updatedPost, { status: 200 });
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE - Delete post
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

    const post = await prisma.post.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (post.user.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.post.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Post deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
