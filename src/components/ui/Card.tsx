import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** `flat` drops the shadow — use inside another elevated container. */
  tone?: 'raised' | 'flat' | 'muted';
  padded?: boolean;
}

export function Card({ tone = 'raised', padded = false, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-card border border-border bg-surface',
        tone === 'raised' && 'shadow-sm',
        tone === 'muted' && 'bg-surface-2',
        padded && 'p-5',
        className,
      )}
      {...rest}
    />
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
  /** Removes the divider when the body is not a bordered region. */
  bare?: boolean;
}

export function CardHeader({
  title,
  description,
  action,
  icon,
  className,
  bare = false,
}: CardHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-start justify-between gap-4 px-5 py-4',
        !bare && 'border-b border-border',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon && (
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary-soft-fg [&_svg]:size-[18px]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-[15px] font-bold tracking-tight text-fg">{title}</h3>
          {description && (
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 border-t border-border bg-surface-2 px-5 py-3',
        'rounded-b-card',
        className,
      )}
      {...rest}
    />
  );
}
