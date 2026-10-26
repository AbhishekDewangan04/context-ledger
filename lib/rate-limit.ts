import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const REDIS_URL_ENV_NAMES = ["UPSTASH_REDIS_REST_URL", "KV_REST_API_URL"];
const REDIS_TOKEN_ENV_NAMES = ["UPSTASH_REDIS_REST_TOKEN", "KV_REST_API_TOKEN"];

function pickEnv(names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim().length > 0) return value.trim();
  }
  return undefined;
}

let redisClient: Redis | null = null;
let redisInitialized = false;

function getRedis(): Redis | null {
  if (redisInitialized) return redisClient;
  redisInitialized = true;
  const url = pickEnv(REDIS_URL_ENV_NAMES);
  const token = pickEnv(REDIS_TOKEN_ENV_NAMES);
  if (url && token) {
    redisClient = new Redis({ url, token });
  }
  return redisClient;
}

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(prefix: string, limit: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const key = `${prefix}:${limit}`;
  let limiter = upstashLimiters.get(key);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(limit, "60 s"),
      prefix: `context-ledger:rl:${prefix}`,
    });
    upstashLimiters.set(key, limiter);
  }
  return limiter;
}

interface MemoryWindow {
  count: number;
  resetAt: number;
}

interface RateLimitGlobal {
  __contextLedgerMemoryRateLimit?: Map<string, MemoryWindow>;
}

const rateLimitGlobal = globalThis as unknown as RateLimitGlobal;
if (!rateLimitGlobal.__contextLedgerMemoryRateLimit) {
  rateLimitGlobal.__contextLedgerMemoryRateLimit = new Map();
}
const memoryStore = rateLimitGlobal.__contextLedgerMemoryRateLimit;

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { success: boolean; reset: number } {
  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    const reset = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt: reset });
    return { success: true, reset };
  }

  if (entry.count < limit) {
    entry.count += 1;
    return { success: true, reset: entry.resetAt };
  }

  return { success: false, reset: entry.resetAt };
}

export interface ClientIpInfo {
  ip: string;
  isSharedFallback: boolean;
}

let warnedMissingIp = false;

export function getClientIpInfo(request: Request): ClientIpInfo {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();
    if (ip.length > 0) {
      return { ip, isSharedFallback: false };
    }
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp && realIp.trim().length > 0) {
    return { ip: realIp.trim(), isSharedFallback: false };
  }
  if (!warnedMissingIp) {
    warnedMissingIp = true;
    console.warn(
      "[context-ledger] Request missing IP headers (x-forwarded-for / x-real-ip). Using stricter shared bucket (20/min).",
    );
  }
  return { ip: "shared-fallback", isSharedFallback: true };
}

export function getClientIp(request: Request): string {
  return getClientIpInfo(request).ip;
}

export interface RateLimitConfig {
  limit: number;
  prefix?: string;
  windowMs?: number;
}

export async function rateLimit(
  request: Request,
  config: RateLimitConfig,
): Promise<Response | null> {
  const { ip, isSharedFallback } = getClientIpInfo(request);
  const prefix = config.prefix ?? "default";
  const limit = isSharedFallback ? 20 : config.limit;
  const key = `${prefix}:${ip}`;
  const now = Date.now();

  const upstashLimiter = getUpstashLimiter(prefix, limit);
  if (upstashLimiter) {
    const res = await upstashLimiter.limit(ip);
    if (!res.success) {
      const retryAfter = Math.max(1, Math.ceil((res.reset - now) / 1000));
      return Response.json(
        {
          error: "too_many_requests",
          message: "Rate limit exceeded. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
          },
        },
      );
    }
    return null;
  }

  const { success, reset } = checkMemoryRateLimit(
    key,
    limit,
    config.windowMs ?? 60_000,
  );

  if (!success) {
    const retryAfter = Math.max(1, Math.ceil((reset - now) / 1000));
    return Response.json(
      {
        error: "too_many_requests",
        message: "Rate limit exceeded. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  return null;
}
