import type { Request } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { config } from '../config.js';

// Tests opt in to rate limiting per request so unrelated tests are not throttled.
const skip = (req: Request) => config.isTest && !req.headers['x-test-ratelimit'];

/**
 * The visitor's own address. Requests arrive through the web app's proxy, so `req.ip` is the
 * proxy; the visitor is the first X-Forwarded-For entry. That header can be forged by calling
 * the API directly, so this is only used where a forged value does little harm (contact form).
 */
export function visitorIp(req: Request): string {
  const forwarded = String(req.headers['x-forwarded-for'] ?? '').split(',')[0]?.trim();
  return forwarded || req.ip || 'unknown';
}

const limiter = (windowMs: number, limit: number, message: string, keyGenerator?: (req: Request) => string) =>
  rateLimit({
    windowMs,
    limit,
    skip,
    ...(keyGenerator ? { keyGenerator } : {}),
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: 'rate_limited', message } });
    },
  });

// Keyed on the connecting address, which cannot be forged: this one guards the password.
export const createLoginLimiter = () =>
  limiter(15 * 60 * 1000, 5, 'Too many login attempts. Try again in 15 minutes.');

export const createContactLimiter = () =>
  limiter(60 * 60 * 1000, 5, 'Too many messages sent. Please try again later.', (req) => ipKeyGenerator(visitorIp(req)));
