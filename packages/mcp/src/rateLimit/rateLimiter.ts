import type { RateLimitOptions } from "../gate/types.js";

export interface RateLimitDecision {
  allowed: boolean;
  retryAfterMs?: number;
}

export interface RateLimiter {
  check(now?: number): RateLimitDecision;
}

export function createRateLimiter(options: RateLimitOptions | undefined): RateLimiter | undefined {
  if (!options) {
    return undefined;
  }

  let windowStartedAt = 0;
  let count = 0;

  return {
    check(now = Date.now()): RateLimitDecision {
      if (options.max <= 0 || options.windowMs <= 0) {
        return { allowed: false, retryAfterMs: options.windowMs };
      }

      if (windowStartedAt === 0 || now - windowStartedAt >= options.windowMs) {
        windowStartedAt = now;
        count = 0;
      }

      if (count >= options.max) {
        return {
          allowed: false,
          retryAfterMs: Math.max(0, options.windowMs - (now - windowStartedAt))
        };
      }

      count += 1;
      return { allowed: true };
    }
  };
}
