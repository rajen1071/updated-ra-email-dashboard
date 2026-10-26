import { useEffect, useState } from "react";

/**
 * Browser-side copy of API responses, so the dashboard never waits when
 * switching sections or reloading the page:
 *  - memory:  responses loaded in this tab (instant page switches)
 *  - storage: the same responses in localStorage (instant after a reload)
 * A copy read from storage is quietly synced once per tab with the copy
 * saved on the server (api/_lib/cache.js) — that does NOT call Mautic.
 * Only refetch() — the Refresh button — pulls fresh data from Mautic.
 */
// Bump when a response's shape changes, so copies saved by older code
// (missing new fields) are dropped instead of shown.
const STORAGE_PREFIX = "api-cache:v7:";
const memory = new Map(); // path -> response
const synced = new Set(); // paths fetched from the server in this tab
const inflight = new Map(); // request key -> promise, so requests are shared

// Remove copies saved under older prefixes.
try {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith("api-cache:") && !key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
  }
} catch {
  // Storage unavailable — nothing to clean up.
}

function readStored(path) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + path);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStored(path, data) {
  try {
    localStorage.setItem(STORAGE_PREFIX + path, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — the in-memory copy still works.
  }
}

function getCached(path) {
  if (!memory.has(path)) {
    const stored = readStored(path);
    if (stored) memory.set(path, stored);
  }
  return memory.get(path) ?? null;
}

function load(path, refresh = false) {
  const key = refresh ? `${path}#refresh` : path;
  if (inflight.has(key)) return inflight.get(key);

  const url = refresh ? `${path}${path.includes("?") ? "&" : "?"}refresh=1` : path;
  const request = fetch(url)
    .then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
      }
      return res.json();
    })
    .then((json) => {
      memory.set(path, json);
      synced.add(path);
      writeStored(path, json);
      return json;
    })
    .finally(() => inflight.delete(key));

  inflight.set(key, request);
  return request;
}

/** Load sections in the background so opening them later is instant. */
export function prefetch(paths) {
  for (const path of paths) {
    if (!synced.has(path)) load(path).catch(() => {});
  }
}

/**
 * useApiData("/api/dashboard-summary")
 * Calls one of our own Vercel serverless functions (which in turn talk
 * to Mautic). Returns { data, loading, error, refetch }.
 */
export function useApiData(path) {
  const [data, setData] = useState(() => getCached(path));
  const [loading, setLoading] = useState(() => !getCached(path));
  const [error, setError] = useState(null);
  // Set by refetch(); only forces a refresh for the path it was made for.
  const [refreshRequest, setRefreshRequest] = useState(null);

  useEffect(() => {
    const refresh = refreshRequest?.path === path;
    const cached = getCached(path);
    setError(null);

    if (!refresh && cached && synced.has(path)) {
      setData(cached);
      setLoading(false);
      return;
    }

    // Show any copy we have right away; only spin when there's nothing
    // to show yet, or when the user asked for a refresh.
    if (cached && !refresh) {
      setData(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    let cancelled = false;
    load(path, refresh)
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        // A failed background sync keeps showing the copy we already have.
        if (!cancelled && (refresh || !cached)) setError(err.message);
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
