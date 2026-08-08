import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { controlBase, controlInvalid } from './Field';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  options: readonly SelectOption[];
  size?: 'sm' | 'md';
  placeholder?: string;
  invalid?: boolean;
}

/**
 * Native <select> on purpose: it gets mobile pickers, keyboard behaviour and
 * form semantics for free. A custom listbox is only worth it when we need
 * multi-select or rich rows — see `Menu` for those cases.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { options, size = 'md', placeholder, invalid, className, ...rest },
  ref,
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          'cursor-pointer appearance-none pl-3 pr-9',
          size === 'sm' ? 'h-9 text-[13px]' : 'h-10 text-sm',
          invalid && controlInvalid,
          className,
        )}
        {...rest}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-subtle"
      />
    </div>
  );
});
