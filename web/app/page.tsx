import { SiteView } from '@/components/site/SiteView';
import { getSite } from '@/lib/site';

// Regenerated at most every five minutes, and immediately when the admin publishes.
export const revalidate = 300;

export default async function HomePage() {
  return <SiteView content={await getSite()} />;
}
