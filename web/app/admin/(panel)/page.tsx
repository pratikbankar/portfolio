'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useAdmin } from '@/components/admin/AdminShell';
import { Loading, PageHeader } from '@/components/admin/ui';

const CARDS = [
  { key: 'skills', label: 'Skills', href: '/admin/skills' },
  { key: 'experiences', label: 'Roles', href: '/admin/experience' },
  { key: 'projects', label: 'Projects', href: '/admin/projects' },
  { key: 'education', label: 'Education', href: '/admin/education' },
  { key: 'certifications', label: 'Certifications', href: '/admin/certifications' },
  { key: 'awards', label: 'Awards', href: '/admin/awards' },
  { key: 'socialLinks', label: 'Social links', href: '/admin/social-links' },
];

export default function DashboardPage() {
  const { status, refresh } = useAdmin();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (!status) return <Loading />;
  const published = status.publishedAt
    ? new Date(status.publishedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <>
      <PageHeader title="Dashboard" description="Edits are saved as a draft. Preview them, then publish to update the live site." />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Site status</p>
          <p className="mt-2 text-lg font-medium">
            {status.hasUnpublishedChanges ? 'Unpublished changes are waiting' : 'The live site is up to date'}
          </p>
          <p className="mt-1 text-sm text-muted">{published ? `Last published ${published}` : 'Nothing has been published yet'}</p>
          <Link href="/admin/preview" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">Preview the draft</Link>
        </div>
        <div className="card p-5">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">Messages</p>
          <p className="mt-2 text-lg font-medium">
            {status.unreadMessages === 0 ? 'No unread messages' : `${status.unreadMessages} unread ${status.unreadMessages === 1 ? 'message' : 'messages'}`}
          </p>
          <p className="mt-1 text-sm text-muted">Sent through the contact form on your site.</p>
          <Link href="/admin/messages" className="mt-4 inline-block text-sm font-medium text-accent hover:underline">Open messages</Link>
        </div>
      </div>

      <h2 className="mb-3 mt-10 font-display text-lg font-semibold">Content</h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CARDS.map((card) => (
          <li key={card.key}>
            <Link href={card.href} className="card block p-4 transition-colors hover:border-accent">
              <p className="font-display text-3xl font-semibold">{status.counts[card.key] ?? 0}</p>
              <p className="mt-1 text-sm text-muted">{card.label}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
