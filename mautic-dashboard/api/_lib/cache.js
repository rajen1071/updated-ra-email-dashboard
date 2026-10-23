/**
 * cache.js
 * ------------------------------------------------------------------
 * Saves each API response in Redis (Upstash, added via Vercel →
 * Storage / Marketplace) so pages load the saved copy instead of
 * calling Mautic every time. Mautic is only called again when the
 * request has ?refresh=1 (the Refresh button) or nothing is saved yet.
 *
 * Env vars (added automatically when you connect Upstash Redis to the
 * Vercel project — either naming works):
 *   KV_REST_API_URL / KV_REST_API_TOKEN
 *   UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 *
 * Without them (e.g. local dev with no Redis), an in-memory cache is
 * used instead, which lasts until the server restarts.
 * ------------------------------------------------------------------
 */

// Bump this whenever an endpoint's response shape changes, so copies
// saved by older code (missing new fields) are ignored, not served.
const CACHE_VERSION = 2;

const memoryCache = new Map();

function redisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

async function redisCommand(command) {
  const { url, token } = redisConfig();
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error(`Redis error (${res.status}): ${await res.text()}`);
  return (await res.json()).result;
}

async function readCache(key) {
  if (!redisConfig()) return memoryCache.get(key) ?? null;
  const raw = await redisCommand(["GET", key]);
  return raw ? JSON.parse(raw) : null;
}

async function writeCache(key, value) {
  if (!redisConfig()) return memoryCache.set(key, value);
  await redisCommand(["SET", key, JSON.stringify(value)]);
}

// Cache key = endpoint path + its query params, minus "refresh".
function cacheKey(req) {
  const url = new URL(req.url, "http://localhost");
  url.searchParams.delete("refresh");
  url.searchParams.sort();
  return `mautic-dashboard:v${CACHE_VERSION}:${url.pathname}?${url.searchParams}`;
}

/**
 * Wrap an API handler so its successful (200) JSON responses are saved
 * and served from the cache. Each response gets a `cachedAt` timestamp.
 */
export function withCache(handler) {
  return async function cachedHandler(req, res) {
    const key = cacheKey(req);
    const refresh = new URL(req.url, "http://localhost").searchParams.get("refresh") === "1";

    if (!refresh) {
      try {
        const saved = await readCache(key);
        if (saved) return res.status(200).json(saved);
      } catch (err) {
        // Cache trouble should never break the dashboard — fall through to Mautic.
        console.warn(`Cache read failed for ${key}: ${err.message}`);
      }
    }

    // Handlers call res.json() without awaiting it, so keep the save
    // promise and wait for it before the function finishes.
    let pendingWrite = null;
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode !== 200) return originalJson(body);
      const withTime = { ...body, cachedAt: new Date().toISOString() };
      pendingWrite = writeCache(key, withTime).catch((err) =>
        console.warn(`Cache write failed for ${key}: ${err.message}`)
      );
      return originalJson(withTime);
    };

    await handler(req, res);
    await pendingWrite;
  };
}
