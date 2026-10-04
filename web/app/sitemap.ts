import type { MetadataRoute } from 'next';
import { getSite, SITE_URL, visibleSections } from '@/lib/site';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = await getSite();
  const projects = visibleSections(site).includes('projects') ? site.projects : [];
  return [
    { url: `${SITE_URL}/`, changeFrequency: 'monthly', priority: 1 },
    ...projects.map((p) => ({ url: `${SITE_URL}/projects/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
  ];
}
