// Fixed-window rate limiter, in-memory per Worker isolate.
//
// This is a best-effort guard against one signed-in user hammering the
// (paid, n8n-billed) generation endpoint from a single session — it is
// NOT a hard global cap: Cloudflare may route requests across multiple
// isolates, each with its own counter, and a cold start resets counts to
// zero. If you need a hard fleet-wide limit, move this to Cloudflare's
// Rate Limiting binding, Workers KV, or a Durable Object instead.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so long-lived isolates don't accumulate an
// unbounded number of expired buckets from one-off callers.
const MAX_BUCKETS_BEFORE_SWEEP = 5000;

function sweepExpired(now: number) {
  if (buckets.size < MAX_BUCKETS_BEFORE_SWEEP) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt };
}
