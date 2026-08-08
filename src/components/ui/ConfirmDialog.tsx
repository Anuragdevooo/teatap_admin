import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` for anything that removes access or data. */
  tone?: 'danger' | 'primary';
}

/**
 * The single confirmation surface for consequential actions — blocking a
 * vendor, deleting a customer, cancelling a subscription.
 *
 * Routing all of them through one component means the phrasing, the button
 * order and the escape hatch are identical every time, which is what makes a
 * destructive click feel predictable rather than alarming.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      dismissOnOverlay={false}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3.5">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full',
            tone === 'danger' ? 'bg-danger-soft text-danger' : 'bg-primary-soft text-primary-soft-fg',
          )}
        >
          <AlertTriangle className="size-5" />
        </span>
        <div className="pt-1 text-[13px] leading-relaxed text-muted">{description}</div>
      </div>
    </Modal>
  );
}
