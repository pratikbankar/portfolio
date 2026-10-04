import { notFound } from 'next/navigation';
import { ResourceEditor } from '@/components/admin/ResourceEditor';
import { resources } from '@/lib/resources';

// Only the collections listed in lib/resources exist; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(resources).map((resource) => ({ resource }));
}

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!Object.hasOwn(resources, resource)) notFound();
  // Keyed so switching between collections starts from a clean editor.
  return <ResourceEditor key={resource} slug={resource} />;
}
