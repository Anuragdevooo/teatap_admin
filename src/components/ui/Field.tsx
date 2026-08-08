import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: string | null;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Label + hint + error scaffolding shared by every form control, so an input
 * never has to reimplement its own vertical rhythm or error styling.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1 text-[13px] font-semibold text-fg"
        >
          {label}
          {required && (
            <span className="text-danger" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : (
        hint && <p className="text-xs leading-relaxed text-muted">{hint}</p>
      )}
    </div>
  );
}

/** Shared control chrome — reused by Input, Select and Textarea. */
export const controlBase = cn(
  'w-full rounded-field border bg-surface text-fg placeholder:text-subtle',
  'border-border shadow-xs transition-[border-color,box-shadow] duration-150',
  'hover:border-border-strong',
  'focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/12',
  'disabled:cursor-not-allowed disabled:bg-surface-3 disabled:text-muted',
);

export const controlInvalid = 'border-danger focus:border-danger focus:ring-danger/15';
