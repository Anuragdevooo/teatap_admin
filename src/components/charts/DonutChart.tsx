import { useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { ChartTable, Legend } from './ChartFrame';
import { arcPath, seriesColor } from './primitives';

export interface DonutSlice {
  label: string;
  value: number;
}

interface DonutChartProps {
  slices: DonutSlice[];
  format: (value: number) => string;
  /** Rendered large in the hole — the headline the donut supports. */
  centerLabel: string;
  centerValue: string;
  size?: number;
  caption: string;
  className?: string;
}

const GAP_RADIANS = 0.02; // 2px-equivalent surface gap between segments

export function DonutChart({
  slices,
  format,
  centerLabel,
  centerValue,
  size = 176,
  caption,
  className,
}: DonutChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;

  const cx = 100;
  const cy = 100;
  const outer = 92;
  const inner = 62;

  let angle = 0;
  const arcs = slices.map((slice, i) => {
    const sweep = (slice.value / total) * Math.PI * 2;
    const d = arcPath(cx, cy, outer, inner, angle + GAP_RADIANS / 2, angle + sweep - GAP_RADIANS / 2);
    angle += sweep;
    return { d, color: seriesColor(i), slice };
  });

  const active = hover !== null ? slices[hover] : null;

  return (
    <figure className={cn('flex flex-col items-center gap-4 sm:flex-row sm:gap-6', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg viewBox="0 0 200 200" className="size-full" role="presentation">
          {arcs.map((a, i) => (
            <path
              key={a.slice.label}
              d={a.d}
              fill={a.color}
              stroke="var(--surface)"
              strokeWidth={2}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={
                {
                  animationDelay: `${i * 80}ms`,
                  transformOrigin: `${cx}px ${cy}px`,
                } as CSSProperties
              }
              className={cn(
                'animate-sweep cursor-default transition-[opacity,transform] duration-200',
                hover === i && 'scale-[1.035]',
                hover !== null && hover !== i && 'opacity-35',
              )}
            />
          ))}
        </svg>

        <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
          <p className="tnum text-xl font-extrabold leading-none tracking-tight text-fg">
            {active ? format(active.value) : centerValue}
          </p>
          <p className="mt-1 max-w-24 text-[10px] font-semibold uppercase tracking-wide text-muted">
            {active ? active.label : centerLabel}
          </p>
        </div>
      </div>

      <Legend
        className="flex-col items-start gap-2 sm:flex"
        entries={slices.map((s, i) => ({
          label: s.label,
          color: seriesColor(i),
          value: `${format(s.value)} · ${Math.round((s.value / total) * 100)}%`,
        }))}
      />

      <ChartTable
        caption={caption}
        headers={['Segment', 'Value', 'Share']}
        rows={slices.map((s) => [
          s.label,
          format(s.value),
          `${Math.round((s.value / total) * 100)}%`,
        ])}
      />
    </figure>
  );
}
