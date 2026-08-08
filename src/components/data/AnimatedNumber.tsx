import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/cn';

interface AnimatedNumberProps {
  value: number;
  /** Formatter applied to every intermediate frame, not just the final value. */
  format: (value: number) => string;
  duration?: number;
  className?: string;
}

const easeOutQuint = (t: number) => 1 - (1 - t) ** 5;

/**
 * Counts from the previous value to the next one.
 *
 * KPI tiles change when a filter or a mutation lands, and an instant jump
 * makes it easy to miss which number moved. The tween is short and eased so
 * it reads as "this updated", not as a slot machine — and it respects
 * `prefers-reduced-motion` by snapping straight to the final value.
 */
export function AnimatedNumber({ value, format, duration = 700, className }: AnimatedNumberProps) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const frameRef = useRef(0);

  useEffect(() => {
    const from = fromRef.current;
    if (from === value) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      fromRef.current = value;
      setDisplay(value);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      setDisplay(from + (value - from) * easeOutQuint(progress));
      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = value;
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span className={cn('tnum', className)}>{format(Math.round(display))}</span>;
}
