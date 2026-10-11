import { FieldValue } from "firebase-admin/firestore";
import { key, rateLimits } from "@/lib/db";

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() || request.headers.get("x-real-ip") || "local";
}

/**
 * Fixed-window limiter backed by Firestore (works across several server
 * instances). Returns how many seconds to wait when the limit is exceeded.
 */
export async function rateLimit(name: string, limit: number, windowSeconds: number) {
  const nowMs = Date.now();
  const bucket = Math.floor(nowMs / (windowSeconds * 1000));
  const resetAtMs = (bucket + 1) * windowSeconds * 1000;

  // An atomic increment, then a read: under concurrent requests the count read may already include
  // the others, which only makes the limit stricter, never looser.
  const ref = rateLimits().doc(key(name, bucket));
  await ref.set({ count: FieldValue.increment(1), expireAt: new Date(resetAtMs + 60_000) }, { merge: true });
  const doc = (await ref.get()).data();

  const ok = (doc?.count ?? 1) <= limit;
  return { ok, retryAfter: Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000)) };
}

export function tooManyRequests(retryAfter: number) {
  const minutes = Math.ceil(retryAfter / 60);
  return Response.json(
    { error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.` },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}
