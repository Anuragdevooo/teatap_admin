import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

const SIZES = {
  sm: 'size-8 rounded-lg [&_svg]:size-4',
  md: 'size-10 rounded-[10px] [&_svg]:size-[18px]',
  lg: 'size-11 rounded-xl [&_svg]:size-5',
} as const;

const VARIANTS = {
  ghost: 'text-muted hover:text-fg hover:bg-surface-3',
  surface: 'bg-surface border border-border text-muted hover:text-fg hover:bg-surface-2 shadow-xs',
  soft: 'bg-primary-soft text-primary-soft-fg hover:brightness-95 dark:hover:brightness-125',
  danger: 'text-danger hover:bg-danger-soft',
} as const;

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required — an icon-only control is invisible to screen readers otherwise. */
  label: string;
  icon: ReactNode;
  size?: keyof typeof SIZES;
  variant?: keyof typeof VARIANTS;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, icon, size = 'md', variant = 'ghost', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center transition-colors duration-150',
        'disabled:pointer-events-none disabled:opacity-45',
        SIZES[size],
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {icon}
    </button>
  );
});
