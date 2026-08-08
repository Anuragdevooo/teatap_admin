import { forwardRef, type InputHTMLAttributes } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  /** Header checkbox state when only some rows on the page are selected. */
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, indeterminate, className, checked, ...rest },
  ref,
) {
  return (
    <label className={cn('inline-flex cursor-pointer items-center gap-2 select-none', className)}>
      <span className="relative grid size-4 place-items-center">
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          aria-checked={indeterminate ? 'mixed' : checked}
          className="peer size-4 cursor-pointer appearance-none rounded-[5px] border border-border-strong bg-surface transition-colors checked:border-primary checked:bg-primary disabled:cursor-not-allowed disabled:opacity-50"
          {...rest}
        />
        {indeterminate ? (
          <Minus
            aria-hidden
            className="pointer-events-none absolute size-3 text-primary"
            strokeWidth={3}
          />
        ) : (
          <Check
            aria-hidden
            className="pointer-events-none absolute size-3 scale-0 text-primary-fg transition-transform peer-checked:scale-100"
            strokeWidth={3.5}
          />
        )}
      </span>
      {label && <span className="text-[13px] text-fg">{label}</span>}
    </label>
  );
});
