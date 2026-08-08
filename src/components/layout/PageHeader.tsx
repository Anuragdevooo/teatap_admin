import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Right-aligned primary/secondary actions. */
  actions?: ReactNode;
  /** Tabs or a filter row that belongs to the page, not to a card. */
  below?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, actions, below, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-extrabold tracking-tight text-fg">{title}</h1>
          {description && (
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {below && <div className="mt-5">{below}</div>}
    </div>
  );
}
