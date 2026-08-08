import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { seriesColor } from './primitives';

export interface LegendEntry {
  label: string;
  color: string;
  /** Optional formatted value shown after the label. */
  value?: string;
}

/**
 * Legend — present whenever there are two or more series, so identity is
 * never carried by colour alone. A single-series chart omits it; the card
 * title names the series.
 */
export function Legend({ entries, className }: { entries: LegendEntry[]; className?: string }) {
  return (
    <ul className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5', className)}>
      {entries.map((e) => (
        <li key={e.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className="size-2.5 shrink-0 rounded-[3px]"
            style={{ background: e.color }}
          />
          <span className="text-[11px] font-semibold text-muted">{e.label}</span>
          {e.value && <span className="tnum text-[11px] font-bold text-fg">{e.value}</span>}
        </li>
      ))}
    </ul>
  );
}

export const legendFromLabels = (labels: readonly string[]): LegendEntry[] =>
  labels.map((label, i) => ({ label, color: seriesColor(i) }));

interface TooltipProps {
  /** Horizontal position within the plot, 0–100. */
  xPct: number;
  title: string;
  rows: Array<{ label: string; value: string; color?: string }>;
}

/**
 * Absolutely-positioned HTML tooltip (not SVG `<text>`) so it can use real
 * type, wrap, and escape the plot's clip region.
 *
 * It rides along the top of the plot and flips its anchor near the edges, so
 * it never spills outside the card — which is what made it unreadable at the
 * first and last data point.
 */
export function ChartTooltip({ xPct, title, rows }: TooltipProps) {
  const nearLeft = xPct < 18;
  const nearRight = xPct > 82;

  return (
    <div
      className={cn(
        'pointer-events-none absolute top-1 z-20 min-w-32 rounded-lg border border-border bg-surface px-2.5 py-2 shadow-lg animate-fade-in',
        nearLeft ? 'translate-x-0' : nearRight ? '-translate-x-full' : '-translate-x-1/2',
      )}
      style={{ left: `${xPct}%` }}
    >
      <p className="mb-1 text-[11px] font-bold text-fg">{title}</p>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted">
            {r.color && (
              <span aria-hidden className="size-2 rounded-[2px]" style={{ background: r.color }} />
            )}
            {r.label}
          </span>
          <span className="tnum text-[11px] font-bold text-fg">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

interface AxisLabelsProps {
  labels: readonly string[];
  /**
   * `band` centres each label under its slot — bars occupy a band, so their
   * label belongs at the band's centre. `point` places labels *at* the data
   * point, which for a line/area chart means the first sits on the left edge
   * and the last on the right edge.
   */
  mode?: 'band' | 'point';
  /** Measured plot width; used to decide how many labels actually fit. */
  width?: number;
  className?: string;
}

/** Widest label we let ourselves assume, in px — "01 Aug" at 10px. */
const LABEL_WIDTH = 46;

/**
 * Picks a stride so labels never collide: with 14 days in a 300px plot only
 * every third date is drawn. The first and last are always kept — they anchor
 * the range, and losing either makes the axis unreadable.
 */
function keepEvery(count: number, width: number): number {
  if (!width || count < 2) return 1;
  const fits = Math.max(2, Math.floor(width / LABEL_WIDTH));
  return Math.max(1, Math.ceil(count / fits));
}

export function XAxisLabels({ labels, mode = 'point', width = 0, className }: AxisLabelsProps) {
  const stride = keepEvery(labels.length, width);
  const visible = (i: number) => i % stride === 0 || i === labels.length - 1;

  if (mode === 'band') {
    // Equal-width cells mirror the bar slots exactly, so a label is always
    // centred under the mark it names.
    return (
      <div className={cn('mt-2 flex', className)} aria-hidden>
        {labels.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className="min-w-0 flex-1 truncate px-0.5 text-center text-[10px] font-medium text-subtle"
          >
            {visible(i) ? label : ''}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('relative mt-2 h-4', className)} aria-hidden>
      {labels.map((label, i) => {
        if (!visible(i)) return null;
        const pct = (i / Math.max(1, labels.length - 1)) * 100;
        const first = i === 0;
        const last = i === labels.length - 1;
        return (
          <span
            key={`${label}-${i}`}
            style={{ left: `${pct}%` }}
            className={cn(
              'absolute top-0 whitespace-nowrap text-[10px] font-medium text-subtle',
              // The end labels hug the plot edges instead of overhanging them.
              first ? 'translate-x-0' : last ? '-translate-x-full' : '-translate-x-1/2',
            )}
          >
            {label}
          </span>
        );
      })}
    </div>
  );
}

/** Screen-reader alternative — every chart ships one. */
export function ChartTable({
  caption,
  headers,
  rows,
}: {
  caption: string;
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {headers.map((h) => (
            <th key={h} scope="col">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((c, j) => (
              <td key={j}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
