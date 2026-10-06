import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '../api/errors';
import { PAGE_SIZE } from '../utils/constants';
import useDebounce from './useDebounce';

/**
 * State + data loading for a server-side paginated, searchable list.
 *
 * @example
 * const list = useListQuery(getAppointments, { initialFilters: { status: '' } });
 * <SearchBar value={list.search} onChange={list.setSearch} />
 * <Form.Select value={list.filters.status} onChange={(e) => list.setFilter('status', e.target.value)} />
 * {list.items.map(...)}
 * <Pagination pagination={list.pagination} onPageChange={list.setPage} />
 *
 * @param {(params: object) => Promise<{ data: any[], pagination?: object }>} fetcher API function, e.g. `getPatients`
 * @param {{ initialFilters?: object, limit?: number, initialSearch?: string }} [options]
 *   Empty filter values ('' / null / undefined) are NOT sent to the API.
 * @returns {{
 *   items: any[], pagination: { page, limit, total, totalPages } | null,
 *   loading: boolean, error: string,
 *   page: number, setPage: (n: number) => void,
 *   search: string, setSearch: (s: string) => void,   // input value (API gets it debounced 400 ms)
 *   filters: object, setFilter: (name: string, value: any) => void, resetFilters: () => void,
 *   refetch: () => void
 * }}
 */
export default function useListQuery(fetcher, options = {}) {
  const { initialFilters = {}, limit = PAGE_SIZE, initialSearch = '' } = options;

  const [page, setPage] = useState(1);
  const [search, setSearchValue] = useState(initialSearch);
  const [filters, setFilters] = useState(initialFilters);
  const [reloadKey, setReloadKey] = useState(0);
  // Result of the last finished request, tagged with the key of that request.
  const [result, setResult] = useState({ key: null, items: [], pagination: null, error: '' });

  const debouncedSearch = useDebounce(search.trim(), 400);

  // Keep the initial filters for resetFilters() and the latest fetcher without re-running effects.
  const initialFiltersRef = useRef(initialFilters);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // Query params sent to the API.
  const params = useMemo(() => {
    const cleanFilters = Object.fromEntries(
      Object.entries(filters).filter(([, v]) => v !== '' && v !== null && v !== undefined),
    );
    return {
      page,
      limit,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...cleanFilters,
    };
  }, [page, limit, debouncedSearch, filters]);

  // Changes whenever the params change or refetch() is called.
  const requestKey = `${JSON.stringify(params)}#${reloadKey}`;
  // Derived state: loading until the stored result belongs to the current request.
  const loading = result.key !== requestKey;

  useEffect(() => {
    let ignore = false; // ignore responses of outdated requests (race conditions / unmount)

    fetcherRef
      .current(params)
      .then((res) => {
        if (ignore) return;
        const list = Array.isArray(res.data) ? res.data : [];
        setResult({ key: requestKey, items: list, pagination: res.pagination || null, error: '' });

        // If the current page became empty (e.g. last item deleted), go back one page.
        const totalPages = res.pagination?.totalPages ?? 1;
        if (list.length === 0 && params.page > 1 && params.page > totalPages) {
          setPage(Math.max(totalPages, 1));
        }
      })
      .catch((err) => {
        if (ignore) return;
        setResult({ key: requestKey, items: [], pagination: null, error: getErrorMessage(err) });
      });

    return () => {
      ignore = true;
    };
  }, [params, requestKey]);

  /** Changing the search text always goes back to page 1. */
  const setSearch = useCallback((value) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  /** Changing a filter always goes back to page 1. */
  const setFilter = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setPage(1);
  }, []);

  /** Clears search and filters. */
  const resetFilters = useCallback(() => {
    setFilters(initialFiltersRef.current);
    setSearchValue('');
    setPage(1);
  }, []);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  return {
    items: result.items, // previous items stay visible while the next page loads
    pagination: result.pagination,
    loading,
    error: loading ? '' : result.error,
    page,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    resetFilters,
    refetch,
  };
}
