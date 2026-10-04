import { Router } from 'express';
import { ah } from '../errors.js';
import { requireAuth } from '../middleware/auth.js';
import { parseBody } from '../middleware/validate.js';
import { Award } from '../models/Award.js';
import { Certification } from '../models/Certification.js';
import { Education } from '../models/Education.js';
import { Experience } from '../models/Experience.js';
import { Project } from '../models/Project.js';
import { Skill } from '../models/Skill.js';
import { SocialLink } from '../models/SocialLink.js';
import {
  awardSchema, certificationSchema, educationSchema, experienceSchema,
  profileSchema, projectSchema, sectionsSchema, skillSchema, socialLinkSchema,
} from '../schemas.js';
import { buildDraft, getDashboard, publish } from '../services/publish.js';
import { getProfile, getSections, saveProfile, saveSections } from '../services/singletons.js';
import { crudRouter } from './crud.js';
import { adminFilesRouter } from './files.js';

export function adminRouter(): Router {
  const router = Router();
  router.use(requireAuth);

  router.use('/skills', crudRouter(Skill, skillSchema));
  router.use('/experiences', crudRouter(Experience, experienceSchema));
  router.use('/projects', crudRouter(Project, projectSchema, { slugFrom: 'title' }));
  router.use('/education', crudRouter(Education, educationSchema));
  router.use('/certifications', crudRouter(Certification, certificationSchema));
  router.use('/awards', crudRouter(Award, awardSchema));
  router.use('/social-links', crudRouter(SocialLink, socialLinkSchema));

  router.use('/files', adminFilesRouter());

  router.get('/profile', ah(async (_req, res) => res.json(await getProfile())));
  router.put('/profile', ah(async (req, res) => res.json(await saveProfile(parseBody(profileSchema, req.body)))));

  router.get('/sections', ah(async (_req, res) => res.json(await getSections())));
  router.put('/sections', ah(async (req, res) => res.json(await saveSections(parseBody(sectionsSchema, req.body)))));

  router.get('/preview', ah(async (_req, res) => res.json(await buildDraft())));
  router.post('/publish', ah(async (_req, res) => res.json(await publish())));
  router.get('/dashboard', ah(async (_req, res) => res.json(await getDashboard())));

  return router;
}
