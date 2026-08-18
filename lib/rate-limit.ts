/**
 * Fixed-window rate limiter, in memory (PRD section 9: "rate limiting sederhana").
 *
 * HONEST LIMITATIONS, so the team can state these instead of overclaiming:
 *   - In-memory only. On Vercel each serverless instance keeps its own counter,
 *     so the effective limit is per-instance, not global. It raises the cost of
 *     casual abuse; it is not a defence against a distributed attacker.
 *   - A durable limiter would need Redis or Vercel KV, which means an external
 *     service holding request metadata. That conflicts with the project's
 *     no-third-party-data principle for a feature that guards a public,
 *     keyless, already-rate-limited upstream endpoint. The tradeoff is
 *     deliberate.
 *
 * What it does buy: a single client cannot loop the proxy fast enough to get our
 * deployment throttled by the upstream service during judging.
 */

export type RateLimitResult = {
  allowed: boolean;
  /** Requests still available in the current window. */
  remaining: number;
  /** Seconds until the window resets. Sent as `Retry-After` when blocked. */
  resetSeconds: number;
};

type Window = { count: number; expiresAt: number };

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;
/** Guards against unbounded growth if many distinct clients appear. */
const MAX_TRACKED_CLIENTS = 10_000;

const windows = new Map<string, Window>();

function sweep(now: number) {
  for (const [key, window] of windows) {
    if (window.expiresAt <= now) windows.delete(key);
  }
}

export function rateLimit(
  key: string,
  { max = MAX_REQUESTS, windowMs = WINDOW_MS } = {},
): RateLimitResult {
  const now = Date.now();
  const existing = windows.get(key);

  if (!existing || existing.expiresAt <= now) {
    if (windows.size >= MAX_TRACKED_CLIENTS) sweep(now);

    windows.set(key, { count: 1, expiresAt: now + windowMs });
    return {
      allowed: true,
      remaining: max - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
    };
  }

  existing.count += 1;
  const resetSeconds = Math.max(1, Math.ceil((existing.expiresAt - now) / 1000));

  return {
    allowed: existing.count <= max,
    remaining: Math.max(0, max - existing.count),
    resetSeconds,
  };
}

/**
 * Best-effort client identity for rate limiting.
 *
 * Uses the proxy-supplied forwarded IP. This is not an audit trail: the value is
 * only ever used as a map key in memory for at most one minute, is never logged,
 * and is never written anywhere.
 */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
