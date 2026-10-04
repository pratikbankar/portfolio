import { Router } from 'express';
import { AppError, ah } from '../errors.js';
import { getPublished } from '../services/publish.js';

export function publicRouter(): Router {
  const router = Router();

  router.get(
    '/public/site',
    ah(async (_req, res) => {
      res.json(await getPublished());
    }),
  );

  router.get(
    '/public/projects/:slug',
    ah(async (req, res) => {
      const { content } = await getPublished();
      const project = content?.projects.find((p) => p.slug === req.params.slug);
      if (!project) throw new AppError(404, 'not_found', 'Project not found');
      res.json(project);
    }),
  );

  return router;
}
