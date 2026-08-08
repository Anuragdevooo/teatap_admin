import type { CSSProperties, ReactNode } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui';
import { signed } from '@/lib/format';

interface StatTileProps {
  label: string;
  /** Pre-formatted — the tile never guesses at currency or units. */
  value: ReactNode;
  icon?: ReactNode;
  /** Percentage change vs. the comparison period. */
  delta?: number;
  deltaLabel?: string;
  /** Set when a rise is bad (dues, blocked accounts, churn). */
  invertDelta?: boolean;
  footer?: ReactNode;
  loading?: boolean;
  /** Position in a KPI row — drives the staggered entrance. */
  index?: number;
  className?: string;
}

/**
 * One number, one meaning. If a tile needs two numbers it is really two tiles —
 * resist stuffing, it destroys the scannability of a KPI row.
 *
 * The decoration is deliberately quiet: a hairline accent that only colours in
 * on hover, and a wash that blooms behind the icon. Enough to make the row feel
 * alive without competing with the number, which is the actual content.
 */
export function StatTile({
  label,
  value,
  icon,
  delta,
  deltaLabel = 'vs last month',
  invertDelta = false,
  footer,
  loading = false,
  index = 0,
  className,
}: StatTileProps) {
  const positive = delta === undefined ? null : invertDelta ? delta < 0 : delta > 0;

  return (
    <div
      style={{ '--i': index } as CSSProperties}
      className={cn(
        'stagger-item lift group relative overflow-hidden rounded-card border border-border bg-surface p-4 shadow-sm',
        className,
      )}
    >
      {/* Accent hairline along the top edge, revealed on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-gradient-to-r from-primary to-accent transition-transform duration-400 ease-[var(--ease-out-quint)] group-hover:scale-x-100"
      />
      {/* Soft bloom behind the icon. */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 size-28 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity duration-400 group-hover:opacity-100"
      />

      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[12px] font-semibold leading-snug text-muted sm:text-[13px]">{label}</p>
        {icon && (
          <span className="grid size-9 shrink-0 place-items-center rounded-[11px] bg-primary-soft text-primary-soft-fg ring-1 ring-primary/10 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 [&_svg]:size-[18px]">
            {icon}
          </span>
        )}
      </div>

      {loading ? (
        <Skeleton className="relative mt-3 h-8 w-24" />
      ) : (
        <p className="tnum relative mt-2.5 text-[22px] font-extrabold leading-none tracking-tight text-fg sm:text-[26px]">
          {value}
        </p>
      )}

      {(delta !== undefined || footer) && (
        <div className="relative mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta !== undefined && !loading && (
            <span
              className={cn(
                'tnum inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold',
                positive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
              )}
            >
              {delta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
              {signed(delta)}
            </span>
          )}
          <span className="truncate text-[11px] text-subtle">{footer ?? deltaLabel}</span>
        </div>
      )}
    </div>
  );
}
