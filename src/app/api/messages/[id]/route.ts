import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';


// GET - Get messages in a conversation
export async function GET(
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

    const { id } = await params; // conversation ID
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify user is part of conversation
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          select: { id: true },
        },
      },
    });

    if (!conversation || !conversation.participants.some((p: any) => p.id === user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.message.count({ where: { conversationId: id } }),
    ]);

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        conversationId: id,
        receiverId: user.id,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json(
      {
        data: messages.reverse(),
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
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a message
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

    const { id } = await params; // message ID

    const message = await prisma.message.findUnique({
      where: { id },
      include: { sender: true },
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify ownership
    if (message.sender.email !== session.user.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Message deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
