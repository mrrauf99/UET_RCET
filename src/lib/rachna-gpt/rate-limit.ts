import "server-only";

// Limits reset on cold starts and are per instance; production needs a shared limiter or WAF.

export const RATE_LIMIT = { requests: 20, windowMs: 60_000, concurrent: 2 } as const;
const SWEEP_EVERY_MS = 30_000;

interface Bucket {
  hits: number[];
  active: number;
}

const buckets = new Map<string, Bucket>();
let lastSweep = 0;

// Trust only a proxy-overwritten IP header; x-forwarded-for may contain client-supplied values.
export function getClientIp(headers: Headers): string {
  const header = process.env.RACHNA_GPT_IP_HEADER ?? "x-real-ip";
  return headers.get(header)?.trim() || "unknown";
}

function sweep(now: number) {
  if (now - lastSweep < SWEEP_EVERY_MS) return;
  lastSweep = now;
  for (const [ip, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((time) => now - time < RATE_LIMIT.windowMs);
    if (bucket.hits.length === 0 && bucket.active === 0) buckets.delete(ip);
  }
}

type LimitResult = { ok: true; release: () => void } | { ok: false; retryAfter: number };

export function acquire(ip: string, now = Date.now()): LimitResult {
  sweep(now);
  const bucket = buckets.get(ip) ?? { hits: [], active: 0 };
  bucket.hits = bucket.hits.filter((time) => now - time < RATE_LIMIT.windowMs);
  buckets.set(ip, bucket);

  if (bucket.hits.length >= RATE_LIMIT.requests) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((bucket.hits[0] + RATE_LIMIT.windowMs - now) / 1000)) };
  }
  if (bucket.active >= RATE_LIMIT.concurrent) return { ok: false, retryAfter: 5 };

  bucket.hits.push(now);
  bucket.active++;
  let released = false;
  return {
    ok: true,
    release: () => {
      if (released) return;
      released = true;
      bucket.active--;
    },
  };
}

export function resetRateLimits() {
  buckets.clear();
  lastSweep = 0;
}
