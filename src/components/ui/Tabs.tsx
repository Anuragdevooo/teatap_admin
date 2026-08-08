import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  /** Right-aligned count chip — omit rather than showing a zero. */
  count?: number;
  icon?: ReactNode;
}

interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  /** `underline` for page-level sections, `pill` for in-card switching. */
  variant?: 'underline' | 'pill';
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'underline',
  className,
}: TabsProps<T>) {
  if (variant === 'pill') {
    return (
      <div
        role="tablist"
        className={cn('inline-flex items-center gap-1 rounded-xl bg-surface-3 p-1', className)}
      >
        {items.map((item) => {
          const active = item.value === value;
          return (
            <button
              key={item.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-all duration-150',
                active
                  ? 'bg-surface text-fg shadow-xs'
                  : 'text-muted hover:text-fg',
              )}
            >
              {item.icon}
              {item.label}
              {item.count !== undefined && (
                <span className="tnum text-[11px] text-subtle">{item.count}</span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b border-border', className)}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative inline-flex shrink-0 items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold transition-colors',
              active ? 'text-primary' : 'text-muted hover:text-fg',
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'tnum rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                  active ? 'bg-primary-soft text-primary-soft-fg' : 'bg-surface-3 text-subtle',
                )}
              >
                {item.count}
              </span>
            )}
            {active && (
              <span className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-primary" />
            )}
          </button>
        );
      })}
    </div>
  );
}
