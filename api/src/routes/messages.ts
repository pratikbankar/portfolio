import { createHash } from 'node:crypto';
import { Router } from 'express';
import { config } from '../config.js';
import { AppError, ah } from '../errors.js';
import { createContactLimiter, visitorIp } from '../middleware/limits.js';
import { parseBody } from '../middleware/validate.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { contactSchema, messageReadSchema } from '../schemas.js';
import { assertId } from './crud.js';

const MIN_FILL_MS = 3000;

/** Bots fill the hidden "extra_notes" field or submit faster than a person can type. */
function looksAutomated(body: unknown): boolean {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.extra_notes === 'string' && b.extra_notes.trim() !== '') return true;
  return typeof b.elapsedMs !== 'number' || !Number.isFinite(b.elapsedMs) || b.elapsedMs < MIN_FILL_MS;
}

/** Public: POST /api/contact */
export function contactRouter(): Router {
  const router = Router();
  router.post(
    '/',
    createContactLimiter(),
    ah(async (req, res) => {
      // Answer exactly like a success so automated senders learn nothing.
      if (looksAutomated(req.body)) {
        res.json({ ok: true });
        return;
      }
      const data = parseBody(contactSchema, req.body);
      const ipHash = createHash('sha256').update(`${config.JWT_SECRET}:${visitorIp(req)}`).digest('hex');
      await ContactMessage.create({ ...data, ipHash });
      res.json({ ok: true });
    }),
  );
  return router;
}

/** Admin: mounted behind requireAuth. */
export function adminMessagesRouter(): Router {
  const router = Router();

  router.get(
    '/',
    ah(async (_req, res) => {
      res.json(await ContactMessage.find().sort({ createdAt: -1, _id: -1 }).limit(500).select('-ipHash').lean());
    }),
  );

  router.patch(
    '/:id',
    ah(async (req, res) => {
      const { read } = parseBody(messageReadSchema, req.body);
      const doc = await ContactMessage.findByIdAndUpdate(assertId(req.params.id), { $set: { read } }, { returnDocument: 'after' })
        .select('-ipHash')
        .lean();
      if (!doc) throw new AppError(404, 'not_found', 'Message not found');
      res.json(doc);
    }),
  );

  router.delete(
    '/:id',
    ah(async (req, res) => {
      const doc = await ContactMessage.findByIdAndDelete(assertId(req.params.id)).lean();
      if (!doc) throw new AppError(404, 'not_found', 'Message not found');
      res.json({ ok: true });
    }),
  );

  return router;
}
