// Lightweight in-memory token-bucket rate limiter, keyed by an arbitrary string (e.g. "route:ip").
// Suitable for a single-instance deployment. If this app ever runs across multiple instances
// (serverless, horizontally scaled), swap the Map for a shared store (e.g. Upstash Redis).

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) {
    return false;
  }

  bucket.count += 1;
  return true;
}

type HeaderSource = Headers | Record<string, string | string[] | undefined> | null | undefined;

export function getClientIp(headers: HeaderSource): string {
  if (!headers) return "unknown";

  const get = (name: string): string | undefined => {
    if (typeof (headers as Headers).get === "function") {
      return (headers as Headers).get(name) ?? undefined;
    }
    const value = (headers as Record<string, string | string[] | undefined>)[name];
    return Array.isArray(value) ? value[0] : value;
  };

  const forwardedFor = get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();

  return get("x-real-ip") ?? "unknown";
}
