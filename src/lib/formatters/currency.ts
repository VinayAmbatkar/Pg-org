// Backend money fields are decimal strings (e.g. "4000.00"), never floats — this only formats for
// display and never performs arithmetic. All totals/balances are backend-calculated.
export function formatCurrency(amount: string | number, currency = 'INR'): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(value)) return '—'

  if (currency === 'INR') {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(value)
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}
