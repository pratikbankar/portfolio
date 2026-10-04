import type { CookieOptions, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../errors.js';
import { AdminUser } from '../models/AdminUser.js';

export const SESSION_COOKIE = 'pf_session';
const SEVEN_DAYS_S = 7 * 24 * 60 * 60;

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: config.isProd,
  sameSite: 'lax',
  path: '/',
};

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, config.JWT_SECRET, { expiresIn: SEVEN_DAYS_S });
}

export const sessionMaxAgeMs = SEVEN_DAYS_S * 1000;

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token: unknown = req.cookies?.[SESSION_COOKIE];
    if (typeof token !== 'string' || !token) throw new Error('missing');
    const payload = jwt.verify(token, config.JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof payload === 'string' || typeof payload.sub !== 'string') throw new Error('malformed');
    const user = await AdminUser.findById(payload.sub).lean();
    if (!user) throw new Error('gone');
    res.locals.admin = { id: String(user._id), email: user.email };
    next();
  } catch {
    next(new AppError(401, 'unauthorized', 'Please log in'));
  }
};
