import { useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { ChartTable } from './ChartFrame';
import { seriesColor } from './primitives';

export interface CompositionSlice {
  label: string;
  value: number;
}

interface CompositionBarProps {
  slices: CompositionSlice[];
  format: (value: number) => string;
  /** Headline shown above the bar — usually the total. */
  totalLabel: string;
  caption: string;
  /**
   * Smallest share a segment may render at, in percent. Without a floor a 0.03%
   * segment collapses to a sub-pixel sliver and disappears entirely.
   */
  minShare?: number;
  className?: string;
}

/**
 * Part-to-whole for lopsided data.
 *
 * A donut is the wrong form when one category dwarfs the rest: at 99/1/0 every
 * segment but one collapses to a hairline and the ring says nothing. A single
 * stacked bar with a floored minimum width keeps small categories visible, and
 * the rows below carry the real numbers — which is what the reader wants
 * anyway once the proportion is this extreme.
 */
export function CompositionBar({
  slices,
  format,
  totalLabel,
  caption,
  minShare = 2.5,
  className,
}: CompositionBarProps) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;

  // True shares first, then a floor for the tiny ones, then re-normalise the
  // rest so the bar still adds up to exactly 100%.
  const raw = slices.map((s) => (s.value / total) * 100);
  const floored = raw.map((share) => (share > 0 && share < minShare ? minShare : share));
  const overflow = floored.reduce((a, b) => a + b, 0) - 100;
  const shrinkable = floored.reduce((sum, share) => sum + (share > minShare ? share : 0), 0);
  const widths = floored.map((share) =>
    share > minShare && shrinkable > 0 ? share - overflow * (share / shrinkable) : share,
  );

  return (
    <figure className={className}>
      <p className="tnum text-[26px] font-extrabold leading-none tracking-tight text-fg">
        {format(total)}
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-muted">
        {totalLabel}
      </p>

      <div
        className="mt-4 flex h-3.5 w-full overflow-hidden rounded-full bg-surface-3"
        onMouseLeave={() => setHover(null)}
      >
        {slices.map((slice, i) => (
          <span
            key={slice.label}
            onMouseEnter={() => setHover(i)}
            style={
              {
                width: `${widths[i]}%`,
                background: seriesColor(i),
                '--i': i,
              } as CSSProperties
            }
            className={cn(
              'animate-grow-right h-full transition-opacity duration-200',
              // A 2px surface gap keeps adjacent segments from bleeding together.
              i > 0 && 'border-l-2 border-surface',
              hover !== null && hover !== i && 'opacity-40',
            )}
            title={`${slice.label}: ${format(slice.value)}`}
          />
        ))}
      </div>

      <ul className="mt-4 space-y-2.5">
        {slices.map((slice, i) => {
          const share = (slice.value / total) * 100;
          return (
            <li
              key={slice.label}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ '--i': i } as CSSProperties}
              className={cn(
                'stagger-item flex items-center gap-2.5 rounded-lg px-1.5 py-1 transition-colors',
                hover === i && 'bg-surface-2',
              )}
            >
              <span
                aria-hidden
                className="size-2.5 shrink-0 rounded-[3px]"
                style={{ background: seriesColor(i) }}
              />
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">
                {slice.label}
              </span>
              <span className="tnum shrink-0 text-[13px] font-bold text-fg">
                {format(slice.value)}
              </span>
              <span className="tnum w-12 shrink-0 text-right text-[11px] font-semibold text-muted">
                {/* Below 0.1% a rounded percentage reads as a flat 0 — say so. */}
                {share < 0.1 ? '<0.1%' : `${share.toFixed(share < 10 ? 1 : 0)}%`}
              </span>
            </li>
          );
        })}
      </ul>

      <ChartTable
        caption={caption}
        headers={['Segment', 'Value', 'Share']}
        rows={slices.map((s) => [
          s.label,
          format(s.value),
          `${((s.value / total) * 100).toFixed(1)}%`,
        ])}
      />
    </figure>
  );
}
