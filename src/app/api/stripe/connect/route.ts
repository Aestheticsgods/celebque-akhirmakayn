import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { hasStripeSecretKey, stripe } from '@/lib/stripe';

function getSafeErrorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'type' in error) {
    const stripeError = error as { type?: string; code?: string; message?: string };
    if (stripeError.message) {
      return `${stripeError.type || 'stripe_error'}${stripeError.code ? ` (${stripeError.code})` : ''}: ${stripeError.message}`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Unexpected Stripe Connect error';
}

const STRIPE_MOCK_MODE =
  process.env.STRIPE_MOCK_MODE === 'true' ||
  process.env.STRIPE_SECRET_KEY?.includes('REPLACE_ME');

function resolveAppUrl(req: NextRequest) {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const origin = req.nextUrl.origin;
  return origin.replace(/\/$/, '');
}

function isSecureOrLocal(url: string) {
  return url.startsWith('https://') || url.startsWith('http://localhost');
}

// POST — Create or refresh a Stripe Connect Express account link for the creator
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creator: true },
    });

    if (!user?.creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const creator = user.creator;
    const appUrl = resolveAppUrl(req);

    if (!STRIPE_MOCK_MODE && !hasStripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured: missing STRIPE_SECRET_KEY' },
        { status: 500 }
      );
    }

    if (!isSecureOrLocal(appUrl)) {
      return NextResponse.json(
        {
          error: 'Invalid NEXT_PUBLIC_APP_URL. Use https:// in production (or http://localhost locally).',
        },
        { status: 500 }
      );
    }

    if (STRIPE_MOCK_MODE) {
      await prisma.creator.update({
        where: { id: creator.id },
        data: {
          stripeAccountId: creator.stripeAccountId || `acct_mock_${creator.id}`,
          stripeOnboardingComplete: true,
        },
      });

      return NextResponse.json({
        url: `${appUrl}/creator/dashboard?stripe_success=1&mock=1`,
      });
    }

    // Create Connect account if the creator doesn't have one yet
    let stripeAccountId = creator.stripeAccountId;
    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        email: user.email,
        metadata: { creatorId: creator.id, userId: user.id },
        capabilities: {
          transfers: { requested: true },
        },
      });

      stripeAccountId = account.id;

      await prisma.creator.update({
        where: { id: creator.id },
        data: { stripeAccountId },
      });
    }

    // Generate an Account Link for onboarding (or re-onboarding)
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/creator/dashboard?stripe_refresh=1`,
      return_url: `${appUrl}/creator/dashboard?stripe_success=1`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error('[stripe/connect] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create Connect account link',
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// GET — Check the current Connect onboarding status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { creator: true },
    });

    if (!user?.creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const creator = user.creator;

    if (!STRIPE_MOCK_MODE && !hasStripeSecretKey) {
      return NextResponse.json(
        { error: 'Stripe is not configured: missing STRIPE_SECRET_KEY' },
        { status: 500 }
      );
    }

    if (STRIPE_MOCK_MODE) {
      return NextResponse.json({
        connected: true,
        chargesEnabled: true,
        payoutsEnabled: true,
        complete: true,
        mock: true,
      });
    }

    if (!creator.stripeAccountId) {
      return NextResponse.json({ connected: false, chargesEnabled: false, payoutsEnabled: false });
    }

    // Fetch live status from Stripe
    const account = await stripe.accounts.retrieve(creator.stripeAccountId);
    const complete = (account.charges_enabled ?? false) && (account.payouts_enabled ?? false);

    // Sync to DB if it changed
    if (complete !== creator.stripeOnboardingComplete) {
      await prisma.creator.update({
        where: { id: creator.id },
        data: { stripeOnboardingComplete: complete },
      });
    }

    return NextResponse.json({
      connected: true,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      complete,
    });
  } catch (error) {
    console.error('[stripe/connect GET] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to check Connect status',
        details: getSafeErrorMessage(error),
      },
      { status: 500 }
    );
  }
}
