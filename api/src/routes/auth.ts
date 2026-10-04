import bcrypt from 'bcryptjs';
import { Router } from 'express';
import { z } from 'zod';
import { AppError, ah } from '../errors.js';
import { cookieOptions, requireAuth, SESSION_COOKIE, sessionMaxAgeMs, signSession } from '../middleware/auth.js';
import { createLoginLimiter } from '../middleware/limits.js';
import { validate } from '../middleware/validate.js';
import { AdminUser } from '../models/AdminUser.js';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(1).max(200),
});

// Compared against when the email is unknown, so response time does not reveal which emails exist.
const DUMMY_HASH = '$2b$12$CwTycUXWue0Thq9StjUM0uJ8.2uDq8t8eYp9u9nP0wYQk0m9oQe1a';

export function authRouter(): Router {
  const router = Router();

  router.post(
    '/login',
    createLoginLimiter(),
    validate(loginSchema),
    ah(async (req, res) => {
      const { email, password } = req.body as z.infer<typeof loginSchema>;
      const user = await AdminUser.findOne({ email });
      const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
      if (!user || !ok) throw new AppError(401, 'invalid_credentials', 'Incorrect email or password');
      res.cookie(SESSION_COOKIE, signSession(String(user._id)), { ...cookieOptions, maxAge: sessionMaxAgeMs });
      res.json({ email: user.email });
    }),
  );

  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.json({ ok: true });
  });

  router.get('/me', requireAuth, (_req, res) => {
    res.json({ email: res.locals.admin.email });
  });

  return router;
}
