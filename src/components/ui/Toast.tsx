import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './IconButton';

type ToastTone = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

interface ToastApi {
  push: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-[18px] text-success" />,
  error: <XCircle className="size-[18px] text-danger" />,
  warning: <AlertTriangle className="size-[18px] text-warning" />,
  info: <Info className="size-[18px] text-info" />,
};

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = ++nextId;
      setToasts((list) => [...list.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (title, description) => push({ tone: 'success', title, description }),
      error: (title, description) => push({ tone: 'error', title, description }),
      info: (title, description) => push({ tone: 'info', title, description }),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5 shadow-lg animate-pop-in',
              )}
            >
              <span className="mt-0.5 shrink-0">{ICONS[t.tone]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold text-fg">{t.title}</p>
                {t.description && (
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">{t.description}</p>
                )}
              </div>
              <IconButton label="Dismiss" icon={<X />} size="sm" onClick={() => dismiss(t.id)} />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
