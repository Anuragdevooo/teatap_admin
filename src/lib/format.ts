/**
 * Formatting helpers.
 *
 * Domain rules (mirrors the TeaTap API contract):
 *  - money is whole rupees, never fractional
 *  - timestamps are epoch milliseconds
 */

const RUPEE_FMT = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const NUM_FMT = new Intl.NumberFormat('en-IN');

/** ₹1,20,000 */
export const money = (rupees: number) => RUPEE_FMT.format(rupees);

/** ₹1.2L / ₹90k / ₹420 — for dense KPI tiles and axis labels. */
export function moneyCompact(rupees: number): string {
  const abs = Math.abs(rupees);
  if (abs >= 1_00_00_000) return `₹${trim(rupees / 1_00_00_000)}Cr`;
  if (abs >= 1_00_000) return `₹${trim(rupees / 1_00_000)}L`;
  if (abs >= 1_000) return `₹${trim(rupees / 1_000)}k`;
  return `₹${NUM_FMT.format(rupees)}`;
}

/** 1,20,000 */
export const num = (n: number) => NUM_FMT.format(n);

export function numCompact(n: number): string {
  if (Math.abs(n) >= 1_00_000) return `${trim(n / 1_00_000)}L`;
  if (Math.abs(n) >= 1_000) return `${trim(n / 1_000)}k`;
  return NUM_FMT.format(n);
}

const trim = (n: number) => (n % 1 === 0 ? String(n) : n.toFixed(1));

export const percent = (value: number, digits = 0) => `${value.toFixed(digits)}%`;

/** Signed delta for trend chips: +12.4% / −3% */
export const signed = (value: number, digits = 1) =>
  `${value > 0 ? '+' : value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}%`;

/** 08 Aug 2026 */
export const date = (ms: number) =>
  new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

/** 08 Aug */
export const dateShort = (ms: number) =>
  new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

/** 08 Aug 2026, 4:20 pm */
export const dateTime = (ms: number) =>
  new Date(ms).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const RELATIVE = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
];

/** "2 hours ago" — anchored to `now` so mock data stays deterministic in tests. */
export function relativeTime(ms: number, now = Date.now()): string {
  let duration = (ms - now) / 1000;
  for (const division of DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return RELATIVE.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }
  return date(ms);
}

/** "RK" — max two glyphs, never empty for a non-empty name. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** +91 98765 43210 */
export function phone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(-10);
  if (digits.length !== 10) return raw;
  return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
}

export const pluralize = (count: number, one: string, many = `${one}s`) =>
  `${num(count)} ${count === 1 ? one : many}`;
