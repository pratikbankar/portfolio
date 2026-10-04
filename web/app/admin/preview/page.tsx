'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { LoadError, Loading } from '@/components/admin/ui';
import { SiteView } from '@/components/site/SiteView';
import { api } from '@/lib/adminApi';
import { normalizeSite } from '@/lib/site';
import type { SiteContent } from '@/lib/types';

/** Shows the draft exactly as the public page would render it, before anything is published. */
export default function PreviewPage() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setError('');
    return api<Partial<SiteContent>>('/admin/preview')
      .then((draft) => setContent(normalizeSite(draft)))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Could not load the preview'));
  }, []);

  useEffect(() => {
    let alive = true;
    api<Partial<SiteContent>>('/admin/preview')
      .then((draft) => alive && setContent(normalizeSite(draft)))
      .catch((err: unknown) => alive && setError(err instanceof Error ? err.message : 'Could not load the preview'));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-4 py-2.5 text-sm text-bg">
        <p><strong>Preview.</strong> This is your draft, including unpublished changes. Visitors do not see it yet.</p>
        <Link href="/admin" className="inline-flex items-center gap-1.5 font-medium underline">
          <ArrowLeft className="size-4" aria-hidden /> Back to admin
        </Link>
      </div>
      {error ? (
        <div className="container-page py-10"><LoadError message={error} onRetry={load} /></div>
      ) : content ? (
        <SiteView content={content} preview />
      ) : (
        <Loading label="Loading the preview" />
      )}
    </>
  );
}
