import { useMemo, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/cn';
import { useElementWidth } from '@/lib/hooks';
import { ChartTable, ChartTooltip, Legend, XAxisLabels } from './ChartFrame';
import { barPath, linearScale, niceMax, seriesColor, ticksFor } from './primitives';

export interface BarSeries {
  label: string;
  values: number[];
}

interface BarChartProps {
  series: BarSeries[];
  labels: string[];
  format: (value: number) => string;
  /** Stack only when the series sum to something real (collected + pending). */
  stacked?: boolean;
  height?: number;
  caption: string;
  showYAxis?: boolean;
  className?: string;
}

const PAD_TOP = 8;
const GAP = 2; // surface-coloured gap between adjacent and stacked marks

export function BarChart({
  series,
  labels,
  format,
  stacked = false,
  height = 200,
  caption,
  showYAxis = true,
  className,
}: BarChartProps) {
  const [wrapRef, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);

  const max = useMemo(() => {
    if (stacked) {
      const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
      return niceMax(Math.max(1, ...totals));
    }
    return niceMax(Math.max(1, ...series.flatMap((s) => s.values)));
  }, [series, labels, stacked]);

  const baseline = height;
  const y = linearScale([0, max], [baseline, PAD_TOP]);
  const slot = width / Math.max(1, labels.length);
  const band = Math.max(6, slot * 0.58);
  const barWidth = stacked ? band : Math.max(3, band / series.length);

  return (
    <figure className={cn('relative', className)}>
      <div className={cn('flex gap-2', showYAxis && 'pl-1')}>
        {showYAxis && (
          <div
            // height + 8 with a 16px line-height centres the first tick label
            // on the top gridline and the last one on the baseline.
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
          >
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

            {labels.map((label, i) => {
              const bandX = i * slot + (slot - band) / 2;
              let stackBottom = baseline;

              return (
                <g
                  key={`${label}-${i}`}
                  onMouseEnter={() => setHover(i)}
                  // Bars grow from the baseline, left to right — the reading
                  // order of the axis, so the eye follows the data in.
                  style={{ animationDelay: `${i * 55}ms` } as CSSProperties}
                  className={cn(
                    'animate-grow-up cursor-default transition-opacity duration-200',
                    // Dim the rest rather than highlight the one: the hovered
                    // bar keeps its true colour, so the value stays readable.
                    hover !== null && hover !== i && 'opacity-35',
                  )}
                >
                  {/* Hit target spans the whole slot — bigger than the mark. */}
                  <rect x={i * slot} y={0} width={slot} height={height} fill="transparent" />

                  {series.map((s, si) => {
                    const value = s.values[i] ?? 0;
                    const full = baseline - y(value);
                    if (stacked) {
                      // Draw GAP shorter than the true height so the surface
                      // shows through between segments, but advance the cursor
                      // by the true height so the stack total stays accurate.
                      const drawn = Math.max(0, full - GAP);
                      const top = stackBottom - drawn;
                      stackBottom -= full;
                      return (
                        <path
                          key={s.label}
                          d={barPath(bandX, top, barWidth, drawn, si === series.length - 1 ? 4 : 0)}
                          fill={seriesColor(si)}
                        />
                      );
                    }
                    return (
                      <path
                        key={s.label}
                        d={barPath(
                          bandX + si * barWidth,
                          y(value),
                          Math.max(2, barWidth - GAP),
                          full,
                        )}
                        fill={seriesColor(si)}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>

          {hover !== null && (
            <ChartTooltip
              xPct={((hover + 0.5) / labels.length) * 100}
              title={labels[hover] ?? ''}
              rows={series.map((s, i) => ({
                label: s.label,
                value: format(s.values[hover] ?? 0),
                color: series.length > 1 ? seriesColor(i) : undefined,
              }))}
            />
          )}

          <XAxisLabels labels={labels} mode="band" width={width} />
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
