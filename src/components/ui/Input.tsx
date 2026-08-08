import { forwardRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { controlBase, controlInvalid } from './Field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  leadingIcon?: ReactNode;
  /** Rendered flush against the right edge — buttons, units, clear affordances. */
  trailing?: ReactNode;
  invalid?: boolean;
}

const SIZES = {
  sm: 'h-9 text-[13px]',
  md: 'h-10 text-sm',
  lg: 'h-12 text-[15px]',
} as const;

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { size = 'md', leadingIcon, trailing, invalid, className, ...rest },
  ref,
) {
  return (
    <div className="relative flex items-center">
      {leadingIcon && (
        <span className="pointer-events-none absolute left-3 grid place-items-center text-subtle [&_svg]:size-4">
          {leadingIcon}
        </span>
      )}
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          controlBase,
          SIZES[size],
          'px-3',
          leadingIcon && 'pl-9',
          trailing && 'pr-10',
          invalid && controlInvalid,
          className,
        )}
        {...rest}
      />
      {trailing && (
        <span className="absolute right-1.5 flex items-center text-subtle">{trailing}</span>
      )}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ invalid, className, rows = 4, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        controlBase,
        'resize-y px-3 py-2.5 text-sm leading-relaxed',
        invalid && controlInvalid,
        className,
      )}
      {...rest}
    />
  );
});
