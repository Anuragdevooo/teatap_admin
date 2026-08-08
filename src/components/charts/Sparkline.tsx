import { cn } from '@/lib/cn';
import { linearScale, smoothPath } from './primitives';

interface SparklineProps {
  values: number[];
  /** Semantic, not decorative: green when the trend is good for the user. */
  tone?: 'primary' | 'success' | 'danger' | 'muted';
  height?: number;
  className?: string;
  /** Sparklines carry no axis, so the label must come from the caller. */
  ariaLabel: string;
}

const TONES = {
  primary: 'var(--chart-1)',
  success: 'var(--success)',
  danger: 'var(--danger)',
  muted: 'var(--chart-axis)',
} as const;

/**
 * A trend shape, not a readable chart — no axes, no tooltip. Pair it with the
 * number it describes; never use one as the only source of a value.
 */
export function Sparkline({
  values,
  tone = 'primary',
  height = 34,
  className,
  ariaLabel,
}: SparklineProps) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const x = linearScale([0, Math.max(1, values.length - 1)], [0, 100]);
  const y = linearScale([min === max ? min - 1 : min, max], [26, 4]);
  const points = values.map((v, i) => [x(i), y(v)] as [number, number]);
  const line = smoothPath(points);

  return (
    <svg
      viewBox="0 0 100 30"
      preserveAspectRatio="none"
      style={{ height }}
      className={cn('w-full', className)}
      role="img"
      aria-label={ariaLabel}
    >
      <path d={`${line} L100,30 L0,30 Z`} fill={TONES[tone]} opacity={0.1} />
      <path
        d={line}
        fill="none"
        stroke={TONES[tone]}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
