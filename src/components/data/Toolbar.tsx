import { useRef, type ReactNode } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton, Input } from '@/components/ui';
import { useKey } from '@/lib/hooks';
import { num } from '@/lib/format';

interface ToolbarProps {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder?: string;
  /** Filter selects / segmented controls, rendered after the search box. */
  filters?: ReactNode;
  /** Primary actions, pinned right. */
  actions?: ReactNode;
  /** Live match count — shown only while a search or filter is active. */
  matched?: number;
  total?: number;
  noun?: string;
  className?: string;
}

/**
 * The header strip above every list view: search, then filters, then actions.
 * Keeping that order fixed across pages is what makes the console feel like
 * one product rather than twelve screens.
 *
 * Search here filters the list in place. The one in the top bar is a command
 * palette — different job, deliberately different affordance.
 */
export function Toolbar({
  query,
  onQueryChange,
  placeholder = 'Search…',
  filters,
  actions,
  matched,
  total,
  noun = 'results',
  className,
}: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // "/" jumps to the list search, the way it does in most dense tools. Ignored
  // while the user is already typing somewhere else.
  useKey('/', (e) => {
    const active = document.activeElement;
    const typing =
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      (active as HTMLElement | null)?.isContentEditable;
    if (typing) return;
    e.preventDefault();
    inputRef.current?.focus();
  });

  const filtering = query.trim().length > 0;

  return (
    <div
      className={cn(
        'flex flex-col gap-3 border-b border-border px-4 py-3 lg:flex-row lg:items-center',
        className,
      )}
    >
      <div className="w-full lg:max-w-xs">
        <Input
          ref={inputRef}
          size="sm"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape' && query) {
              e.stopPropagation();
              onQueryChange('');
            }
          }}
          placeholder={placeholder}
          leadingIcon={<Search />}
          aria-label={placeholder}
          autoComplete="off"
          spellCheck={false}
          trailing={
            query ? (
              <IconButton
                label="Clear search"
                icon={<X />}
                size="sm"
                onClick={() => {
                  onQueryChange('');
                  inputRef.current?.focus();
                }}
              />
            ) : (
              <kbd className="mr-2 hidden rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-subtle lg:block">
                /
              </kbd>
            )
          }
        />
      </div>

      {filters && <div className="flex flex-wrap items-center gap-2">{filters}</div>}

      {/* Answers "did my search actually do anything" without a layout shift. */}
      {matched !== undefined && total !== undefined && filtering && (
        <p className="tnum shrink-0 text-[11px] font-semibold text-muted">
          {num(matched)} of {num(total)} {noun}
        </p>
      )}

      {actions && <div className="flex items-center gap-2 lg:ml-auto">{actions}</div>}
    </div>
  );
}
