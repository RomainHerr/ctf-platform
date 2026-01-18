/**
 * Rate Limiter Implementation
 * 
 * This module implements a sliding window rate limiter for API routes.
 * It protects against brute-force attacks and DoS attempts.
 * 
 * SECURITY FEATURES:
 * - Per-IP rate limiting
 * - Per-user rate limiting (when authenticated)
 * - Sliding window algorithm
 * - Memory-efficient cleanup
 * 
 * For production, consider using Redis for distributed rate limiting.
 */

import { RateLimitConfig, RateLimitEntry } from "@/types";

// In-memory store for rate limiting
// Note: In production with multiple instances, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup interval (every 5 minutes)
const CLEANUP_INTERVAL = 5 * 60 * 1000;

// Default configuration
const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "60000", 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10", 10),
};

/**
 * Rate limiter configurations for different endpoints
 */
export const RATE_LIMIT_CONFIGS = {
  // Flag submission - strict limiting
  flagSubmission: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 attempts per minute
  },
  // Authentication - moderate limiting
  authentication: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10, // 10 attempts per 15 minutes
  },
  // General API - lenient limiting
  general: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  // Password reset - very strict
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 attempts per hour
  },
} as const;

/**
 * Rate limiter result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Checks if a request should be rate limited.
 * 
 * @param identifier - Unique identifier (hashed IP or user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): RateLimitResult {
  const now = Date.now();
  const key = `rate:${identifier}`;
  const entry = rateLimitStore.get(key);

  // No existing entry - allow request
  if (!entry) {
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
      lastRequest: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Check if window has expired
  const windowExpired = now - entry.firstRequest > config.windowMs;

  if (windowExpired) {
    // Reset the window
    rateLimitStore.set(key, {
      count: 1,
      firstRequest: now,
      lastRequest: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  // Within window - check count
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil(
      (entry.firstRequest + config.windowMs - now) / 1000
    );

    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.firstRequest + config.windowMs,
      retryAfter,
    };
  }

  // Increment count
  entry.count += 1;
  entry.lastRequest = now;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.firstRequest + config.windowMs,
  };
}

/**
 * Resets rate limit for a specific identifier.
 * Useful after successful authentication.
 * 
 * @param identifier - The identifier to reset
 */
export function resetRateLimit(identifier: string): void {
  const key = `rate:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Gets the current rate limit status without incrementing.
 * 
 * @param identifier - The identifier to check
 * @param config - Rate limit configuration
 * @returns Current status
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { count: number; remaining: number; resetTime: number } {
  const key = `rate:${identifier}`;
  const entry = rateLimitStore.get(key);
  const now = Date.now();

  if (!entry || now - entry.firstRequest > config.windowMs) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetTime: now + config.windowMs,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetTime: entry.firstRequest + config.windowMs,
  };
}

/**
 * Cleans up expired entries from the rate limit store.
 * Called periodically to prevent memory leaks.
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  const maxWindow = Math.max(
    ...Object.values(RATE_LIMIT_CONFIGS).map((c) => c.windowMs)
  );

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastRequest > maxWindow) {
      rateLimitStore.delete(key);
    }
  }
}

// Start cleanup interval
if (typeof setInterval !== "undefined") {
  setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL);
}

/**
 * Creates rate limit headers for HTTP responses.
 * 
 * @param result - Rate limit result
 * @returns Headers object
 */
export function createRateLimitHeaders(
  result: RateLimitResult
): Record<string, string> {
  const headers: Record<string, string> = {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.resetTime.toString(),
  };

  if (result.retryAfter) {
    headers["Retry-After"] = result.retryAfter.toString();
  }

  return headers;
}
