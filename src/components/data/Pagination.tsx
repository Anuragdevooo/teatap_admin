import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from '@/components/ui';
import { num } from '@/lib/format';

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  /** Shown on the left: "12 of 128 owners". */
  showing?: { from: number; to: number; total: number; noun: string };
  className?: string;
}

/** Compact page list with ellipses: 1 … 4 [5] 6 … 20 */
function pageWindow(page: number, pageCount: number): Array<number | '…'> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const out: Array<number | '…'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) out.push('…');
  for (let i = start; i <= end; i++) out.push(i);
  if (end < pageCount - 1) out.push('…');
  out.push(pageCount);
  return out;
}

export function Pagination({ page, pageCount, onPageChange, showing, className }: PaginationProps) {
  if (pageCount <= 1 && !showing) return null;

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3', className)}>
      {showing ? (
        <p className="tnum text-xs text-muted">
          Showing <span className="font-semibold text-fg">{num(showing.from)}</span>–
          <span className="font-semibold text-fg">{num(showing.to)}</span> of{' '}
          <span className="font-semibold text-fg">{num(showing.total)}</span> {showing.noun}
        </p>
      ) : (
        <span />
      )}

      {pageCount > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <IconButton
            label="Previous page"
            icon={<ChevronLeft />}
            size="sm"
            variant="surface"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          />
          {pageWindow(page, pageCount).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-1 text-xs text-subtle">
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={cn(
                  'tnum size-8 rounded-lg text-xs font-semibold transition-colors',
                  p === page
                    ? 'bg-primary text-primary-fg'
                    : 'text-muted hover:bg-surface-3 hover:text-fg',
                )}
              >
                {p}
              </button>
            ),
          )}
          <IconButton
            label="Next page"
            icon={<ChevronRight />}
            size="sm"
            variant="surface"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          />
        </nav>
      )}
    </div>
  );
}
