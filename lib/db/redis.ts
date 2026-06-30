import { Redis } from "@upstash/redis";

// Redis (Upstash) is used only as an optional cache layer. When it isn't
// configured — e.g. local dev with placeholder env vars — we fall back to a
// no-op stub so every caller simply misses the cache and reads from the
// database instead of crashing on an invalid URL.

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

const isConfigured =
  !!url &&
  !!token &&
  url.startsWith("https://") &&
  !url.includes("[") && // placeholder like https://[YOUR-ENDPOINT].upstash.io
  !token.toLowerCase().includes("your-");

type RedisLike = Pick<Redis, "get" | "set" | "del" | "incr" | "expire">;

function createStub(): RedisLike {
  return {
    get: async () => null,
    set: async () => null,
    del: async () => 0,
    incr: async () => 0,
    expire: async () => 0,
  } as unknown as RedisLike;
}

export const redis: RedisLike = isConfigured
  ? new Redis({ url: url!, token: token! })
  : createStub();
