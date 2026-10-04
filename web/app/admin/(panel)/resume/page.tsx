'use client';

import { Download, Eye, FileText, LoaderCircle, Upload } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useAdmin } from '@/components/admin/AdminShell';
import { LoadError, Loading, PageHeader } from '@/components/admin/ui';
import { api, uploadFile } from '@/lib/adminApi';
import type { Profile } from '@/lib/types';

export default function ResumePage() {
  const { refresh, notify } = useAdmin();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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

  /** Saves the profile with a new resume file id ('' removes the resume). */
  async function setResume(resumeFileId: string, done: string) {
    // Reload first so a profile edit made in another tab is not overwritten.
    const latest = await api<Profile>('/admin/profile');
    setProfile(await api<Profile>('/admin/profile', { method: 'PUT', body: { ...latest, resumeFileId } }));
    notify(done);
    await refresh();
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const uploaded = await uploadFile(file);
      if (uploaded.contentType !== 'application/pdf') throw new Error('Please upload the resume as a PDF.');
      await setResume(uploaded.id, 'Resume uploaded as a draft. Publish to make it live.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError('');
    try {
      await setResume('', 'Resume removed from the draft. Publish to remove it from the live site.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the resume');
    } finally {
      setBusy(false);
    }
  }

  const id = profile.resumeFileId;
  return (
    <>
      <PageHeader title="Resume" description="Visitors can view and download this PDF. Uploading a new file replaces the current one." />
      <div className="card p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent"><FileText className="size-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">{id ? 'A resume is uploaded' : 'No resume uploaded'}</p>
            <p className="text-sm text-muted">
              {id ? 'It appears in the hero and the Resume section once published.' : 'The Resume section and the download button stay hidden until you upload one.'}
            </p>
          </div>
          {id && (
            <div className="flex gap-2">
              <a href={`/api/files/${id}`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><Eye className="size-4" aria-hidden /> View</a>
              <a href={`/api/files/${id}?download=1`} className="btn btn-ghost"><Download className="size-4" aria-hidden /> Download</a>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <label className={`btn btn-primary ${busy ? 'pointer-events-none opacity-60' : ''}`}>
            {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
            {busy ? 'Working' : id ? 'Replace resume' : 'Upload resume'}
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                void onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {id && <button type="button" className="btn btn-ghost" disabled={busy} onClick={remove}>Remove resume</button>}
          <p className="text-sm text-muted">PDF, up to 4 MB.</p>
        </div>
        {error && <p className="mt-3 text-sm text-danger" role="alert">{error}</p>}
      </div>
    </>
  );
}
