import { cn } from '@/lib/cn';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  className?: string;
  ariaLabel?: string;
}

/**
 * For mutually exclusive, low-cardinality choices that change a view rather
 * than submit data — date ranges, chart granularity. Not a form control.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  size = 'sm',
  className,
  ariaLabel,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex shrink-0 items-center rounded-[10px] border border-border bg-surface-2 p-0.5',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'rounded-lg font-semibold transition-all duration-150',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-[13px]',
              active ? 'bg-surface text-fg shadow-xs' : 'text-muted hover:text-fg',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
