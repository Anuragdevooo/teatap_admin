export type Period = 'week' | 'month' | 'year';

const DAY = 86_400_000;

export const PERIOD_OPTIONS = [
  { value: 'week' as const, label: 'Weekly' },
  { value: 'month' as const, label: 'Monthly' },
  { value: 'year' as const, label: 'Yearly' },
];

export const PERIOD_NOUN: Record<Period, string> = {
  week: 'this week',
  month: 'this month',
  year: 'this year',
};

/** Start of the ISO week (Monday) containing `at`. */
function startOfWeek(at: number): number {
  const d = new Date(at);
  d.setHours(0, 0, 0, 0);
  const shift = (d.getDay() + 6) % 7; // Sunday(0) → 6
  return d.getTime() - shift * DAY;
}

const startOfMonth = (at: number) => {
  const d = new Date(at);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
};

const startOfYear = (at: number) => new Date(new Date(at).getFullYear(), 0, 1).getTime();

export const startOfPeriod = (at: number, period: Period) =>
  period === 'week' ? startOfWeek(at) : period === 'month' ? startOfMonth(at) : startOfYear(at);

/** Start of the bucket `back` periods before the one containing `at`. */
function shiftPeriod(at: number, period: Period, back: number): number {
  const d = new Date(startOfPeriod(at, period));
  if (period === 'week') return d.getTime() - back * 7 * DAY;
  if (period === 'month') return new Date(d.getFullYear(), d.getMonth() - back, 1).getTime();
  return new Date(d.getFullYear() - back, 0, 1).getTime();
}

const LABEL: Record<Period, Intl.DateTimeFormatOptions> = {
  week: { day: '2-digit', month: 'short' },
  month: { month: 'short' },
  year: { year: 'numeric' },
};

/**
 * Running total of records that existed by the end of each bucket.
 *
 * Growth charts have to be cumulative — "how many customers do we have" — not
 * per-period arrivals, or the line falls off a cliff in any quiet month and
 * reads as churn that never happened.
 */
export function cumulativeByPeriod<T>(
  items: readonly T[],
  getDate: (item: T) => number,
  period: Period,
  buckets = period === 'year' ? 4 : period === 'month' ? 6 : 8,
  now = Date.now(),
): { labels: string[]; values: number[] } {
  const starts = Array.from({ length: buckets }, (_, i) =>
    shiftPeriod(now, period, buckets - 1 - i),
  );

  return {
    labels: starts.map((s) => new Date(s).toLocaleDateString('en-IN', LABEL[period])),
    values: starts.map((_, i) => {
      // The final bucket is still open, so it counts everything up to now.
      const cutoff = starts[i + 1] ?? now;
      return items.filter((item) => getDate(item) <= cutoff).length;
    }),
  };
}

/** Distinct years present in the data, newest first — drives the year picker. */
export function yearsIn<T>(items: readonly T[], getDate: (item: T) => number): number[] {
  const years = new Set(items.map((item) => new Date(getDate(item)).getFullYear()));
  return [...years].sort((a, b) => b - a);
}

/**
 * Last instant of a year, used as the bucket anchor when the admin has pinned
 * one — otherwise "last 6 months" of 2025 would still be measured from today.
 */
export const endOfYear = (year: number) => new Date(year, 11, 31, 23, 59, 59).getTime();

export interface PeriodSeries {
  labels: string[];
  values: number[];
  /** Total for the current (rightmost) bucket. */
  current: number;
  /** Total for the bucket before it — the comparison an admin wants. */
  previous: number;
  /** Percentage change, current vs previous. 0 when there is no baseline. */
  deltaPct: number;
  /** Sum across every bucket shown. */
  total: number;
}

/**
 * Buckets dated amounts into calendar weeks, months or years.
 *
 * Calendar-aligned rather than rolling: "this month" has to mean the month on
 * the wall, otherwise the number here never matches the number the finance
 * person quotes.
 */
export function bucketByPeriod<T>(
  items: readonly T[],
  getDate: (item: T) => number,
  getAmount: (item: T) => number,
  period: Period,
  buckets = period === 'year' ? 4 : period === 'month' ? 6 : 8,
  now = Date.now(),
): PeriodSeries {
  const starts = Array.from({ length: buckets }, (_, i) =>
    shiftPeriod(now, period, buckets - 1 - i),
  );

  const values = starts.map((start, i) => {
    const end = starts[i + 1] ?? Number.POSITIVE_INFINITY;
    return items
      .filter((item) => getDate(item) >= start && getDate(item) < end)
      .reduce((sum, item) => sum + getAmount(item), 0);
  });

  const current = values[values.length - 1] ?? 0;
  const previous = values[values.length - 2] ?? 0;

  return {
    labels: starts.map((s) => new Date(s).toLocaleDateString('en-IN', LABEL[period])),
    values,
    current,
    previous,
    deltaPct: previous > 0 ? ((current - previous) / previous) * 100 : 0,
    total: values.reduce((a, b) => a + b, 0),
  };
}
