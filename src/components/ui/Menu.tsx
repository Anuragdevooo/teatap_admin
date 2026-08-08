import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { useClickOutside, useKey } from '@/lib/hooks';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onSelect?: () => void;
  tone?: 'default' | 'danger';
  disabled?: boolean;
  /** Renders a divider above this item. */
  separated?: boolean;
}

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  items: MenuItem[];
  align?: 'start' | 'end';
  className?: string;
}

/**
 * Lightweight dropdown. Deliberately unmanaged/uncontrolled — row action menus
 * are numerous and short-lived, so keeping state local avoids a provider.
 */
export function Menu({ trigger, items, align = 'end', className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));
  useKey('Escape', () => setOpen(false), open);

  return (
    // Menus routinely live inside clickable table rows; swallowing the click
    // here stops "open the row" from firing behind every menu interaction.
    <div
      ref={ref}
      onClick={(e) => e.stopPropagation()}
      className={cn('relative inline-flex', className)}
    >
      {trigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute top-full z-40 mt-1.5 min-w-52 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-lg animate-pop-in',
            align === 'end' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item, i) => (
            <div key={item.label}>
              {item.separated && i > 0 && <div className="my-1 h-px bg-border" />}
              <button
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect?.();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
                  'disabled:pointer-events-none disabled:opacity-45',
                  '[&_svg]:size-4 [&_svg]:shrink-0',
                  item.tone === 'danger'
                    ? 'text-danger hover:bg-danger-soft'
                    : 'text-fg hover:bg-surface-3',
                )}
              >
                {item.icon}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
