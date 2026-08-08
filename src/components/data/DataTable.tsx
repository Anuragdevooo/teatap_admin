import type { ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui';
import type { SortState } from './useDataTable';

export interface Column<T> {
  id: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Any CSS width — keeps numeric columns from wobbling between pages. */
  width?: string;
  sortable?: boolean;
  /** Hide below this breakpoint instead of horizontal-scrolling everything. */
  hideBelow?: 'sm' | 'md' | 'lg' | 'xl';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  sort?: SortState | null;
  onSortChange?: (columnId: string) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  empty?: ReactNode;
  className?: string;
}

const HIDE: Record<NonNullable<Column<unknown>['hideBelow']>, string> = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
  xl: 'hidden xl:table-cell',
};

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/**
 * Presentational table. It renders whatever rows it is handed — paging,
 * sorting and filtering live in `useDataTable`, which keeps this component
 * trivially reusable for static lists too.
 */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  onRowClick,
  loading = false,
  skeletonRows = 6,
  empty,
  className,
}: DataTableProps<T>) {
  if (!loading && rows.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => {
              const active = sort?.columnId === col.id;
              const sortable = col.sortable && onSortChange;
              return (
                <th
                  key={col.id}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined}
                  className={cn(
                    'bg-surface-2 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-muted',
                    ALIGN[col.align ?? 'left'],
                    col.hideBelow && HIDE[col.hideBelow],
                  )}
                >
                  {sortable ? (
                    <button
                      onClick={() => onSortChange(col.id)}
                      className={cn(
                        'inline-flex items-center gap-1 transition-colors hover:text-fg',
                        active && 'text-fg',
                        col.align === 'right' && 'flex-row-reverse',
                      )}
                    >
                      {col.header}
                      {active ? (
                        sort.direction === 'asc' ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ChevronsUpDown className="size-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, r) => (
                <tr key={r} className="border-b border-border last:border-0">
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn('px-4 py-3.5', col.hideBelow && HIDE[col.hideBelow])}
                    >
                      <Skeleton shape="text" className={col.align === 'right' ? 'ml-auto w-12' : 'w-24'} />
                    </td>
                  ))}
                </tr>
              ))
            : rows.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-border transition-colors last:border-0',
                    onRowClick && 'cursor-pointer hover:bg-surface-2',
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.id}
                      className={cn(
                        'px-4 py-3 align-middle text-fg',
                        ALIGN[col.align ?? 'left'],
                        col.hideBelow && HIDE[col.hideBelow],
                      )}
                    >
                      {col.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
