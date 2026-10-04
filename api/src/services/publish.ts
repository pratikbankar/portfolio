import type { Model } from 'mongoose';
import { config } from '../config.js';
import { Award } from '../models/Award.js';
import { ContactMessage } from '../models/ContactMessage.js';
import { Certification } from '../models/Certification.js';
import { Education } from '../models/Education.js';
import { Experience } from '../models/Experience.js';
import { Project } from '../models/Project.js';
import { PublishedSnapshot } from '../models/PublishedSnapshot.js';
import { Skill } from '../models/Skill.js';
import { SocialLink } from '../models/SocialLink.js';
import type { SectionKey } from '../schemas.js';
import { removeUnusedFiles } from './files.js';
import { getProfile, getSections, type ProfileData } from './singletons.js';

type Item = Record<string, unknown> & { _id: string };

export interface SiteContent {
  profile: ProfileData;
  sections: Record<SectionKey, boolean>;
  skills: Item[];
  experiences: Item[];
  projects: Item[];
  education: Item[];
  certifications: Item[];
  awards: Item[];
  socialLinks: Item[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const COLLECTIONS: Record<string, Model<any>> = {
  skills: Skill,
  experiences: Experience,
  projects: Project,
  education: Education,
  certifications: Certification,
  awards: Award,
  socialLinks: SocialLink,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function list(model: Model<any>): Promise<Item[]> {
  const docs = await model.find().sort({ order: 1, _id: 1 }).select('-createdAt -updatedAt').lean();
  return docs.map((d) => ({ ...d, _id: String(d._id) }));
}

/** The working copy: everything the admin has saved, published or not. */
export async function buildDraft(): Promise<SiteContent> {
  const [profile, sections, skills, experiences, projects, education, certifications, awards, socialLinks] =
    await Promise.all([
      getProfile(), getSections(), list(Skill), list(Experience), list(Project),
      list(Education), list(Certification), list(Award), list(SocialLink),
    ]);
  return { profile, sections, skills, experiences, projects, education, certifications, awards, socialLinks };
}

async function revalidateWeb(): Promise<boolean> {
  try {
    const res = await fetch(`${config.WEB_ORIGIN}/internal/revalidate`, {
      method: 'POST',
      headers: { 'x-revalidate-secret': config.REVALIDATE_SECRET },
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function publish(): Promise<{ publishedAt: Date; revalidated: boolean }> {
  const content = await buildDraft();
  const publishedAt = new Date();
  await PublishedSnapshot.findOneAndUpdate(
    { key: 'main' },
    { $set: { content, publishedAt } },
    { upsert: true },
  );
  // Draft and published content are now identical, so anything neither refers to is safe to remove.
  await removeUnusedFiles(content).catch(() => 0);
  // The snapshot is already saved; a failed cache refresh must not fail the publish.
  return { publishedAt, revalidated: await revalidateWeb() };
}

async function getSnapshot(): Promise<{ content: SiteContent; publishedAt: Date } | null> {
  const doc = await PublishedSnapshot.findOne({ key: 'main' }).lean();
  return doc ? { content: doc.content as SiteContent, publishedAt: doc.publishedAt } : null;
}

/** Removes the content of disabled sections so it cannot be read through the public API. */
function hideDisabled(content: SiteContent): SiteContent {
  const s = content.sections;
  return {
    ...content,
    profile: {
      ...content.profile,
      about: s.about ? content.profile.about : '',
      resumeFileId: s.resume ? content.profile.resumeFileId : '',
    },
    skills: s.skills ? content.skills : [],
    experiences: s.experience ? content.experiences : [],
    projects: s.projects ? content.projects : [],
    education: s.education ? content.education : [],
    certifications: s.certifications ? content.certifications : [],
    awards: s.awards ? content.awards : [],
  };
}

export async function getPublished(): Promise<{ content: SiteContent | null; publishedAt: Date | null }> {
  const snap = await getSnapshot();
  if (!snap) return { content: null, publishedAt: null };
  return { content: hideDisabled(snap.content), publishedAt: snap.publishedAt };
}

export async function getDashboard() {
  const [snap, draft, unreadMessages] = await Promise.all([
    getSnapshot(),
    buildDraft(),
    ContactMessage.countDocuments({ read: false }),
  ]);
  const counts = Object.fromEntries(
    Object.keys(COLLECTIONS).map((k) => [k, (draft[k as keyof SiteContent] as Item[]).length]),
  );
  return {
    counts,
    unreadMessages,
    publishedAt: snap?.publishedAt ?? null,
    hasUnpublishedChanges: !snap || JSON.stringify(snap.content) !== JSON.stringify(draft),
  };
}
