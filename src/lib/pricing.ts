export function eurosToCents(amount: number) {
  return Math.round(amount * 100);
}

export function centsToEuros(amountCents: number) {
  return amountCents / 100;
}

export function formatEuro(amountCents: number) {
  return centsToEuros(amountCents).toFixed(2);
}
