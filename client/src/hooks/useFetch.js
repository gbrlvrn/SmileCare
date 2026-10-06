import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../api/errors';

/**
 * Runs an API call when the component mounts and whenever `deps` change.
 *
 * @example
 * const { data, loading, error, refetch } = useFetch(() => getAppointment(id), [id]);
 *
 * @param {() => Promise<{ data: any }>} fetcher function returning an API envelope (e.g. `getServices`)
 * @param {Array} [deps=[]] simple values (ids, strings, numbers); the request re-runs when they change
 * @returns {{
 *   data: any,            // envelope.data (null until the first load; kept while re-fetching)
 *   response: object|null,// the full envelope { success, data, message?, pagination? }
 *   loading: boolean,     // true while a request is in flight
 *   error: string,        // '' when OK, otherwise a readable message
 *   status: number|null,  // HTTP status of the error (e.g. 403/404) for custom handling
 *   refetch: () => void,  // run the request again
 *   setData: Function     // update data locally (e.g. after a PATCH) without refetching
 * }}
 */
export default function useFetch(fetcher, deps = []) {
  const [reloadKey, setReloadKey] = useState(0);
  // Result of the last finished request, tagged with the key of that request.
  const [result, setResult] = useState({ key: null, response: null, error: '', status: null });

  // A string that changes whenever deps change or refetch() is called.
  const requestKey = JSON.stringify([...deps, reloadKey]);
  // Derived state: we are loading until the result belongs to the current request.
  const loading = result.key !== requestKey;

  // Keep the latest fetcher without making it an effect dependency
  // (inline arrow functions are new on every render).
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    // `ignore` prevents setting state from an old request after unmount
    // or after deps changed (avoids race conditions).
    let ignore = false;

    fetcherRef
      .current()
      .then((res) => {
        if (!ignore) setResult({ key: requestKey, response: res, error: '', status: null });
      })
      .catch((err) => {
        if (ignore) return;
        setResult((prev) => ({
          key: requestKey,
          response: prev.response,
          error: getErrorMessage(err),
          status: err.response?.status ?? null,
        }));
      });

    return () => {
      ignore = true;
    };
  }, [requestKey]);

  const refetch = useCallback(() => setReloadKey((k) => k + 1), []);

  const setData = useCallback((updater) => {
    setResult((prev) => {
      const prevData = prev.response?.data ?? null;
      const nextData = typeof updater === 'function' ? updater(prevData) : updater;
      return { ...prev, response: { ...(prev.response || {}), data: nextData } };
    });
  }, []);

  return {
    data: result.response?.data ?? null,
    response: result.response,
    loading,
    error: loading ? '' : result.error,
    status: loading ? null : result.status,
    refetch,
    setData,
  };
}
