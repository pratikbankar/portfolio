import { Router } from 'express';
import mongoose, { type Model } from 'mongoose';
import type { ZodType } from 'zod';
import { AppError, ah } from '../errors.js';
import { parseBody } from '../middleware/validate.js';
import { reorderSchema } from '../schemas.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = Model<any>;

interface CrudOptions {
  /** Field the URL slug is derived from. Enables unique slug handling. */
  slugFrom?: string;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function uniqueSlug(model: AnyModel, wanted: string, excludeId?: string): Promise<string> {
  const base = slugify(wanted) || 'project';
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const clash = await model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) });
    if (!clash) return slug;
  }
}

export function assertId(id: string): string {
  if (!/^[a-f0-9]{24}$/.test(id) || !mongoose.isValidObjectId(id)) {
    throw new AppError(400, 'invalid_id', 'Invalid id');
  }
  return id;
}

export function crudRouter(model: AnyModel, schema: ZodType, opts: CrudOptions = {}): Router {
  const router = Router();

  router.get(
    '/',
    ah(async (_req, res) => {
      res.json(await model.find().sort({ order: 1, _id: 1 }).lean());
    }),
  );

  router.post(
    '/',
    ah(async (req, res) => {
      const data = parseBody(schema, req.body) as Record<string, unknown>;
      const last = await model.findOne().sort({ order: -1 }).select('order').lean<{ order: number }>();
      if (opts.slugFrom) {
        data.slug = await uniqueSlug(model, String(data.slug || data[opts.slugFrom]));
      }
      const doc = await model.create({ ...data, order: last ? last.order + 1 : 0 });
      res.status(201).json(doc.toObject());
    }),
  );

  // Registered before '/:id' so "reorder" is not read as an id.
  router.put(
    '/reorder',
    ah(async (req, res) => {
      const { ids } = parseBody(reorderSchema, req.body);
      const existing = (await model.find().select('_id').lean()).map((d) => String(d._id));
      const unique = new Set(ids);
      const sameSet = unique.size === ids.length && ids.length === existing.length && existing.every((id) => unique.has(id));
      if (!sameSet) {
        throw new AppError(400, 'invalid_order', 'The order must list every item exactly once');
      }
      await model.bulkWrite(
        ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })),
      );
      res.json(await model.find().sort({ order: 1, _id: 1 }).lean());
    }),
  );

  router.put(
    '/:id',
    ah(async (req, res) => {
      const id = assertId(req.params.id);
      const data = parseBody(schema, req.body) as Record<string, unknown>;
      if (opts.slugFrom) {
        // The slug is the public URL, so it only changes when explicitly edited.
        if (data.slug) data.slug = await uniqueSlug(model, String(data.slug), id);
        else delete data.slug;
      }
      const doc = await model.findByIdAndUpdate(id, { $set: data }, { returnDocument: 'after', runValidators: true }).lean();
      if (!doc) throw new AppError(404, 'not_found', 'Item not found');
      res.json(doc);
    }),
  );

  router.delete(
    '/:id',
    ah(async (req, res) => {
      const doc = await model.findByIdAndDelete(assertId(req.params.id)).lean();
      if (!doc) throw new AppError(404, 'not_found', 'Item not found');
      res.json({ ok: true });
    }),
  );

  return router;
}
