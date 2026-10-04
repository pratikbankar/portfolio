import type { Request } from 'express';
import rateLimit from 'express-rate-limit';
import { config } from '../config.js';

// Tests opt in to rate limiting per request so unrelated tests are not throttled.
const skip = (req: Request) => config.isTest && !req.headers['x-test-ratelimit'];

const limiter = (windowMs: number, limit: number, message: string) =>
  rateLimit({
    windowMs,
    limit,
    skip,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({ error: { code: 'rate_limited', message } });
    },
  });

export const createLoginLimiter = () =>
  limiter(15 * 60 * 1000, 5, 'Too many login attempts. Try again in 15 minutes.');

export const createContactLimiter = () =>
  limiter(60 * 60 * 1000, 5, 'Too many messages sent. Please try again later.');
