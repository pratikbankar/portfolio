import { SECTION_KEYS, type SectionKey, type SiteContent } from './types';

/** Base URL of the Express API, without a trailing slash. */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').replace(/\/+$/, '');
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');

/** Absolute URL of an uploaded file. Used for images, which the Next.js optimizer fetches directly. */
export const fileUrl = (id: string) => `${API_URL}/api/files/${id}`;
/** Same-origin path of an uploaded file (proxied to the API). Used for resume links. */
export const filePath = (id: string, download = false) => `/api/files/${id}${download ? '?download=1' : ''}`;

const emptyProfile: SiteContent['profile'] = {
  name: '', jobTitle: '', tagline: '', summary: '', about: '', location: '', email: '',
  photoFileId: '', resumeFileId: '', seoTitle: '', seoDescription: '', gaMeasurementId: '',
};

const allSections = (on: boolean) =>
  Object.fromEntries(SECTION_KEYS.map((k) => [k, on])) as Record<SectionKey, boolean>;

/** Shown only when no published content can be loaded: a name and title, nothing else. */
export const fallbackSite: SiteContent = {
  profile: { ...emptyProfile, name: 'Pratik Bankar', jobTitle: 'Senior Full Stack Engineer' },
  sections: allSections(false),
  skills: [], experiences: [], projects: [], education: [], certifications: [], awards: [], socialLinks: [],
};

/** Fills gaps so content published by an older version of the API still renders. */
export function normalizeSite(raw: Partial<SiteContent> | null | undefined): SiteContent {
  const c = raw ?? {};
  const list = <T,>(v: T[] | undefined): T[] => (Array.isArray(v) ? v : []);
  return {
    profile: { ...emptyProfile, ...(c.profile ?? {}) },
    sections: { ...allSections(true), ...(c.sections ?? {}) },
    skills: list(c.skills),
    experiences: list(c.experiences),
    projects: list(c.projects),
    education: list(c.education),
    certifications: list(c.certifications),
    awards: list(c.awards),
    socialLinks: list(c.socialLinks),
  };
}

/**
 * Loads the published site content.
 *
 * If the API cannot be reached while a page is being regenerated, this throws on purpose:
 * Next.js then keeps serving the last successfully generated page. During `next build`
 * there is no earlier page to fall back to, so the minimal fallback is used instead.
 */
export async function getSite(): Promise<SiteContent> {
  try {
    const res = await fetch(`${API_URL}/api/public/site`, { next: { tags: ['site'], revalidate: 300 } });
    if (!res.ok) throw new Error(`API responded with ${res.status}`);
    const body = (await res.json()) as { content: Partial<SiteContent> | null };
    return body.content ? normalizeSite(body.content) : fallbackSite;
  } catch (err) {
    if (process.env.NEXT_PHASE === 'phase-production-build') return fallbackSite;
    throw err;
  }
}

/** Sections that are switched on and have something to show, in page order. */
export function visibleSections(site: SiteContent): SectionKey[] {
  const hasContent: Record<SectionKey, boolean> = {
    about: site.profile.about.trim() !== '',
    skills: site.skills.length > 0,
    experience: site.experiences.length > 0,
    projects: site.projects.length > 0,
    education: site.education.length > 0,
    certifications: site.certifications.length > 0,
    awards: site.awards.length > 0,
    resume: site.profile.resumeFileId !== '',
    contact: true,
  };
  return SECTION_KEYS.filter((k) => site.sections[k] && hasContent[k]);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  const month = match ? MONTHS[Number(match[2]) - 1] : undefined;
  return match && month ? `${month} ${match[1]}` : value;
}

export function formatRange(start: string, end: string | null): string {
  return `${formatMonth(start)} to ${end ? formatMonth(end) : 'Present'}`;
}

export const SECTION_LABELS: Record<SectionKey, string> = {
  about: 'About',
  skills: 'Skills',
  experience: 'Experience',
  projects: 'Projects',
  education: 'Education',
  certifications: 'Certifications',
  awards: 'Awards',
  resume: 'Resume',
  contact: 'Contact',
};
