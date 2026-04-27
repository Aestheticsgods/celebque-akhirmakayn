export function dollarsToCents(amount: number) {
  return Math.round(amount * 100);
}

const parsedGlobalFee = Number(
  process.env.NEXT_PUBLIC_GLOBAL_SUBSCRIPTION_FEE_USD ??
  '9.99'
);

export const GLOBAL_SUBSCRIPTION_FEE_USD = Number.isFinite(parsedGlobalFee) && parsedGlobalFee > 0
  ? parsedGlobalFee
  : 9.99;
export const GLOBAL_SUBSCRIPTION_FEE_CENTS = dollarsToCents(GLOBAL_SUBSCRIPTION_FEE_USD);

export function centsToDollars(amountCents: number) {
  return amountCents / 100;
}

export function formatUsd(amountCents: number) {
  return centsToDollars(amountCents).toFixed(2);
}
