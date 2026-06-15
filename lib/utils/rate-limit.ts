import { redis } from "@/lib/db/redis";

export async function rateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; remaining: number }> {
  const k = `rate:${identifier}`;
  try {
    const count = await redis.incr(k);
    if (count === 1) await redis.expire(k, windowSeconds);
    const remaining = Math.max(0, limit - count);
    return { success: count <= limit, remaining };
  } catch {
    // Fail open if Redis is unavailable
    return { success: true, remaining: limit };
  }
}
