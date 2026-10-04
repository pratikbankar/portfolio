import { z } from 'zod';

const str = (max: number) => z.string().trim().max(max);
const required = (max: number) => str(max).min(1, 'Required');
const optional = (max: number) => str(max).default('');
const list = (maxItems: number, maxLen: number) => z.array(required(maxLen)).max(maxItems).default([]);

// Links are rendered as href values, so only web schemes are allowed (no javascript: URLs).
const isWebUrl = (v: string) => /^https?:\/\//i.test(v) && URL.canParse(v);
const webUrl = str(500).refine(isWebUrl, 'Must be a full http(s) URL');
const optionalWebUrl = z.union([z.literal(''), webUrl]).default('');
const linkUrl = str(500).refine(
  (v) => isWebUrl(v) || /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(v),
  'Must be an http(s) URL or a mailto: address',
);

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use YYYY-MM');
const endDate = yearMonth.nullable().default(null);
const year = z.union([z.literal(''), z.string().regex(/^\d{4}$/, 'Use a four digit year')]).default('');
export const fileId = z.string().regex(/^[a-f0-9]{24}$/, 'Invalid file id');
const optionalFileId = z.union([z.literal(''), fileId]).default('');

const endNotBeforeStart = (v: { startDate: string; endDate: string | null }) =>
  v.endDate === null || v.endDate >= v.startDate;
const endDateIssue = { message: 'End date cannot be before the start date', path: ['endDate'] };

export const skillSchema = z.strictObject({ name: required(60), category: required(60) });

export const experienceSchema = z
  .strictObject({
    company: required(120),
    role: required(120),
    location: optional(120),
    startDate: yearMonth,
    endDate,
    responsibilities: list(20, 500),
    achievements: list(20, 500),
  })
  .refine(endNotBeforeStart, endDateIssue);

export const projectSchema = z.strictObject({
  title: required(120),
  slug: str(120).optional(),
  subtitle: optional(200),
  role: optional(120),
  description: optional(5000),
  highlights: list(20, 500),
  technologies: list(40, 60),
  imageFileIds: z.array(fileId).max(12).default([]),
  githubUrl: optionalWebUrl,
  liveUrl: optionalWebUrl,
  featured: z.boolean().default(false),
});

export const educationSchema = z
  .strictObject({
    degree: required(200),
    field: optional(200),
    institution: required(200),
    location: optional(120),
    startDate: yearMonth,
    endDate,
  })
  .refine(endNotBeforeStart, endDateIssue);

export const certificationSchema = z.strictObject({
  name: required(200),
  issuer: optional(120),
  status: z.enum(['completed', 'in-progress']).default('completed'),
  year,
  url: optionalWebUrl,
});

export const awardSchema = z.strictObject({
  title: required(200),
  issuer: optional(120),
  description: optional(1000),
  year,
});

export const socialLinkSchema = z.strictObject({ platform: required(40), url: linkUrl });

export const profileSchema = z.strictObject({
  name: required(120),
  jobTitle: optional(120),
  tagline: optional(200),
  summary: optional(1000),
  about: optional(5000),
  location: optional(120),
  email: z.union([z.literal(''), str(200).email()]).default(''),
  photoFileId: optionalFileId,
  resumeFileId: optionalFileId,
  seoTitle: optional(120),
  seoDescription: optional(300),
  gaMeasurementId: z.union([z.literal(''), z.string().regex(/^G-[A-Z0-9]{4,20}$/, 'Looks like G-XXXXXXXXXX')]).default(''),
});

export const SECTION_KEYS = [
  'about', 'skills', 'experience', 'projects', 'education',
  'certifications', 'awards', 'resume', 'contact',
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export const sectionsSchema = z.strictObject(
  Object.fromEntries(SECTION_KEYS.map((k) => [k, z.boolean()])) as Record<SectionKey, z.ZodBoolean>,
);

export const reorderSchema = z.strictObject({ ids: z.array(z.string()).max(500) });

export const PROFILE_KEYS = Object.keys(profileSchema.shape) as Array<keyof z.infer<typeof profileSchema>>;
