import { useLayoutEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

interface Thumb {
  left: number;
  width: number;
}

/**
 * For mutually exclusive, low-cardinality choices that change a view rather
 * than submit data — date ranges, chart granularity. Not a form control.
 *
 * The brand fill is a single measured element that slides between segments
 * instead of a background toggled per button: the travel is what tells you
 * which option you left, and a cross-fade between two static chips cannot.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  const trackRef = useRef<HTMLDivElement>(null);
  const segRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [thumb, setThumb] = useState<Thumb | null>(null);
  // The first measurement must land without travel — otherwise the thumb
  // visibly flies in from the left edge on every mount.
  const measured = useRef(false);

  useLayoutEffect(() => {
    const measure = () => {
      const active = segRefs.current[value];
      if (!active) return;
      setThumb({ left: active.offsetLeft, width: active.offsetWidth });
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, [value, options]);

  useLayoutEffect(() => {
    if (thumb) measured.current = true;
  }, [thumb]);

  // Arrow keys walk the group, which is what a radiogroup is expected to do.
  const step = (delta: number) => {
    const i = options.findIndex((o) => o.value === value);
    if (i < 0) return;
    const next = options[(i + delta + options.length) % options.length];
    onChange(next.value);
    segRefs.current[next.value]?.focus();
  };

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          step(1);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          step(-1);
        }
      }}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-[10px] border border-border bg-surface-2 p-0.5',
        className,
      )}
    >
      {/* Brand fill on the selected segment. A neutral chip on a neutral
          track is legible only if you already know which one is active. */}
      {thumb && (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0.5 rounded-lg bg-primary shadow-xs',
            measured.current &&
              'transition-[left,width] duration-300 ease-[var(--ease-out-quint)]',
          )}
          style={{ left: thumb.left, width: thumb.width }}
        />
      )}

      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            ref={(el) => {
              segRefs.current[o.value] = el;
            }}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              'press relative z-10 rounded-lg font-semibold',
              'transition-[color,transform] duration-200 ease-[var(--ease-out-quint)]',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
              active ? 'text-primary-fg' : 'text-muted hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
