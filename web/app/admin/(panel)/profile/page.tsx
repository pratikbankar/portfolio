'use client';

import { LoaderCircle } from 'lucide-react';
import { type FormEvent, useCallback, useEffect, useState } from 'react';
import { useAdmin } from '@/components/admin/AdminShell';
import { FieldRenderer } from '@/components/admin/FieldRenderer';
import { ImageUpload } from '@/components/admin/FileUpload';
import { LoadError, Loading, PageHeader } from '@/components/admin/ui';
import { api, ApiError } from '@/lib/adminApi';
import type { Field } from '@/lib/resources';
import type { Profile } from '@/lib/types';

const GROUPS: Array<{ title: string; fields: Field[] }> = [
  {
    title: 'Introduction',
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'jobTitle', label: 'Job title', type: 'text' },
      { name: 'tagline', label: 'Tagline', type: 'text', help: 'One line under your name in the hero.' },
      { name: 'summary', label: 'Short summary', type: 'textarea', help: 'Two or three sentences shown in the hero.' },
      { name: 'about', label: 'About me', type: 'textarea', help: 'Leave an empty line between paragraphs.' },
    ],
  },
  {
    title: 'Contact details',
    fields: [
      { name: 'location', label: 'Location', type: 'text' },
      { name: 'email', label: 'Public email', type: 'text', help: 'Shown in the contact section. Leave empty to hide it.' },
    ],
  },
  {
    title: 'Search and analytics',
    fields: [
      { name: 'seoTitle', label: 'Page title', type: 'text', help: 'Shown in the browser tab and search results. Defaults to your name and job title.' },
      { name: 'seoDescription', label: 'Search description', type: 'textarea', help: 'About 150 characters. Defaults to your short summary.' },
      { name: 'gaMeasurementId', label: 'Google Analytics ID', type: 'text', placeholder: 'G-XXXXXXXXXX', help: 'Optional. Leave empty to use only the built-in Vercel analytics.' },
    ],
  },
];

export default function ProfilePage() {
  const { refresh, notify } = useAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoadError('');
    return api<Profile>('/admin/profile')
      .then(setProfile)
      .catch((err: unknown) => setLoadError(err instanceof Error ? err.message : 'Could not load'));
  }, []);

  useEffect(() => {
    let alive = true;
    api<Profile>('/admin/profile')
      .then((p) => alive && setProfile(p))
      .catch((err: unknown) => alive && setLoadError(err instanceof Error ? err.message : 'Could not load'));
    return () => {
      alive = false;
    };
  }, []);

  if (loadError) return <LoadError message={loadError} onRetry={load} />;
  if (!profile) return <Loading />;

  const set = (name: string, value: unknown) => setProfile((p) => (p ? { ...p, [name]: value } : p));

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setErrors({});
    setFormError('');
    try {
      const body = Object.fromEntries(Object.entries(profile).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
      setProfile(await api<Profile>('/admin/profile', { method: 'PUT', body }));
      notify('Profile saved as a draft. Publish to make it live.');
      await refresh();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
      setFormError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} noValidate>
      <PageHeader title="Profile" description="Your name, introduction and the details search engines show." />

      <section className="card mb-6 p-6">
        <h2 className="font-display text-lg font-semibold">Profile photo</h2>
        <p className="mt-1 text-sm text-muted">Square photos work best. Without one, the site shows your initials.</p>
        <div className="max-w-xs">
          <ImageUpload value={profile.photoFileId ? [profile.photoFileId] : []} onChange={(ids) => set('photoFileId', ids[0] ?? '')} />
        </div>
      </section>

      {GROUPS.map((group) => (
        <section key={group.title} className="card mb-6 space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold">{group.title}</h2>
          {group.fields.map((field) => (
            <FieldRenderer
              key={field.name}
              field={field}
              value={profile[field.name as keyof Profile]}
              error={errors[field.name]}
              onChange={(v) => set(field.name, v)}
            />
          ))}
        </section>
      ))}

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur sm:-mx-8 sm:px-8">
        {formError && <p className="mr-auto text-sm text-danger" role="alert">{formError}</p>}
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {saving ? 'Saving' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}
