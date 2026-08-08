import { useMemo, useState } from 'react';
import { useDebounced } from '@/lib/hooks';

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  columnId: string;
  direction: SortDirection;
}

interface Options<T> {
  rows: readonly T[];
  /** Fields concatenated for the free-text search box. */
  searchFields?: (row: T) => Array<string | number | null | undefined>;
  /** Column id → comparable value. Columns without an entry aren't sortable. */
  sorters?: Record<string, (row: T) => string | number>;
  initialSort?: SortState;
  pageSize?: number;
}

/**
 * Table state machine: search → filter predicates → sort → paginate.
 *
 * Kept as a hook (not baked into <DataTable/>) so a page can drive the same
 * pipeline from URL params, or reuse the filtered rows for an export or a
 * summary row, without the table owning that state.
 */
export function useDataTable<T>({
  rows,
  searchFields,
  sorters,
  initialSort,
  pageSize = 10,
}: Options<T>) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
  const [page, setPage] = useState(1);
  const [predicates, setPredicates] = useState<Record<string, (row: T) => boolean>>({});

  const debouncedQuery = useDebounced(query, 200);

  /** Register/replace a named filter. Passing null clears it. */
  const setFilter = (id: string, predicate: ((row: T) => boolean) | null) => {
    setPage(1);
    setPredicates((prev) => {
      const next = { ...prev };
      if (predicate) next[id] = predicate;
      else delete next[id];
      return next;
    });
  };

  const toggleSort = (columnId: string) => {
    setPage(1);
    setSort((prev) => {
      if (prev?.columnId !== columnId) return { columnId, direction: 'asc' };
      if (prev.direction === 'asc') return { columnId, direction: 'desc' };
      return null; // third click restores natural order
    });
  };

  const filtered = useMemo(() => {
    const needle = debouncedQuery.trim().toLowerCase();
    const active = Object.values(predicates);

    return rows.filter((row) => {
      if (active.some((p) => !p(row))) return false;
      if (!needle || !searchFields) return true;
      return searchFields(row)
        .filter((v) => v !== null && v !== undefined)
        .some((v) => String(v).toLowerCase().includes(needle));
    });
    // `searchFields` is a fresh closure each render in most callers; depending
    // on it would defeat memoisation, and its behaviour is stable by contract.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, debouncedQuery, predicates]);

  const sorted = useMemo(() => {
    if (!sort || !sorters?.[sort.columnId]) return filtered;
    const get = sorters[sort.columnId];
    const factor = sort.direction === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = get(a);
      const bv = get(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return String(av).localeCompare(String(bv), 'en', { numeric: true }) * factor;
    });
  }, [filtered, sort, sorters]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  return {
    query,
    setQuery: (value: string) => {
      setQuery(value);
      setPage(1);
    },
    sort,
    toggleSort,
    setFilter,
    filtered: sorted,
    rows: paged,
    page: safePage,
    pageCount,
    setPage,
    total: rows.length,
    matched: sorted.length,
    isFiltered: debouncedQuery.trim().length > 0 || Object.keys(predicates).length > 0,
  };
}
