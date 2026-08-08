import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBodyScrollLock, useKey } from '@/lib/hooks';
import { IconButton } from './IconButton';

const WIDTHS = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
} as const;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: keyof typeof WIDTHS;
  /** Set false for destructive flows where a stray click shouldn't dismiss. */
  dismissOnOverlay?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  dismissOnOverlay = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useKey('Escape', onClose, open);
  useBodyScrollLock(open);

  // Move focus into the dialog on open so the keyboard path starts inside it.
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      const target = panelRef.current?.querySelector<HTMLElement>(
        '[data-autofocus],input,select,textarea,button',
      );
      target?.focus();
    }, 20);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-overlay backdrop-blur-[2px]"
        onClick={dismissOnOverlay ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden bg-surface shadow-lg animate-pop-in',
          'rounded-t-2xl border border-border sm:rounded-card',
          WIDTHS[size],
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-bold tracking-tight text-fg">{title}</h2>
            {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
          </div>
          <IconButton label="Close" icon={<X />} size="sm" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3.5">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
