import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'soft'
  | 'danger'
  | 'outline-danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-primary-fg hover:bg-primary-hover shadow-xs active:translate-y-px',
  secondary:
    'bg-surface text-fg border border-border-strong hover:bg-surface-2 shadow-xs active:translate-y-px',
  ghost: 'text-muted hover:text-fg hover:bg-surface-3',
  soft: 'bg-primary-soft text-primary-soft-fg hover:brightness-95 dark:hover:brightness-125',
  danger: 'bg-danger text-white hover:brightness-110 shadow-xs active:translate-y-px',
  'outline-danger':
    'border border-danger/40 text-danger hover:bg-danger-soft active:translate-y-px',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1.5 rounded-lg',
  sm: 'h-9 px-3 text-[13px] gap-1.5 rounded-[10px]',
  md: 'h-10 px-4 text-sm gap-2 rounded-[10px]',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and blocks interaction without changing layout width. */
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * The single button in the system. Every affordance elsewhere composes this
 * rather than restyling a bare <button>, which is what keeps hit areas,
 * focus rings and disabled semantics consistent.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center whitespace-nowrap font-semibold',
        'transition-[background-color,color,box-shadow,transform] duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && (
        <Loader2 className="absolute size-4 animate-spin" aria-hidden />
      )}
      <span
        className={cn(
          'inline-flex items-center',
          SIZES[size].includes('gap-1.5') ? 'gap-1.5' : 'gap-2',
          loading && 'invisible',
        )}
      >
        {leadingIcon}
        {children}
        {trailingIcon}
      </span>
    </button>
  );
});
