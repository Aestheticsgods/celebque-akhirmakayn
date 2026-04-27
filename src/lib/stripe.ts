import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const hasStripeSecretKey = Boolean(stripeSecretKey);

export const stripe = new Stripe(stripeSecretKey || 'sk_test_placeholder', {
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
