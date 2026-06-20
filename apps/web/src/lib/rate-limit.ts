/**
 * A small in-memory per-IP rate limiter for the public API routes (PRD Stage 10), protecting the
 * endpoints that reach paid AI providers from abuse. Fixed window. This holds state in the Node
 * process, which suits the single-instance VPS deployment; a shared store would be needed if the
 * app is scaled horizontally.
 */
interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Returns true if the request is within the limit, false if it should be rejected. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = windows.get(key);
  if (!entry || now >= entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count < limit) {
    entry.count += 1;
    return true;
  }
  return false;
}

/** Best-effort client IP from the proxy headers, with a stable fallback. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}
