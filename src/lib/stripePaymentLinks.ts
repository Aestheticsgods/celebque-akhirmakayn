import { stripe } from '@/lib/stripe';

export type PaymentLinkKind = 'subscription' | 'tip';

type PaymentLinkTarget = {
  paymentLinkId: string;
  url: string;
};

const configuredUrls: Record<PaymentLinkKind, string> = {
  subscription:
    process.env.STRIPE_SUBSCRIPTION_PAYMENT_LINK_URL ||
    'https://buy.stripe.com/28E7sN2RIecM0jUa6RcMM0L',
  tip:
    process.env.STRIPE_TIP_PAYMENT_LINK_URL ||
    'https://buy.stripe.com/cNi8wRdwmb0Ac2C1AlcMM0M',
};

const cachedTargets = new Map<PaymentLinkKind, PaymentLinkTarget>();

export async function getPaymentLinkTarget(kind: PaymentLinkKind): Promise<PaymentLinkTarget> {
  const cached = cachedTargets.get(kind);
  const targetUrl = configuredUrls[kind];

  if (cached && cached.url === targetUrl) {
    return cached;
  }

  for await (const paymentLink of stripe.paymentLinks.list({ limit: 100 })) {
    if (paymentLink.url === targetUrl) {
      const target = { paymentLinkId: paymentLink.id, url: paymentLink.url };
      cachedTargets.set(kind, target);
      return target;
    }
  }

  throw new Error(`Configured ${kind} payment link could not be resolved in Stripe`);
}

export function buildPaymentLinkRedirectUrl(url: string, email?: string) {
  const redirectUrl = new URL(url);

  if (email) {
    redirectUrl.searchParams.set('locked_prefilled_email', email);
  }

  redirectUrl.searchParams.set('locale', 'en');

  return redirectUrl.toString();
}