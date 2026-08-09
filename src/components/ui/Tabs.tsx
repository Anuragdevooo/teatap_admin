import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
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

interface Indicator {
  left: number;
  width: number;
}

/**
 * Tabs with a single indicator that slides between them.
 *
 * One measured element rather than a highlight per tab: the movement is what
 * tells you *where you came from*, which a hard cut between two static markers
 * cannot. It re-measures on resize and on any change to the item set, so a
 * count appearing in a label never leaves the indicator stranded.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  variant = 'underline',
  className,
}: TabsProps<T>) {
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const list = listRef.current;
      const active = tabRefs.current[value];
      if (!list || !active) return;
      setIndicator({
        left: active.offsetLeft - list.scrollLeft,
        width: active.offsetWidth,
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    if (listRef.current) observer.observe(listRef.current);
    return () => observer.disconnect();
  }, [value, items]);

  const isPill = variant === 'pill';

  return (
    <div
      ref={listRef}
      role="tablist"
      onScroll={() => {
        const list = listRef.current;
        const active = tabRefs.current[value];
        if (list && active) {
          setIndicator({ left: active.offsetLeft - list.scrollLeft, width: active.offsetWidth });
        }
      }}
      className={cn(
        'relative flex overflow-x-auto',
        isPill
          ? 'inline-flex w-fit items-center gap-1 rounded-xl bg-surface-3 p-1'
          : 'gap-1 border-b border-border',
        className,
      )}
    >
      {/* The sliding indicator. Positioned, never re-parented, so the browser
          can interpolate it instead of cross-fading two elements. */}
      {indicator && (
        <>
          {/* The pill carries brand colour, not a neutral chip: at a glance the
              selected tab has to be unmistakable, and grey-on-grey is not. */}
          <span
            aria-hidden
            className={cn(
              'pointer-events-none absolute transition-[left,width] duration-300 ease-[var(--ease-out-quint)]',
              isPill
                ? 'inset-y-1 rounded-lg bg-primary shadow-sm'
                : 'inset-y-1 rounded-lg bg-primary-soft',
            )}
            style={{
              left: indicator.left,
              width: indicator.width,
            }}
          />
          {/* Underline tabs keep the bar as well — it anchors the tab to the
              content below, which the tint alone does not. */}
          {!isPill && (
            <span
              aria-hidden
              className="pointer-events-none absolute -bottom-px h-[3px] rounded-full bg-primary transition-[left,width] duration-300 ease-[var(--ease-out-quint)]"
              style={{
                left: indicator.left + 6,
                width: Math.max(0, indicator.width - 12),
              }}
            />
          )}
        </>
      )}

      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            ref={(el) => {
              tabRefs.current[item.value] = el;
            }}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              'relative z-10 inline-flex shrink-0 items-center gap-1.5 font-semibold transition-colors duration-200',
              isPill ? 'rounded-lg px-3 py-1.5 text-[13px]' : 'px-3.5 py-2.5 text-[13px]',
              active
                ? isPill
                  ? 'text-primary-fg'
                  : 'text-primary-soft-fg'
                : 'text-muted hover:text-fg',
            )}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={cn(
                  'tnum rounded-full px-1.5 py-0.5 text-[11px] font-bold transition-colors',
                  active
                    ? isPill
                      ? 'bg-white/20 text-primary-fg'
                      : 'bg-primary/15 text-primary-soft-fg'
                    : 'bg-surface-3 text-subtle',
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
