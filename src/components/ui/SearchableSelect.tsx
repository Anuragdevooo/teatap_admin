import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useClickOutside, useKey } from '@/lib/hooks';

export interface SearchableOption {
  value: string;
  label: string;
  /** Second line — city, plan, whatever disambiguates two similar names. */
  hint?: string;
}

interface SearchableSelectProps {
  options: readonly SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Label for the always-present "no filter" row. Omit to require a choice. */
  clearLabel?: string;
  size?: 'sm' | 'md';
  ariaLabel: string;
  invalid?: boolean;
  className?: string;
}

/**
 * A select you can type into.
 *
 * A native `<select>` is the right default — it gets mobile pickers and form
 * semantics for free — but it stops being usable somewhere around thirty
 * options, and this console routinely picks one vendor out of fifty. Past that
 * point the ability to type three letters beats every native affordance.
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  clearLabel,
  size = 'sm',
  ariaLabel,
  invalid,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  useKey('Escape', () => setOpen(false), open);

  useEffect(() => {
    if (open) {
      setQuery('');
      setCursor(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? null;

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(needle) || (o.hint?.toLowerCase().includes(needle) ?? false),
    );
  }, [options, query]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
  };

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center gap-2 rounded-field border bg-surface px-3 text-left shadow-xs transition-colors',
          size === 'sm' ? 'h-9 text-[13px]' : 'h-10 text-sm',
          invalid
            ? 'border-danger'
            : 'border-border hover:border-border-strong focus:border-primary',
        )}
      >
        <span className={cn('min-w-0 flex-1 truncate', selected ? 'text-fg' : 'text-subtle')}>
          {selected?.label ?? placeholder}
        </span>
        {selected && clearLabel && (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear selection"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="grid size-5 shrink-0 place-items-center rounded text-subtle hover:bg-surface-3 hover:text-fg"
          >
            <X className="size-3.5" />
          </span>
        )}
        <ChevronDown
          className={cn('size-4 shrink-0 text-subtle transition-transform', open && 'rotate-180')}
          aria-hidden
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-40 mt-1.5 w-full min-w-56 overflow-hidden rounded-xl border border-border bg-surface shadow-lg animate-pop-in">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-3.5 shrink-0 text-subtle" aria-hidden />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursor(0);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setCursor((c) => Math.min(matches.length - 1, c + 1));
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setCursor((c) => Math.max(0, c - 1));
                } else if (e.key === 'Enter') {
                  e.preventDefault();
                  const target = matches[cursor];
                  if (target) pick(target.value);
                }
              }}
              placeholder="Type to filter…"
              className="h-9 w-full bg-transparent text-[13px] text-fg outline-none placeholder:text-subtle"
            />
          </div>

          <ul className="max-h-60 overflow-y-auto p-1">
            {clearLabel && (
              <li>
                <button
                  onClick={() => pick('')}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors hover:bg-surface-3',
                    value === '' ? 'text-primary' : 'text-fg',
                  )}
                >
                  {clearLabel}
                  {value === '' && <Check className="ml-auto size-3.5" />}
                </button>
              </li>
            )}

            {matches.length === 0 && (
              <li className="px-3 py-6 text-center text-[12px] text-muted">
                Nothing matches “{query}”.
              </li>
            )}

            {matches.map((option, i) => (
              <li key={option.value}>
                <button
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => pick(option.value)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors',
                    i === cursor ? 'bg-surface-3' : '',
                  )}
                >
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-[13px] font-medium',
                        option.value === value ? 'text-primary' : 'text-fg',
                      )}
                    >
                      {option.label}
                    </span>
                    {option.hint && (
                      <span className="block truncate text-[11px] text-muted">{option.hint}</span>
                    )}
                  </span>
                  {option.value === value && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
