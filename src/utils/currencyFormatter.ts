/**
 * SJT FARMS - UNIFIED INR CURRENCY FORMATTER
 *
 * Provides consistent, standards-compliant formatting for Indian Rupee (INR) amounts.
 * Uses Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }) to ensure:
 * 1. Exactly ONE currency symbol (₹) rendered natively with no duplicates
 * 2. Proper Indian grouping (e.g. ₹1,450.00, ₹10,000.00)
 * 3. Exact 2-decimal precision matching trusted order totals
 * 4. Zero glyph misalignment when paired with modern font typography
 */

const inrCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a numeric amount or string into an INR currency string.
 * Example: formatInr(159) => "₹159.00"
 * Example: formatInr(1450.5) => "₹1,450.50"
 */
export function formatInr(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) {
    return '₹0.00';
  }
  const numericValue = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return '₹0.00';
  }
  return inrCurrencyFormatter.format(numericValue);
}

/**
 * Returns only the numeric formatted amount without currency symbol (for inputs, QR tags, or telemetry).
 * Example: formatInrValue(159) => "159.00"
 */
export function formatInrValue(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null) {
    return '0.00';
  }
  const numericValue = typeof amount === 'number' ? amount : Number(amount);
  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return '0.00';
  }
  return numericValue.toFixed(2);
}
