import type { ErrorRequestHandler, RequestHandler } from 'express';
import { config } from './config.js';

export class AppError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'not_found', 'Resource not found'));
};

type HttpishError = { type?: string; status?: number; code?: string; name?: string };

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
    return;
  }

  const e = err as HttpishError;
  if (e.type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'bad_request', message: 'Malformed JSON body' } });
    return;
  }
  if (e.type === 'entity.too.large' || e.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: { code: 'payload_too_large', message: 'Files must be 4 MB or smaller' } });
    return;
  }
  if (e.name === 'MulterError') {
    res.status(400).json({ error: { code: 'bad_request', message: 'Invalid upload' } });
    return;
  }

  if (!config.isTest) console.error(err);
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
};

/** Express 4 does not forward rejected promises to the error handler. */
export const ah =
  (fn: (...args: Parameters<RequestHandler>) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
