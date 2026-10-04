import { afterEach, describe, expect, it, vi } from 'vitest';
import { fallbackSite, formatRange, getSite, visibleSections } from '../lib/site';
import type { SiteContent } from '../lib/types';

const published: SiteContent = {
  ...fallbackSite,
  profile: { ...fallbackSite.profile, name: 'Pratik Bankar', about: 'About me' },
  sections: { ...fallbackSite.sections, about: true, skills: true, contact: true },
  skills: [],
};

const respond = (body: unknown, status = 200) =>
  vi.fn(async () => new Response(JSON.stringify(body), { status }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('getSite', () => {
  it('returns the published content', async () => {
    vi.stubGlobal('fetch', respond({ content: published, publishedAt: '2026-10-04T00:00:00Z' }));
    expect((await getSite()).profile.name).toBe('Pratik Bankar');
  });

  it('uses the fallback when nothing has been published yet', async () => {
    vi.stubGlobal('fetch', respond({ content: null, publishedAt: null }));
    expect(await getSite()).toEqual(fallbackSite);
  });

  it('uses the fallback during a build when the API is unreachable, so the build succeeds', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));
    expect(await getSite()).toEqual(fallbackSite);
  });

  it('uses the fallback during a build when the API answers with an error', async () => {
    vi.stubEnv('NEXT_PHASE', 'phase-production-build');
    vi.stubGlobal('fetch', respond({ error: {} }, 500));
    expect(await getSite()).toEqual(fallbackSite);
  });

  it('throws at request time when the API is unreachable, so the last good page keeps being served', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('ECONNREFUSED'); }));
    await expect(getSite()).rejects.toThrow();
  });

  it('fills in fields that an older published snapshot does not have', async () => {
    const old = { profile: { name: 'Pratik' }, sections: { about: true }, skills: [{ _id: '1', name: 'React', category: 'Frontend', order: 0 }] };
    vi.stubGlobal('fetch', respond({ content: old, publishedAt: 'x' }));
    const site = await getSite();
    expect(site.projects).toEqual([]);
    expect(site.profile.resumeFileId).toBe('');
    expect(site.sections.contact).toBe(true);
    expect(site.skills).toHaveLength(1);
  });
});

describe('fallbackSite', () => {
  it('shows only a name and title, with every section off', () => {
    expect(fallbackSite.profile.name).toBe('Pratik Bankar');
    expect(Object.values(fallbackSite.sections).every((on) => on === false)).toBe(true);
  });
});

describe('visibleSections', () => {
  it('hides sections that are switched off or have nothing to show', () => {
    const keys = visibleSections(published);
    expect(keys).toContain('about');
    expect(keys).toContain('contact');
    expect(keys).not.toContain('skills'); // on, but empty
    expect(keys).not.toContain('projects'); // off
  });

  it('hides the resume section when no resume is uploaded', () => {
    const site = { ...published, sections: { ...published.sections, resume: true } };
    expect(visibleSections(site)).not.toContain('resume');
    const withResume = { ...site, profile: { ...site.profile, resumeFileId: 'a'.repeat(24) } };
    expect(visibleSections(withResume)).toContain('resume');
  });
});

describe('formatRange', () => {
  it('formats a finished range', () => {
    expect(formatRange('2021-03', '2021-09')).toBe('Mar 2021 to Sep 2021');
  });
  it('shows Present for a current role', () => {
    expect(formatRange('2021-09', null)).toBe('Sep 2021 to Present');
  });
  it('returns the raw value for a malformed date rather than "Invalid Date"', () => {
    expect(formatRange('soon', null)).toBe('soon to Present');
  });
});
