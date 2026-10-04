// Mirrors the SiteContent shape produced by the API (api/src/services/publish.ts).

export const SECTION_KEYS = [
  'about', 'skills', 'experience', 'projects', 'education',
  'certifications', 'awards', 'resume', 'contact',
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export interface Profile {
  name: string;
  jobTitle: string;
  tagline: string;
  summary: string;
  about: string;
  location: string;
  email: string;
  photoFileId: string;
  resumeFileId: string;
  seoTitle: string;
  seoDescription: string;
  gaMeasurementId: string;
}

interface Base {
  _id: string;
  order: number;
}

export interface Skill extends Base {
  name: string;
  category: string;
}

export interface Experience extends Base {
  company: string;
  role: string;
  location: string;
  /** 'YYYY-MM' */
  startDate: string;
  /** 'YYYY-MM', or null when the role is current */
  endDate: string | null;
  responsibilities: string[];
  achievements: string[];
}

export interface Project extends Base {
  title: string;
  slug: string;
  subtitle: string;
  role: string;
  description: string;
  highlights: string[];
  technologies: string[];
  imageFileIds: string[];
  githubUrl: string;
  liveUrl: string;
  featured: boolean;
}

export interface Education extends Base {
  degree: string;
  field: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string | null;
}

export interface Certification extends Base {
  name: string;
  issuer: string;
  status: 'completed' | 'in-progress';
  year: string;
  url: string;
}

export interface Award extends Base {
  title: string;
  issuer: string;
  description: string;
  year: string;
}

export interface SocialLink extends Base {
  platform: string;
  url: string;
}

export interface SiteContent {
  profile: Profile;
  sections: Record<SectionKey, boolean>;
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  education: Education[];
  certifications: Certification[];
  awards: Award[];
  socialLinks: SocialLink[];
}
