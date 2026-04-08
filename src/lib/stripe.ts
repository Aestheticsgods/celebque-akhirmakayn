import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia' as any,
  typescript: true,
});

// 15% platform fee — creator keeps 85%
export const PLATFORM_FEE_PERCENT = 15;

/**
 * Given a gross amount in cents, returns the split between
 * creator earning and platform fee.
 */
export function calculateFees(amountCents: number) {
  const platformFee = Math.round(amountCents * (PLATFORM_FEE_PERCENT / 100));
  const creatorEarning = amountCents - platformFee;
  return { platformFee, creatorEarning };
}
