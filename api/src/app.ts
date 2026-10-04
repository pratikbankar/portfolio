import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { config } from './config.js';
import { errorHandler, notFound } from './errors.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { publicFilesRouter } from './routes/files.js';

export function createApp(): Express {
  const app = express();
  // Render and Vercel sit in front of the app; needed for correct client IPs.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: config.WEB_ORIGIN, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use('/api/auth', authRouter());
  app.use('/api/admin', adminRouter());
  app.use('/api/files', publicFilesRouter());

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
