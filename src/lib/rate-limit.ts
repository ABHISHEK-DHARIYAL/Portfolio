import "server-only";

/**
 * A minimal fixed-window rate limiter, keyed by IP.
 *
 * IMPORTANT — honest limitation, not an oversight: this state lives in a
 * plain in-memory Map, scoped to a single server process. That's fine on a
 * traditional long-running Node server (e.g. `next start` on one machine),
 * but on serverless platforms like Vercel, each function instance gets its
 * own memory, and instances are recycled on a cold start — so this limit
 * is "best effort per warm instance," not a hard global cap. A user could
 * get a few extra requests through by hitting a fresh instance, and the
 * counter resets whenever an instance recycles.
 *
 * For a real global rate limit across all serverless instances, swap this
 * for a shared store — Upstash Redis (`@upstash/ratelimit`) is the
 * standard choice on Vercel and is a small, mechanical change: replace the
 * Map read/write below with Redis INCR + EXPIRE. Left as in-memory here so
 * this project has zero required paid dependencies out of the box.
 */

type WindowEntry = { count: number; resetAt: number };

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

const hits = new Map<string, WindowEntry>();

// Periodically drop stale entries so this Map can't grow unbounded over a
// long-lived process. No-op impact on serverless (short-lived instances).
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();
function cleanupIfDue() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of hits) {
    if (entry.resetAt <= now) hits.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export type RateLimitOptions = {
  windowMs?: number;
  maxRequests?: number;
};

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  cleanupIfDue();

  const windowMs = options.windowMs ?? WINDOW_MS;
  const maxRequests = options.maxRequests ?? MAX_REQUESTS_PER_WINDOW;

  const now = Date.now();
  const entry = hits.get(identifier);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    hits.set(identifier, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}
