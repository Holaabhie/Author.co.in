import Redis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function getRedisClient(): Redis {
  if (!process.env.REDIS_URL) {
    // Return a mock client for development without Redis
    console.warn("[REDIS] No REDIS_URL set, caching disabled");
    return new Proxy({} as Redis, {
      get: (_target, prop) => {
        if (prop === "get") return async () => null;
        if (prop === "set") return async () => "OK";
        if (prop === "del") return async () => 0;
        if (prop === "keys") return async () => [];
        if (prop === "flushall") return async () => "OK";
        return () => {};
      },
    });
  }

  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });
}

export const redis = globalForRedis.redis ?? getRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

// Cache helper functions
const DEFAULT_TTL = 300; // 5 minutes

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key);
    return data ? (JSON.parse(data) as T) : null;
  } catch {
    return null;
  }
}

export async function setCache(
  key: string,
  data: unknown,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch {
    // Silently fail — cache is non-critical
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch {
    // Silently fail
  }
}
