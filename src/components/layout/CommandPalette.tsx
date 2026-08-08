import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { CornerDownLeft, Search } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBodyScrollLock, useKey } from '@/lib/hooks';
import { NAVIGATION } from '@/app/navigation';
import { useStore } from '@/store';
import { Avatar } from '@/components/ui';

type Group = 'Pages' | 'Vendors' | 'Customers' | 'Users';

interface Command {
  id: string;
  label: string;
  hint: string;
  group: Group;
  to: string;
}

/** Per-group cap, so one huge group can't crowd the others out. */
const GROUP_LIMIT = 5;

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Ctrl/⌘-K navigation. With ~14 screens plus 48 tenants, keyboard search beats
 * hunting the sidebar — and it keeps the sidebar free of a second search box.
 */
export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { owners, customers, users } = useStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);

  useKey('Escape', onClose, open);
  useBodyScrollLock(open);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  // Read from the store, not the fixtures: a vendor added this session has to
  // be findable, and a deleted one must not linger in search.
  const commands = useMemo<Command[]>(() => {
    const pages: Command[] = NAVIGATION.flatMap((section) =>
      section.items.map((item) => ({
        id: `page-${item.to}`,
        label: item.label,
        hint: section.title,
        group: 'Pages' as const,
        to: item.to,
      })),
    );

    const vendors: Command[] = owners.map((o) => ({
      id: `own-${o.id}`,
      label: o.businessName,
      hint: `${o.ownerName} · ${o.city} · ${o.plan}`,
      group: 'Vendors' as const,
      to: '/vendors',
    }));

    const people: Command[] = customers.map((c) => ({
      id: `cus-${c.id}`,
      label: c.name,
      hint: `${c.vendorName} · ${c.area}`,
      group: 'Customers' as const,
      // Deep-link to the vendor's customer list so the row is in view.
      to: `/customers?vendor=${c.vendorId}`,
    }));

    const accounts: Command[] = users
      .filter((u) => u.role !== 'operator')
      .map((u) => ({
        id: `usr-${u.id}`,
        label: u.name,
        hint: `${u.role === 'admin' ? 'Admin' : 'Customer'} · ${u.city}`,
        group: 'Users' as const,
        to: '/users',
      }));

    return [...pages, ...vendors, ...people, ...accounts];
  }, [owners, customers, users]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands.filter((c) => c.group === 'Pages');

    const matched = commands.filter(
      (c) => c.label.toLowerCase().includes(needle) || c.hint.toLowerCase().includes(needle),
    );

    // Take a slice of each group in a fixed order, so typing a name never
    // buries the page you were actually heading for.
    const order: Group[] = ['Pages', 'Vendors', 'Customers', 'Users'];
    return order.flatMap((group) =>
      matched.filter((c) => c.group === group).slice(0, GROUP_LIMIT),
    );
  }, [commands, query]);

  useKey(
    'ArrowDown',
    (e) => {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    },
    open,
  );
  useKey(
    'ArrowUp',
    (e) => {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    },
    open,
  );
  useKey(
    'Enter',
    () => {
      const target = results[cursor];
      if (!target) return;
      navigate(target.to);
      onClose();
    },
    open,
  );

  if (!open) return null;

  let lastGroup = '';

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[12vh]">
      <div className="absolute inset-0 animate-fade-in bg-overlay backdrop-blur-[2px]" onClick={onClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="relative w-full max-w-lg overflow-hidden rounded-card border border-border bg-surface shadow-lg animate-pop-in"
      >
        <div className="flex items-center gap-2.5 border-b border-border px-4">
          <Search className="size-4 shrink-0 text-subtle" aria-hidden />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCursor(0);
            }}
            placeholder="Search pages, vendors, customers, users…"
            className="h-12 w-full bg-transparent text-sm text-fg outline-none placeholder:text-subtle"
          />
          <kbd className="shrink-0 rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-muted">
            Esc
          </kbd>
        </div>

        <ul className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-8 text-center text-[13px] text-muted">
              Nothing matches “{query}”.
            </li>
          )}
          {results.map((c, i) => {
            const showGroup = c.group !== lastGroup;
            lastGroup = c.group;
            return (
              <li key={c.id}>
                {showGroup && (
                  <p className="px-2 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-subtle">
                    {c.group}
                  </p>
                )}
                <button
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => {
                    navigate(c.to);
                    onClose();
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                    i === cursor ? 'bg-primary-soft' : 'hover:bg-surface-3',
                  )}
                >
                  {c.group === 'Pages' ? (
                    <span className="grid size-6 place-items-center rounded-md bg-surface-3 text-[10px] font-bold text-muted">
                      ⌘
                    </span>
                  ) : (
                    <Avatar name={c.label} size="xs" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold text-fg">{c.label}</span>
                    <span className="block truncate text-[11px] text-muted">{c.hint}</span>
                  </span>
                  {i === cursor && <CornerDownLeft className="size-3.5 shrink-0 text-muted" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
