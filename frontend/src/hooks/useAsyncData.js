import { useCallback, useEffect, useState } from 'react';

/**
 * Loads data from an async function and exposes loading/error/reload state.
 * The loader should be stable (for example, an API method or a useCallback).
 */
export function useAsyncData(loadFn) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError('');

    loadFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Something went wrong.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [loadFn, version]);

  return { data, loading, error, reload };
}
