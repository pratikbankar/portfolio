import { describe, expect, it } from 'vitest';
import { homeMetadata, personJsonLd, projectMetadata, safeGaId } from '../lib/seo';
import { fallbackSite } from '../lib/site';
import type { Project, SiteContent } from '../lib/types';

const site: SiteContent = {
  ...fallbackSite,
  profile: {
    ...fallbackSite.profile,
    name: 'Pratik Bankar',
    jobTitle: 'Senior Full Stack Engineer',
    summary: 'Builds scalable web applications.',
    location: 'Pune, Maharashtra, India',
    email: 'pratikbankar88@gmail.com',
  },
  socialLinks: [
    { _id: '1', order: 0, platform: 'LinkedIn', url: 'https://www.linkedin.com/in/x' },
    { _id: '2', order: 1, platform: 'Email', url: 'mailto:a@b.co' },
  ],
};

const project: Project = {
  _id: 'p1', order: 0, title: 'Quattr', slug: 'quattr', subtitle: 'Enterprise SEO Platform', role: '',
  description: 'An SEO platform. '.repeat(30), highlights: [], technologies: [], imageFileIds: [],
  githubUrl: '', liveUrl: '', featured: true,
};

describe('homeMetadata', () => {
  it('falls back to name and job title when no SEO title is set', () => {
    const meta = homeMetadata(site);
    expect(meta.title).toBe('Pratik Bankar | Senior Full Stack Engineer');
    expect(meta.description).toBe('Builds scalable web applications.');
  });

  it('prefers the SEO fields from the admin panel', () => {
    const meta = homeMetadata({ ...site, profile: { ...site.profile, seoTitle: 'Custom', seoDescription: 'Custom description' } });
    expect(meta.title).toBe('Custom');
    expect(meta.description).toBe('Custom description');
    expect(meta.openGraph?.title).toBe('Custom');
  });

  it('sets the canonical URL and Open Graph basics', () => {
    const meta = homeMetadata(site);
    expect(meta.alternates?.canonical).toBe('/');
    expect(meta.openGraph).toMatchObject({ type: 'website', url: '/', siteName: 'Pratik Bankar' });
    expect(meta.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('always uses the preview card generated on this site, never an image served by the API', () => {
    // The API may be asleep when a social network fetches the preview, so it must not depend on it.
    const withPhoto = { ...site, profile: { ...site.profile, photoFileId: 'a'.repeat(24) } };
    const withShot = { ...project, imageFileIds: ['b'.repeat(24)] };
    expect(homeMetadata(site).openGraph?.images).toEqual(['/opengraph-image']);
    expect(homeMetadata(withPhoto).openGraph?.images).toEqual(['/opengraph-image']);
    expect(projectMetadata(site, withShot).openGraph?.images).toEqual(['/opengraph-image']);
    expect(projectMetadata(site, withShot).twitter?.images).toEqual(['/opengraph-image']);
  });

  it('still produces a title when the profile is empty', () => {
    const empty = { ...site, profile: { ...site.profile, name: '', jobTitle: '', summary: '' } };
    expect(homeMetadata(empty).title).toBe('Portfolio');
  });
});

describe('projectMetadata', () => {
  it('builds a title, a trimmed description and a canonical URL', () => {
    const meta = projectMetadata(site, project);
    expect(meta.title).toBe('Quattr: Enterprise SEO Platform | Pratik Bankar');
    expect(String(meta.description).length).toBeLessThanOrEqual(160);
    expect(meta.alternates?.canonical).toBe('/projects/quattr');
  });
});

describe('personJsonLd', () => {
  it('describes the person and links only web profiles', () => {
    const ld = personJsonLd(site);
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('Pratik Bankar');
    expect(ld.sameAs).toEqual(['https://www.linkedin.com/in/x']);
    expect(JSON.stringify(ld)).not.toContain('mailto:');
  });
});

describe('safeGaId', () => {
  it('accepts a well formed measurement id', () => {
    expect(safeGaId('G-ABC123XYZ9')).toBe('G-ABC123XYZ9');
  });
  it('rejects anything that could inject script', () => {
    expect(safeGaId("G-1');alert(1);//")).toBeNull();
    expect(safeGaId('')).toBeNull();
  });
});
