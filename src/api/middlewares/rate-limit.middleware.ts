import type { Request, Response, NextFunction } from "express";
import rateLimit, { ipKeyGenerator, type Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { getRedisClient } from "../../infrastructure/cache/redis.client.js";

/**
 * Creates a RedisStore for express-rate-limit if Redis client is available.
 * If Redis is not configured or offline, returns undefined to fallback to in-memory store.
 */
function createStore(prefix: string) {
  const client = getRedisClient();
  if (!client) {
    return undefined;
  }

  return new RedisStore({
    sendCommand: ((...args: string[]) => {
      const command = args[0];
      if (!command) {
        return Promise.reject(
          new Error("No command provided to Redis sendCommand"),
        );
      }
      return client.call(command, ...args.slice(1));
    }) as any,
    prefix,
  });
}

/**
 * Standard error response handler adhering to CBS REST API envelope conventions.
 */
function rateLimitResponseHandler(
  _req: Request,
  res: Response,
  _next: NextFunction,
  options: Options,
) {
  const message =
    typeof options.message === "string"
      ? options.message
      : "Quá nhiều yêu cầu từ client. Vui lòng thử lại sau.";

  return res.status(options.statusCode).json({
    success: false,
    message,
    data: null,
    errorCode: "RATE_LIMIT_EXCEEDED",
  });
}

interface LimiterConfig {
  windowMs: number;
  limit: number;
  prefix: string;
  message: string;
  keyGenerator?: (req: Request) => string;
}

function buildRateLimiter(config: LimiterConfig) {
  const store = createStore(config.prefix);

  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    handler: rateLimitResponseHandler,
    message: config.message,
    ...(store ? { store } : {}),
    ...(config.keyGenerator ? { keyGenerator: config.keyGenerator } : {}),
  });
}

/**
 * 1. Global API Rate Limiter
 * Applied to all endpoints to protect against volumetric DoS.
 * Limit: 300 requests per 15 minutes per IP.
 */
export const globalLimiter = buildRateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  prefix: "rl:global:",
  message:
    "Hệ thống ghi nhận quá nhiều yêu cầu từ địa chỉ IP này. Vui lòng thử lại sau 15 phút.",
});

/**
 * 2. Authentication Rate Limiter
 * Applied to sensitive auth endpoints (login, register, forgot-password, reset-password).
 * Protects against credential stuffing and brute-force attacks.
 * Limit: 5 attempts per 1 minute per IP.
 */
export const authLimiter = buildRateLimiter({
  windowMs: 60 * 1000,
  limit: 5,
  prefix: "rl:auth:",
  message:
    "Bạn đã thao tác xác thực quá nhiều lần trong thời gian ngắn. Vui lòng đợi 1 phút rồi thử lại.",
});

/**
 * 3. Seat Hold Rate Limiter
 * Applied to POST /api/bookings/hold.
 * Protects against inventory denial-of-service / seat scalping bots.
 * Limit: 10 holds per 1 minute per user (or IP).
 */
export const seatHoldLimiter = buildRateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  prefix: "rl:hold:",
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId;
    if (userId) {
      return `user:${userId}`;
    }
    return ipKeyGenerator(req.ip || "127.0.0.1");
  },
  message:
    "Bạn đã thực hiện giữ ghế quá nhanh hoặc vượt giới hạn cho phép. Vui lòng thử lại sau 1 phút.",
});

/**
 * 4. Email / OTP Cooldown Limiter
 * Applied to email resend endpoints (resend verification, resend booking ticket email).
 * Protects email gateway quotas and prevents inbox flooding.
 * Limit: 1 request per 1 minute per user/recipient.
 */
export const emailLimiter = buildRateLimiter({
  windowMs: 60 * 1000,
  limit: 1,
  prefix: "rl:email:",
  keyGenerator: (req: Request) => {
    const userId = (req as any).user?.userId;
    if (userId) {
      return `user:${userId}`;
    }
    const bodyEmail = req.body?.email;
    if (typeof bodyEmail === "string" && bodyEmail.trim().length > 0) {
      return `email:${bodyEmail.trim().toLowerCase()}`;
    }
    return ipKeyGenerator(req.ip || "127.0.0.1");
  },
  message:
    "Yêu cầu gửi email quá thường xuyên. Vui lòng đợi 1 phút trước khi yêu cầu gửi lại.",
});
