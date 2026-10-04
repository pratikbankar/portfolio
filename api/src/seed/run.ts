import { pathToFileURL } from 'node:url';
import type { Model } from 'mongoose';
import type { ZodType } from 'zod';
import { config } from '../config.js';
import { connect, disconnect } from '../db.js';
import { parseBody } from '../middleware/validate.js';
import { AdminUser, createAdminUser, hashPassword } from '../models/AdminUser.js';
import { Award } from '../models/Award.js';
import { Certification } from '../models/Certification.js';
import { Education } from '../models/Education.js';
import { Experience } from '../models/Experience.js';
import { Profile } from '../models/Profile.js';
import { Project } from '../models/Project.js';
import { SectionSettings } from '../models/SectionSettings.js';
import { Skill } from '../models/Skill.js';
import { SocialLink } from '../models/SocialLink.js';
import { slugify } from '../routes/crud.js';
import {
  awardSchema, certificationSchema, educationSchema, experienceSchema,
  profileSchema, projectSchema, skillSchema, socialLinkSchema,
} from '../schemas.js';
import { COLLECTIONS, publish } from '../services/publish.js';
import { saveProfile } from '../services/singletons.js';
import * as content from './content.js';

export interface SeedOptions {
  /** Replace all site content with the resume content. Messages, files and the admin are kept. */
  reset?: boolean;
  /** Set the admin password to the current ADMIN_PASSWORD. */
  resetPassword?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insert(model: Model<any>, schema: ZodType, items: object[], extra?: (item: any) => object) {
  // Every item goes through the same validation the admin API applies.
  const docs = items.map((item, order) => {
    const parsed = parseBody(schema, item) as object;
    return { ...parsed, ...(extra ? extra(parsed) : {}), order };
  });
  await model.insertMany(docs);
}

async function hasContent(): Promise<boolean> {
  const profile = await Profile.findOne({ key: 'main' }).lean();
  if (profile?.name) return true;
  const counts = await Promise.all(Object.values(COLLECTIONS).map((m) => m.estimatedDocumentCount()));
  return counts.some((n) => n > 0);
}

export async function seed(options: SeedOptions = {}): Promise<{ seeded: boolean }> {
  const email = config.ADMIN_EMAIL.toLowerCase();
  const admin = await AdminUser.findOne({ email });
  if (!admin) await createAdminUser(email, config.ADMIN_PASSWORD);
  else if (options.resetPassword) {
    admin.passwordHash = await hashPassword(config.ADMIN_PASSWORD);
    await admin.save();
  }

  if (!options.reset && (await hasContent())) return { seeded: false };

  if (options.reset) {
    await Promise.all([
      ...Object.values(COLLECTIONS).map((m) => m.deleteMany({})),
      Profile.deleteMany({}),
      SectionSettings.deleteMany({}),
    ]);
  }

  await saveProfile(parseBody(profileSchema, content.profile));
  const skillItems = Object.entries(content.skills).flatMap(([category, names]) =>
    names.map((name) => ({ name, category })),
  );
  await insert(Skill, skillSchema, skillItems);
  await insert(Experience, experienceSchema, content.experiences);
  await insert(Project, projectSchema, content.projects, (p) => ({ slug: slugify(p.title) }));
  await insert(Education, educationSchema, content.education);
  await insert(Certification, certificationSchema, content.certifications);
  await insert(Award, awardSchema, content.awards);
  await insert(SocialLink, socialLinkSchema, content.socialLinks);

  await publish();
  return { seeded: true };
}

// Runs only when executed directly (npm run seed), not when imported by tests.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = new Set(process.argv.slice(2));
  connect(config.MONGODB_URI)
    .then(() => seed({ reset: args.has('--reset'), resetPassword: args.has('--reset-password') }))
    .then(({ seeded }) => {
      console.log(seeded ? 'Seeded and published the resume content.' : 'Content already exists; nothing changed. Use --reset to replace it.');
      console.log(`Admin account: ${config.ADMIN_EMAIL}`);
    })
    .catch((err) => {
      console.error(err);
      process.exitCode = 1;
    })
    .finally(() => disconnect());
}
