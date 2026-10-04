'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '@/components/admin/AdminShell';
import { LoadError, Loading, PageHeader } from '@/components/admin/ui';
import { api } from '@/lib/adminApi';
import { SECTION_LABELS } from '@/lib/site';
import { SECTION_KEYS, type SectionKey } from '@/lib/types';

type Sections = Record<SectionKey, boolean>;

export default function SectionsPage() {
  const { refresh, notify } = useAdmin();
  const [sections, setSections] = useState<Sections | null>(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState<SectionKey | null>(null);

  const load = useCallback(() => {
    setLoadError('');
    return api<Sections>('/admin/sections')
      .then(setSections)
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'Could not load'));
  }, []);

  useEffect(() => {
    let alive = true;
    api<Sections>('/admin/sections')
      .then((s) => alive && setSections(s))
      .catch((err: unknown) => alive && setLoadError(err instanceof Error ? err.message : 'Could not load'));
    return () => {
      alive = false;
    };
  }, []);

  if (loadError) return <LoadError message={loadError} onRetry={load} />;
  if (!sections) return <Loading />;

  async function toggle(key: SectionKey) {
    if (!sections) return;
    const next = { ...sections, [key]: !sections[key] };
    setSaving(key);
    setSections(next);
    try {
      setSections(await api<Sections>('/admin/sections', { method: 'PUT', body: next }));
      await refresh();
    } catch (err) {
      setSections(sections); // put the switch back
      notify(err instanceof Error ? err.message : 'Could not save', 'error');
    } finally {
      setSaving(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Sections"
        description="Switch whole sections of the site on or off. A section with no content stays hidden even when it is on. The hero is always shown."
      />
      <ul className="card divide-y divide-line">
        {SECTION_KEYS.map((key) => (
          <li key={key} className="flex items-center justify-between gap-4 px-5 py-4">
            <span id={`section-${key}`} className="font-medium">{SECTION_LABELS[key]}</span>
            <button
              type="button"
              role="switch"
              aria-checked={sections[key]}
              aria-labelledby={`section-${key}`}
              disabled={saving !== null}
              onClick={() => toggle(key)}
              className="relative h-7 w-12 shrink-0 rounded-full bg-line transition-colors aria-checked:bg-accent disabled:opacity-60"
            >
              <span className={`absolute left-1 top-1 size-5 rounded-full bg-white shadow transition-transform ${sections[key] ? 'translate-x-5' : ''}`} />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
