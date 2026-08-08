import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  /** `search` phrasing implies filters are the cause, not missing data. */
  variant?: 'empty' | 'search';
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'empty',
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-14 text-center', className)}>
      <div
        className={cn(
          'mb-4 grid size-14 place-items-center rounded-2xl [&_svg]:size-6',
          variant === 'search' ? 'bg-surface-3 text-subtle' : 'bg-primary-soft text-primary-soft-fg',
        )}
      >
        {icon}
      </div>
      <h3 className="text-[15px] font-bold tracking-tight text-fg">{title}</h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
