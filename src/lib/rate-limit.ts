// Simple in-memory rate limiter for auth endpoints
// For production with multiple instances, use Redis or Upstash

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

interface RateLimitConfig {
  maxRequests: number  // Maximum requests allowed
  windowMs: number     // Time window in milliseconds
}

interface RateLimitResult {
  success: boolean
  remaining: number
  resetIn: number  // Seconds until reset
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 5, windowMs: 60000 }
): RateLimitResult {
  const now = Date.now()
  const key = identifier

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // First request or window expired - create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    })
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetIn: Math.ceil(config.windowMs / 1000)
    }
  }

  if (entry.count >= config.maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000)
    }
  }

  // Increment counter
  entry.count++
  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000)
  }
}

// Preset configurations
export const AUTH_RATE_LIMIT = { maxRequests: 5, windowMs: 60000 }      // 5 per minute
export const REGISTER_RATE_LIMIT = { maxRequests: 3, windowMs: 300000 } // 3 per 5 minutes
