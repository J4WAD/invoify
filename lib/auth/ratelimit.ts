import "server-only";

type RateLimitResult = { success: boolean; remaining: number; reset: number };

let upstashModule: typeof import("@upstash/ratelimit") | null = null;
let redisModule: typeof import("@upstash/redis") | null = null;

async function getUpstash() {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        return null;
    }
    try {
        upstashModule ??= await import("@upstash/ratelimit");
        redisModule ??= await import("@upstash/redis");
        const { Ratelimit } = upstashModule;
        const { Redis } = redisModule;
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
        return { Ratelimit, redis };
    } catch {
        return null;
    }
}

// 5 login attempts per 15 min per identifier
export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
    const upstash = await getUpstash();
    if (!upstash) return { success: true, remaining: 99, reset: 0 };

    const limiter = new upstash.Ratelimit({
        redis: upstash.redis,
        limiter: upstash.Ratelimit.slidingWindow(5, "15 m"),
        prefix: "rl:login",
    });
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining, reset: result.reset };
}

// 30 PDF generates per minute per user
export async function checkPdfRateLimit(userId: string): Promise<RateLimitResult> {
    const upstash = await getUpstash();
    if (!upstash) return { success: true, remaining: 99, reset: 0 };

    const limiter = new upstash.Ratelimit({
        redis: upstash.redis,
        limiter: upstash.Ratelimit.slidingWindow(30, "1 m"),
        prefix: "rl:pdf",
    });
    const result = await limiter.limit(userId);
    return { success: result.success, remaining: result.remaining, reset: result.reset };
}

// 10 registrations per hour per IP
export async function checkRegisterRateLimit(ip: string): Promise<RateLimitResult> {
    const upstash = await getUpstash();
    if (!upstash) return { success: true, remaining: 99, reset: 0 };

    const limiter = new upstash.Ratelimit({
        redis: upstash.redis,
        limiter: upstash.Ratelimit.slidingWindow(10, "1 h"),
        prefix: "rl:register",
    });
    const result = await limiter.limit(ip);
    return { success: result.success, remaining: result.remaining, reset: result.reset };
}
