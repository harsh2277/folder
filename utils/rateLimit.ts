/**
 * Minimal in-memory sliding-window rate limiter.
 *
 * Suitable for a single-instance Node server. On serverless/multi-instance
 * deployments (Vercel, etc.) this state is per-instance and NOT shared —
 * swap this for a shared store (Upstash Redis, etc.) before relying on it
 * in a horizontally-scaled production deployment.
 */

const buckets = new Map<string, number[]>();

// Periodically drop stale buckets so this doesn't grow unbounded.
const MAX_BUCKETS = 5000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (buckets.size > MAX_BUCKETS) {
    buckets.clear();
  }

  const timestamps = (buckets.get(key) || []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    const retryAfterMs = timestamps[0] + windowMs - now;
    buckets.set(key, timestamps);
    return { allowed: false, remaining: 0, retryAfterMs: Math.max(retryAfterMs, 0) };
  }

  timestamps.push(now);
  buckets.set(key, timestamps);
  return { allowed: true, remaining: limit - timestamps.length, retryAfterMs: 0 };
}

/** Extracts a best-effort client identifier from a Request for rate-limit keying. */
export function clientKeyFrom(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || 'unknown';
}
