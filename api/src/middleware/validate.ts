import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors.js';

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }));
    throw new AppError(400, 'validation_error', 'Some fields are invalid', details);
  }
  return result.data;
}

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, _res, next) => {
    try {
      req.body = parseBody(schema, req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
