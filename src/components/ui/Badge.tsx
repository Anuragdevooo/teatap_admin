import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-3 text-muted',
  brand: 'bg-primary-soft text-primary-soft-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  accent: 'bg-accent-soft text-accent-soft-fg',
};

const DOTS: Record<BadgeTone, string> = {
  neutral: 'bg-subtle',
  brand: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  accent: 'bg-accent',
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  /** Leading status dot — use for lifecycle states (Active / Blocked / …). */
  dot?: boolean;
  /** Adds a soft pulse to the dot; reserve for genuinely live states. */
  pulse?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  pulse = false,
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        TONES[tone],
        className,
      )}
    >
      {dot && (
        <span className="relative flex size-1.5">
          {pulse && (
            <span
              className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', DOTS[tone])}
            />
          )}
          <span className={cn('relative inline-flex size-1.5 rounded-full', DOTS[tone])} />
        </span>
      )}
      {children}
    </span>
  );
}
