import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBodyScrollLock, useKey } from '@/lib/hooks';
import { IconButton } from './IconButton';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  width?: 'md' | 'lg';
}

/**
 * Right-hand detail panel. Preferred over a modal when the user needs to keep
 * the underlying list in view — e.g. inspecting one owner while scanning many.
 */
export function Drawer({ open, onClose, title, subtitle, children, footer, width = 'md' }: DrawerProps) {
  useKey('Escape', onClose, open);
  useBodyScrollLock(open);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={onClose} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex h-full w-full flex-col border-l border-border bg-surface shadow-lg animate-slide-in-right',
          width === 'md' ? 'sm:w-[26rem]' : 'sm:w-[34rem]',
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-bold tracking-tight text-fg">{title}</h2>
            {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>}
          </div>
          <IconButton label="Close panel" icon={<X />} size="sm" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer && (
          <footer className="flex items-center gap-2 border-t border-border bg-surface-2 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </aside>
    </div>,
    document.body,
  );
}
