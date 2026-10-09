export type DefinitionsViewMode = 'table' | 'cards';
export type SortDirection = 'asc' | 'desc';

export interface CollectionSlice<T> {
  /** Full list after search + sort */
  filtered: T[];
  /** Current page rows */
  page: T[];
  total: number;
}

export function applyCollection<T>(
  rows: T[],
  opts: {
    search: string;
    match: (row: T, q: string) => boolean;
    sortKey: string;
    sortDir: SortDirection;
    sortValue: (row: T, key: string) => string | number;
    pageIndex: number;
    pageSize: number;
  },
): CollectionSlice<T> {
  const q = opts.search.trim().toLowerCase();
  let filtered = q ? rows.filter((r) => opts.match(r, q)) : [...rows];
  filtered.sort((a, b) => {
    const av = opts.sortValue(a, opts.sortKey);
    const bv = opts.sortValue(b, opts.sortKey);
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return opts.sortDir === 'asc' ? cmp : -cmp;
  });
  const total = filtered.length;
  const start = opts.pageIndex * opts.pageSize;
  return { filtered, page: filtered.slice(start, start + opts.pageSize), total };
}

export function sortField(row: object, key: string): string | number {
  const v = (row as Record<string, unknown>)[key];
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return String(v ?? '').toLowerCase();
}

export function toggleSort(
  sortKey: string,
  sortDir: SortDirection,
  key: string,
): { sortKey: string; sortDir: SortDirection } {
  if (sortKey !== key) return { sortKey: key, sortDir: 'asc' };
  return { sortKey: key, sortDir: sortDir === 'asc' ? 'desc' : 'asc' };
}
