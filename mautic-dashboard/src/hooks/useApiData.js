import { useEffect, useState } from "react";

// Responses already loaded in this browser tab, keyed by path, so
// switching pages shows them instantly instead of fetching again.
const loaded = new Map();

/**
 * useApiData("/api/dashboard-summary")
 * Calls one of our own Vercel serverless functions (which in turn talk
 * to Mautic). Returns { data, loading, error, refetch }.
 *
 * Normal loads get the copy saved on the server (see api/_lib/cache.js).
 * refetch() — the Refresh button — asks the server to pull fresh data
 * from Mautic and save it.
 */
export function useApiData(path) {
  const [data, setData] = useState(() => loaded.get(path) ?? null);
  const [loading, setLoading] = useState(!loaded.has(path));
  const [error, setError] = useState(null);
  // Set by refetch(); only forces a refresh for the path it was made for.
  const [refreshRequest, setRefreshRequest] = useState(null);

  useEffect(() => {
    const refresh = refreshRequest?.path === path;
    if (!refresh && loaded.has(path)) {
      setData(loaded.get(path));
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = refresh ? `${path}${path.includes("?") ? "&" : "?"}refresh=1` : path;
    fetch(url)
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `Request failed (${res.status})`);
        }
        return res.json();
      })
      .then((json) => {
        loaded.set(path, json);
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [path, refreshRequest]);

  return { data, loading, error, refetch: () => setRefreshRequest({ path }) };
}
