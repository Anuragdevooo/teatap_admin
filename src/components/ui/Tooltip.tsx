import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TooltipProps {
  label: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom';
  className?: string;
}

/**
 * CSS-only tooltip — no portal, no positioning engine. It is for short
 * supplementary text; anything longer or interactive belongs in a popover.
 */
export function Tooltip({ label, children, side = 'top', className }: TooltipProps) {
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg px-2 py-1 text-[11px] font-semibold',
          'bg-fg text-inverted opacity-0 shadow-md transition-opacity duration-150',
          'group-hover/tt:opacity-100 group-focus-within/tt:opacity-100',
          side === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5',
        )}
      >
        {label}
      </span>
    </span>
  );
}
