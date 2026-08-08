import { useMemo, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { useElementWidth, useId } from '@/lib/hooks';
import { ChartTable, ChartTooltip, Legend, XAxisLabels } from './ChartFrame';
import { linearScale, niceMax, seriesColor, smoothPath, ticksFor } from './primitives';

export interface AreaSeries {
  label: string;
  values: number[];
}

interface AreaChartProps {
  series: AreaSeries[];
  labels: string[];
  /** Formats tooltip and axis values — the chart never guesses at units. */
  format: (value: number) => string;
  height?: number;
  /** Caption for the screen-reader table alternative. */
  caption: string;
  /** Hide the value axis when the tooltip is the intended read. */
  showYAxis?: boolean;
  className?: string;
}

const PAD_TOP = 8;
const PAD_BOTTOM = 4;

/**
 * Trend over time. One series → no legend (the card title names it); two or
 * more → a legend, always. Crosshair + tooltip ship by default.
 */
export function AreaChart({
  series,
  labels,
  format,
  height = 200,
  caption,
  showYAxis = true,
  className,
}: AreaChartProps) {
  const gradientId = useId('area');
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(
    () => niceMax(Math.max(1, ...series.flatMap((s) => s.values))),
    [series],
  );

  const count = labels.length;
  const plotH = height - PAD_TOP - PAD_BOTTOM;
  const x = linearScale([0, Math.max(1, count - 1)], [0, width]);
  const y = linearScale([0, max], [PAD_TOP + plotH, PAD_TOP]);

  const paths = series.map((s) => {
    const points = s.values.map((v, i) => [x(i), y(v)] as [number, number]);
    const baseline = y(0);
    return {
      points,
      line: smoothPath(points),
      area: `${smoothPath(points)} L${width},${baseline} L0,${baseline} Z`,
    };
  });

  return (
    <figure className={cn('relative', className)}>
      <div className={cn('flex gap-2', showYAxis && 'pl-1')}>
        {showYAxis && (
          <div
            // height + 8 with a 16px line-height centres the first tick label
            // on the top grid line and the last one on the baseline.
            className="flex shrink-0 flex-col justify-between text-right"
            style={{ height: height + 8 }}
            aria-hidden
          >
            {[...ticksFor(max)].reverse().map((t) => (
              <span key={t} className="tnum text-[10px] font-medium leading-4 text-subtle">
                {format(t)}
              </span>
            ))}
          </div>
        )}

        <div ref={wrapRef} className="relative min-w-0 flex-1">
          <svg
            width={width || 1}
            height={height}
            className="block overflow-visible"
            role="presentation"
            onMouseLeave={() => setHover(null)}
            onMouseMove={(e) => {
              const box = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - box.left) / box.width;
              setHover(Math.max(0, Math.min(count - 1, Math.round(ratio * (count - 1)))));
            }}
          >
            <defs>
              {series.map((_, i) => (
                // Three stops, not two: a linear ramp to transparent reads as
                // a grey haze at the midpoint. Front-loading the fade keeps
                // the fill tinted where it meets the line and clean below it.
                <linearGradient key={i} id={`${gradientId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={seriesColor(i)} stopOpacity={0.32} />
                  <stop offset="45%" stopColor={seriesColor(i)} stopOpacity={0.12} />
                  <stop offset="100%" stopColor={seriesColor(i)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {/* Gridlines are reference, not content — they stay recessive. */}
            {ticksFor(max).map((t) => (
              <line
                key={t}
                x1={0}
                x2={width}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--chart-grid)"
                strokeWidth={1}
              />
            ))}

            {paths.map((p, i) => (
              <g key={series[i].label}>
                <path
                  d={p.area}
                  fill={`url(#${gradientId}-${i})`}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 120 + 260}ms`, animationDuration: '520ms' } as CSSProperties}
                />
                {/* pathLength normalises the stroke to 1 unit, so the draw-on
                    tween is identical whatever the chart's real width is. */}
                <path
                  d={p.line}
                  fill="none"
                  stroke={seriesColor(i)}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                  className="animate-draw"
                  style={{ '--draw-length': 1, animationDelay: `${i * 120}ms` } as CSSProperties}
                />
              </g>
            ))}

            {hover !== null && (
              <g>
                <line
                  x1={x(hover)}
                  x2={x(hover)}
                  y1={PAD_TOP}
                  y2={height}
                  stroke="var(--chart-axis)"
                  strokeWidth={1}
                  strokeDasharray="3 3"
                />
                {paths.map((p, i) => (
                  <g key={series[i].label}>
                    {/* Halo first, then the mark — the ring keeps the dot
                        legible where it sits on top of its own fill. */}
                    <circle
                      cx={p.points[hover]?.[0] ?? 0}
                      cy={p.points[hover]?.[1] ?? 0}
                      r={9}
                      fill={seriesColor(i)}
                      opacity={0.16}
                    />
                    <circle
                      cx={p.points[hover]?.[0] ?? 0}
                      cy={p.points[hover]?.[1] ?? 0}
                      r={4.5}
                      fill={seriesColor(i)}
                      stroke="var(--surface)"
                      strokeWidth={2}
                    />
                  </g>
                ))}
              </g>
            )}
          </svg>

          {hover !== null && (
            <ChartTooltip
              xPct={(hover / Math.max(1, count - 1)) * 100}
              title={labels[hover] ?? ''}
              rows={series.map((s, i) => ({
                label: s.label,
                value: format(s.values[hover] ?? 0),
                color: series.length > 1 ? seriesColor(i) : undefined,
              }))}
            />
          )}

          <XAxisLabels labels={labels} mode="point" width={width} />
        </div>
      </div>

      {series.length > 1 && (
        <Legend
          className="mt-3"
          entries={series.map((s, i) => ({ label: s.label, color: seriesColor(i) }))}
        />
      )}

      <ChartTable
        caption={caption}
        headers={['Period', ...series.map((s) => s.label)]}
        rows={labels.map((l, i) => [l, ...series.map((s) => format(s.values[i] ?? 0))])}
      />
    </figure>
  );
}
