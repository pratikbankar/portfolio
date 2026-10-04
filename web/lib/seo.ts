import type { Metadata } from 'next';
import { fileUrl, SITE_URL } from './site';
import type { Project, SiteContent } from './types';

const clip = (text: string, max = 160) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
};

function siteTitle(site: SiteContent): string {
  const { seoTitle, name, jobTitle } = site.profile;
  return seoTitle || [name, jobTitle].filter(Boolean).join(' | ') || 'Portfolio';
}

function siteDescription(site: SiteContent): string {
  const { seoDescription, summary, tagline, name } = site.profile;
  return clip(seoDescription || summary || tagline || `Portfolio of ${name}`);
}

/** Generated card from app/opengraph-image.tsx, used when there is no uploaded image. */
const DEFAULT_IMAGE = ['/opengraph-image'];

const photo = (site: SiteContent) => (site.profile.photoFileId ? [fileUrl(site.profile.photoFileId)] : DEFAULT_IMAGE);

export function homeMetadata(site: SiteContent): Metadata {
  const title = siteTitle(site);
  const description = siteDescription(site);
  return {
    title,
    description,
    alternates: { canonical: '/' },
    openGraph: { type: 'website', url: '/', siteName: site.profile.name || title, title, description, images: photo(site) },
    twitter: { card: 'summary_large_image', title, description, images: photo(site) },
  };
}

export function projectMetadata(site: SiteContent, project: Project): Metadata {
  const heading = [project.title, project.subtitle].filter(Boolean).join(': ');
  const title = [heading, site.profile.name].filter(Boolean).join(' | ');
  const description = clip(project.description || project.subtitle || heading);
  const url = `/projects/${project.slug}`;
  const images = project.imageFileIds[0] ? [fileUrl(project.imageFileIds[0])] : DEFAULT_IMAGE;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, siteName: site.profile.name, title, description, images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export function personJsonLd(site: SiteContent) {
  const { profile } = site;
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.jobTitle || undefined,
    description: siteDescription(site),
    url: SITE_URL,
    image: profile.photoFileId ? fileUrl(profile.photoFileId) : undefined,
    address: profile.location ? { '@type': 'PostalAddress', addressLocality: profile.location } : undefined,
    sameAs: site.socialLinks.map((l) => l.url).filter((u) => /^https?:\/\//i.test(u)),
    knowsAbout: site.skills.slice(0, 30).map((s) => s.name),
  };
}

/** The id is written into an inline script, so anything unexpected is refused. */
export function safeGaId(id: string): string | null {
  return /^G-[A-Z0-9]{4,20}$/.test(id) ? id : null;
}
