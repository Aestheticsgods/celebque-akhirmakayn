import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';


// GET - Get user conversations
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
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

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: user.id,
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    return NextResponse.json(
      { data: conversations },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST - Start conversation or send message
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
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { email: session.user.email } }),
      prisma.user.findUnique({ where: { id: receiverId } }),
    ]);

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender not found' },
        { status: 404 }
      );
    }

    if (!receiver) {
      return NextResponse.json(
        { error: 'Receiver not found' },
        { status: 404 }
      );
    }

    if (sender.id === receiver.id) {
      return NextResponse.json(
        { error: 'Cannot message yourself' },
        { status: 400 }
      );
    }

    // Find or create conversation
    let conversation = await prisma.conversation.findFirst({
      where: {
        AND: [
          {
            participants: {
              some: { id: sender.id },
            },
          },
          {
            participants: {
              some: { id: receiver.id },
            },
          },
        ],
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participants: {
            connect: [{ id: sender.id }, { id: receiver.id }],
          },
        },
      });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: sender.id,
        receiverId: receiver.id,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
      },
    });

    // Update conversation last message
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: content,
        lastMessageAt: new Date(),
      },
    });

    // Create notification
    await prisma.notification.create({
      data: {
        userId: receiver.id,
        type: 'MESSAGE',
        title: 'New Message',
        message: `${sender.name || 'Someone'} sent you a message`,
        relatedId: conversation.id,
        relatedType: 'CONVERSATION',
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
