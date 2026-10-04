// Entry point when the API runs as a Vercel function (src/index.ts is the long-running server).
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from '../src/app.js';
import { config } from '../src/config.js';
import { connect } from '../src/db.js';

const app = createApp();

// One connection per warm function instance, shared by every request it serves.
let ready: Promise<void> | null = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    ready ??= connect(config.MONGODB_URI);
    await ready;
  } catch (err) {
    ready = null; // try again on the next request rather than staying broken
    console.error(err);
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'unavailable', message: 'The service is temporarily unavailable' } }));
    return;
  }
  app(req, res);
}
