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

const byVisitor = (req: Request) => ipKeyGenerator(visitorIp(req));

/**
 * Each route gets two limits. The strict one counts per visitor, so one person cannot use up
 * everyone's allowance (or lock the owner out of the login). The looser one counts per
 * connecting address, which cannot be forged, and caps anyone who fakes the visitor header.
 */
const pair = (windowMs: number, perVisitor: number, perAddress: number, message: string) => [
  limiter(windowMs, perAddress, message),
  limiter(windowMs, perVisitor, message, byVisitor),
];

export const createLoginLimiter = () =>
  pair(15 * 60 * 1000, 5, 30, 'Too many login attempts. Try again in 15 minutes.');

export const createContactLimiter = () =>
  pair(60 * 60 * 1000, 5, 60, 'Too many messages sent. Please try again later.');
