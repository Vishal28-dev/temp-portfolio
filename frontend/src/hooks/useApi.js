import { useEffect, useRef, useState } from 'react';

/** Fetch-on-mount with abort, loading and error states. `fn` must be stable. */
export function useApi(fn, deps = [], { initial = null } = {}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;

    setLoading(true);
    setError(null);

    fnRef
      .current({ signal: controller.signal })
      .then((result) => {
        if (alive) setData(result);
      })
      .catch((err) => {
        if (alive && err?.name !== 'AbortError') setError(err);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}
