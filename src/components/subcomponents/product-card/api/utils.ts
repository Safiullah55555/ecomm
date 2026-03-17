// ─── Price & discount helpers ─────────────────────────────────────────────────
// Prices stored as integers in cents (e.g. 24900 = $249.00)
// This avoids floating-point bugs in financial logic.

export function formatPrice(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

export function calcDiscount(price: number, originalPrice: number): number {
  if (originalPrice <= 0) return 0
  return Math.round(((originalPrice - price) / originalPrice) * 100)
}

export function calcStockPercent(stock: number, max: number): number {
  if (max <= 0) return 0
  return Math.min(100, Math.round((stock / max) * 100))
}