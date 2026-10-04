import type { Metadata } from 'next';
import { GoogleAnalytics } from '@/components/site/GoogleAnalytics';
import { JsonLd } from '@/components/site/JsonLd';
import { SiteView } from '@/components/site/SiteView';
import { homeMetadata, personJsonLd } from '@/lib/seo';
import { getSite } from '@/lib/site';

// Regenerated at most every five minutes, and immediately when the admin publishes.
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return homeMetadata(await getSite());
}

export default async function HomePage() {
  const site = await getSite();
  return (
    <>
      <JsonLd data={personJsonLd(site)} />
      <SiteView content={site} />
      <GoogleAnalytics id={site.profile.gaMeasurementId} />
    </>
  );
}
