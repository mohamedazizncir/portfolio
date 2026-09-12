/**
 * In-memory, fixed-window rate limiter keyed by an arbitrary string
 * (typically client IP).
 *
 * Why in-memory instead of a database: this project runs on Vercel
 * serverless with no database yet (see ARCHITECTURE.md section 8, risk 3),
 * and the doc's own mitigation for that risk is explicitly "a short
 * in-memory or edge rate limiter on your own API route" — the goal here is
 * protecting your own free LLM quota from a casual bot or one visitor
 * hammering the endpoint, not a cryptographically strict distributed limit.
 *
 * Real limitation worth knowing: Vercel can run multiple concurrent
 * serverless instances for the same route, each with its own process
 * memory, and a cold start wipes this Map entirely. So this limiter is
 * authoritative only per warm instance, not globally across the whole
 * deployment — a determined attacker distributing requests across fresh
 * cold starts could exceed the nominal limit. For a personal portfolio's
 * traffic this is an acceptable tradeoff for zero added infrastructure; if
 * that stops being true, the fix is swapping this module's internals for
 * Vercel KV or Upstash Redis (same call signature, durable shared counter)
 * without touching the route.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so long-lived warm instances don't accumulate one
// entry per distinct visitor IP forever.
const MAX_TRACKED_KEYS = 5000;

function sweepExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  { limit, windowMs }: RateLimitOptions
): RateLimitResult {
  const now = Date.now();

  if (buckets.size > MAX_TRACKED_KEYS) sweepExpired(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  };
}
