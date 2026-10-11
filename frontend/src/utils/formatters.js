/**
 * Utility functions for currency and date formatting.
 * Uses en-IN locale standard for Indian Rupee currency and Indian date conventions.
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Format numeric value as Indian Rupee currency string.
 * Example: 125000 -> "₹1,25,000.00"
 *
 * @param {number|string|null|undefined} amount - Numeric amount or string representation
 * @returns {string} Formatted INR currency string or fallback
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '₹0.00';
  }

  const numericValue = typeof amount === 'number' ? amount : Number(amount);

  if (isNaN(numericValue) || !isFinite(numericValue)) {
    return '₹0.00';
  }

  return inrFormatter.format(numericValue);
}

/**
 * Safely parse date input into Date object, preventing timezone shift
 * for date-only strings (YYYY-MM-DD).
 *
 * @param {string|Date|null|undefined} dateInput
 * @returns {Date|null}
 */
function parseSafeDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  if (typeof dateInput === 'string') {
    // If it's a date-only string like YYYY-MM-DD, parse year/month/day directly in local time
    // to avoid UTC conversion day shift.
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.trim());
    if (dateOnlyMatch) {
      const year = parseInt(dateOnlyMatch[1], 10);
      const month = parseInt(dateOnlyMatch[2], 10) - 1;
      const day = parseInt(dateOnlyMatch[3], 10);
      const d = new Date(year, month, day);
      return isNaN(d.getTime()) ? null : d;
    }

    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

/**
 * Format date in localized Indian format: "DD MMM YYYY" (e.g., "15 Jan 2026").
 *
 * @param {string|Date|null|undefined} dateInput - ISO string, YYYY-MM-DD, or Date object
 * @returns {string} Formatted date string or fallback
 */
export function formatDate(dateInput) {
  const date = parseSafeDate(dateInput);
  if (!date) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

/**
 * Format date-only string guaranteeing no timezone shifting.
 *
 * @param {string|Date|null|undefined} dateInput
 * @returns {string} Formatted date or fallback
 */
export function formatDateOnly(dateInput) {
  return formatDate(dateInput);
}

/**
 * Format date and time in localized Indian format: "DD MMM YYYY, hh:mm a"
 * (e.g., "15 Jan 2026, 02:30 pm").
 *
 * @param {string|Date|null|undefined} dateInput
 * @returns {string} Formatted date-time string or fallback
 */
export function formatDateTime(dateInput) {
  const date = parseSafeDate(dateInput);
  if (!date) return '—';

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}
