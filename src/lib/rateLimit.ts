/**
 * Simple in-memory rate limiter for API routes
 * 
 * Note: This works for single-instance deployments.
 * For multi-instance (serverless), consider using Redis or Upstash.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up old entries periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((entry, key) => {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

interface RateLimitOptions {
  /** Maximum number of requests allowed in the window */
  limit: number;
  /** Time window in seconds */
  windowSeconds: number;
  /** Identifier for the rate limit (e.g., 'dhl-api', 'email-send') */
  identifier: string;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetIn: number; // seconds until reset
}

/**
 * Check if a request should be rate limited
 * 
 * @param ip - The IP address or unique identifier of the requester
 * @param options - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  ip: string,
  options: RateLimitOptions
): RateLimitResult {
  const { limit, windowSeconds, identifier } = options;
  const key = `${identifier}:${ip}`;
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  const entry = rateLimitStore.get(key);

  // No existing entry or window has expired
  if (!entry || entry.resetTime < now) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      remaining: limit - 1,
      resetIn: windowSeconds,
    };
  }

  // Within window, check count
  if (entry.count >= limit) {
    return {
      success: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  // Increment count
  entry.count++;
  return {
    success: true,
    remaining: limit - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  };
}

/**
 * Get client IP from Next.js request
 */
export function getClientIp(req: { headers: { [key: string]: string | string[] | undefined }; socket?: { remoteAddress?: string } }): string {
  // Check for forwarded IP (behind proxy/load balancer)
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const ip = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0];
    return ip.trim();
  }

  // Check for real IP header (Cloudflare, etc.)
  const realIp = req.headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to socket address
  return req.socket?.remoteAddress || 'unknown';
}

/**
 * Pre-configured rate limiters for different API routes
 */
export const rateLimiters = {
  // DHL API: 10 requests per minute per IP
  dhl: (ip: string) => checkRateLimit(ip, {
    limit: 10,
    windowSeconds: 60,
    identifier: 'dhl',
  }),

  // Email sending: 5 requests per minute per IP
  email: (ip: string) => checkRateLimit(ip, {
    limit: 5,
    windowSeconds: 60,
    identifier: 'email',
  }),

  // Address confirmation: 10 requests per minute per IP
  addressConfirmation: (ip: string) => checkRateLimit(ip, {
    limit: 10,
    windowSeconds: 60,
    identifier: 'address-confirm',
  }),

  // Order creation: 3 requests per minute per IP (prevent spam orders)
  orderCreate: (ip: string) => checkRateLimit(ip, {
    limit: 3,
    windowSeconds: 60,
    identifier: 'order-create',
  }),

  // PostNord API: 10 requests per minute per IP
  postnord: (ip: string) => checkRateLimit(ip, {
    limit: 10,
    windowSeconds: 60,
    identifier: 'postnord',
  }),
};
