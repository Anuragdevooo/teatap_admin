import { cn } from '@/lib/cn';

interface ProgressProps {
  value: number;
  max?: number;
  /** Colour is semantic, not decorative — pass `auto` to derive from fill. */
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'auto';
  size?: 'xs' | 'sm' | 'md';
  label?: string;
  /** Moving diagonal stripes. Only for work still in flight — a paused or
   *  finished bar that keeps animating reads as a lie. */
  striped?: boolean;
  className?: string;
}

const TONES = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
} as const;

export function Progress({
  value,
  max = 100,
  tone = 'primary',
  size = 'sm',
  label,
  striped = false,
  className,
}: ProgressProps) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  const resolved =
    tone === 'auto' ? (pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success') : tone;

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
      aria-label={label}
      className={cn(
        'w-full overflow-hidden rounded-full bg-surface-3',
        size === 'xs' ? 'h-1' : size === 'sm' ? 'h-1.5' : 'h-2.5',
        className,
      )}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-quint)]',
          TONES[resolved],
          striped && 'bar-stripes',
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
