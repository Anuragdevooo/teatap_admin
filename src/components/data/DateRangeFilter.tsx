import { useState } from 'react';
import { CalendarRange, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button, IconButton } from '@/components/ui';
import { useClickOutside } from '@/lib/hooks';
import { date as fmtDate } from '@/lib/format';

const DAY = 86_400_000;

export interface DateRange {
  /** Inclusive lower bound in epoch ms; null means unbounded. */
  from: number | null;
  /** Exclusive upper bound in epoch ms; null means unbounded. */
  to: number | null;
  label: string;
}

export const ALL_TIME: DateRange = { from: null, to: null, label: 'All time' };

const PRESETS: Array<{ label: string; days: number }> = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'Last 12 months', days: 365 },
];

/** True when `at` falls inside the range. Unbounded ends always pass. */
export const inRange = (at: number, range: DateRange) =>
  (range.from === null || at >= range.from) && (range.to === null || at < range.to);

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  /** Wording on the trigger when nothing is selected. */
  placeholder?: string;
  className?: string;
}

/**
 * Date filter shared by every list view.
 *
 * Presets first because that is what an admin actually reaches for — "last 30
 * days" is the question, not two specific dates. The custom range is there for
 * the cases presets can't express (a single billing cycle, an audit window).
 */
export function DateRangeFilter({
  value,
  onChange,
  placeholder = 'Any date',
  className,
}: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const active = value.from !== null || value.to !== null;

  const applyCustom = () => {
    if (!customFrom && !customTo) return;
    const from = customFrom ? new Date(`${customFrom}T00:00:00`).getTime() : null;
    // Exclusive upper bound — "to 31 Aug" must include all of the 31st.
    const to = customTo ? new Date(`${customTo}T00:00:00`).getTime() + DAY : null;
    onChange({
      from,
      to,
      label:
        from && to
          ? `${fmtDate(from)} – ${fmtDate(to - DAY)}`
          : from
            ? `From ${fmtDate(from)}`
            : `Until ${fmtDate(to! - DAY)}`,
    });
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-field border px-3 text-[13px] font-medium shadow-xs transition-colors',
          active
            ? 'border-primary bg-primary-soft text-primary-soft-fg'
            : 'border-border bg-surface text-muted hover:border-border-strong hover:text-fg',
        )}
      >
        <CalendarRange className="size-4 shrink-0" />
        <span className="max-w-40 truncate">{active ? value.label : placeholder}</span>
        {active && (
          <IconButton
            label="Clear date filter"
            icon={<X />}
            size="sm"
            className="-mr-1.5 size-6"
            onClick={(e) => {
              e.stopPropagation();
              onChange(ALL_TIME);
              setOpen(false);
            }}
          />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-72 rounded-xl border border-border bg-surface p-2 shadow-lg animate-pop-in">
          <p className="px-2 pb-1 pt-1.5 text-[10px] font-bold uppercase tracking-wide text-subtle">
            Quick ranges
          </p>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                onChange({
                  from: Date.now() - preset.days * DAY,
                  to: null,
                  label: preset.label,
                });
                setOpen(false);
              }}
              className={cn(
                'flex w-full items-center rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-surface-3',
                value.label === preset.label ? 'text-primary' : 'text-fg',
              )}
            >
              {preset.label}
            </button>
          ))}

          <div className="my-1 h-px bg-border" />

          <p className="px-2 pb-1.5 pt-1 text-[10px] font-bold uppercase tracking-wide text-subtle">
            Custom range
          </p>
          <div className="flex items-center gap-2 px-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              aria-label="From date"
              className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-[12px] text-fg focus:border-primary focus:outline-none"
            />
            <span className="text-[11px] text-subtle">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              aria-label="To date"
              className="h-9 w-full rounded-lg border border-border bg-surface px-2 text-[12px] text-fg focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-2">
            <Button
              size="xs"
              variant="ghost"
              onClick={() => {
                onChange(ALL_TIME);
                setCustomFrom('');
                setCustomTo('');
                setOpen(false);
              }}
            >
              All time
            </Button>
            <Button size="xs" variant="primary" onClick={applyCustom}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
