import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';


// GET - Get user wallet
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

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    // Create wallet if doesn't exist
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id },
      });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json(
      {
        wallet,
        recentTransactions: transactions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch wallet' },
      { status: 500 }
    );
  }
}

// POST - Create transaction (subscription payment, withdrawal, etc)
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
    const { type, amount, description, relatedUserId } = body;

    if (!type || !amount) {
      return NextResponse.json(
        { error: 'Type and amount are required' },
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

    let wallet = await prisma.wallet.findUnique({
      where: { userId: user.id },
    });

    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId: user.id },
      });
    }

    // Handle subscription payment
    if (type === 'SUBSCRIPTION_PAYMENT') {
      if (wallet.balance < amount) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: user.id,
        type,
        amount,
        description: description || null,
        relatedUserId: relatedUserId || null,
        status: 'COMPLETED',
      },
    });

    // Update wallet
    if (type === 'SUBSCRIPTION_PAYMENT' || type === 'WITHDRAWAL') {
      await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { decrement: amount },
          totalSpent: { increment: amount },
        },
      });
    } else if (type === 'DEPOSIT') {
      await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { increment: amount },
          totalEarned: { increment: amount },
        },
      });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}
