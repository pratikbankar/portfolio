import { Router } from 'express';
import multer from 'multer';
import { AppError, ah } from '../errors.js';
import { deleteFile, MAX_UPLOAD_BYTES, openFile, saveFile } from '../services/files.js';

/** Public: streams an uploaded image or PDF. Ids are never reused, so responses cache forever. */
export function publicFilesRouter(): Router {
  const router = Router();
  router.get(
    '/:id',
    ah(async (req, res) => {
      const file = await openFile(req.params.id);
      if (!file) throw new AppError(404, 'not_found', 'File not found');
      const disposition = req.query.download ? 'attachment' : 'inline';
      const ascii = file.filename.replace(/[^\x20-\x7e]/g, '_');
      res.set({
        'Content-Type': file.contentType,
        'Content-Length': String(file.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(file.filename)}`,
      });
      file.stream.on('error', () => res.destroy());
      file.stream.pipe(res);
    }),
  );
  return router;
}

/** Admin: mounted behind requireAuth. */
export function adminFilesRouter(): Router {
  const router = Router();
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } });

  router.post(
    '/',
    upload.single('file'),
    ah(async (req, res) => {
      if (!req.file) throw new AppError(400, 'bad_request', 'No file was uploaded');
      res.status(201).json(await saveFile(req.file.buffer, req.file.originalname));
    }),
  );

  router.delete(
    '/:id',
    ah(async (req, res) => {
      if (!(await deleteFile(req.params.id))) throw new AppError(404, 'not_found', 'File not found');
      res.json({ ok: true });
    }),
  );
  return router;
}
