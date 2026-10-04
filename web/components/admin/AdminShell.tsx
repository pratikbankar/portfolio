'use client';

import {
  Award, BadgeCheck, Briefcase, ExternalLink, Eye, FileText, FolderKanban, GraduationCap, Inbox,
  LayoutDashboard, Link2, LoaderCircle, LogOut, Menu, SlidersHorizontal, Sparkles, UserRound, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { api, ApiError, type Dashboard } from '@/lib/adminApi';
import { LoadError } from './ui';
import { ThemeToggle } from '../site/ThemeToggle';

interface Toast {
  id: number;
  kind: 'ok' | 'error';
  text: string;
}

interface AdminState {
  status: Dashboard | null;
  /** Reloads counts and the unpublished-changes flag. Call after every save. */
  refresh: () => Promise<void>;
  notify: (text: string, kind?: Toast['kind']) => void;
}

const AdminContext = createContext<AdminState | null>(null);

export function useAdmin(): AdminState {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used inside AdminShell');
  return ctx;
}

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/profile', label: 'Profile', icon: UserRound },
  { href: '/admin/skills', label: 'Skills', icon: Sparkles },
  { href: '/admin/experience', label: 'Experience', icon: Briefcase },
  { href: '/admin/projects', label: 'Projects', icon: FolderKanban },
  { href: '/admin/education', label: 'Education', icon: GraduationCap },
  { href: '/admin/certifications', label: 'Certifications', icon: BadgeCheck },
  { href: '/admin/awards', label: 'Awards', icon: Award },
  { href: '/admin/social-links', label: 'Social links', icon: Link2 },
  { href: '/admin/resume', label: 'Resume', icon: FileText },
  { href: '/admin/sections', label: 'Sections', icon: SlidersHorizontal },
  { href: '/admin/messages', label: 'Messages', icon: Inbox },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState<Dashboard | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const notify = useCallback<AdminState['notify']>((text, kind = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, kind, text }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 6000);
  }, []);

  const refresh = useCallback(async () => {
    try {
      setStatus(await api<Dashboard>('/admin/dashboard'));
    } catch {
      // A failed status refresh is not worth interrupting the admin; the next action retries it.
    }
  }, []);

  useEffect(() => {
    let alive = true;
    // A 401 here redirects to the login page (handled inside api()).
    api<{ email: string }>('/auth/me')
      .then((me) => {
        if (!alive) return;
        setEmail(me.email);
        return refresh();
      })
      .catch((err: unknown) => {
        // A 401 is already on its way to the login page; anything else needs a visible retry.
        if (alive && !(err instanceof ApiError && err.status === 401)) {
          setLoadError(err instanceof Error ? err.message : 'Could not load the admin panel');
        }
      });
    return () => {
      alive = false;
    };
  }, [refresh, attempt]);

  async function publish() {
    setPublishing(true);
    try {
      const result = await api<{ revalidated: boolean }>('/admin/publish', { method: 'POST' });
      notify(
        result.revalidated
          ? 'Published. The live site now shows your changes.'
          : 'Published. The live site will show your changes within 5 minutes.',
      );
      await refresh();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Publishing failed', 'error');
    } finally {
      setPublishing(false);
    }
  }

  async function logout() {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    router.replace('/admin/login');
  }

  if (!email && loadError) {
    return (
      <div className="grid flex-1 place-items-center px-4">
        <div className="w-full max-w-md">
          <LoadError
            message={loadError}
            onRetry={() => {
              setLoadError('');
              setAttempt((n) => n + 1);
            }}
          />
        </div>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="grid flex-1 place-items-center text-muted" role="status">
        <span className="inline-flex items-center gap-2"><LoaderCircle className="size-4 animate-spin" aria-hidden /> Loading the admin panel</span>
      </div>
    );
  }

  const dirty = status?.hasUnpublishedChanges ?? false;
  const isActive = (href: string) => (href === '/admin' ? pathname === href : pathname.startsWith(href));

  return (
    <AdminContext.Provider value={{ status, refresh, notify }}>
      <div className="flex min-h-screen flex-1 flex-col lg:flex-row">
        <aside className="border-b border-line bg-surface lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:overflow-y-auto lg:border-b-0 lg:border-r">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/admin" className="font-display text-lg font-semibold">Portfolio admin</Link>
            <button
              type="button"
              className="grid size-9 place-items-center rounded-lg border border-line lg:hidden"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-4" aria-hidden /> : <Menu className="size-4" aria-hidden />}
            </button>
          </div>
          <nav aria-label="Admin" className={`${menuOpen ? 'block' : 'hidden'} px-2 pb-3 lg:block`}>
            <ul className="space-y-0.5">
              {NAV.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(href) ? 'page' : undefined}
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-bg hover:text-ink aria-[current=page]:bg-accent-soft aria-[current=page]:font-medium aria-[current=page]:text-accent"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    <span className="flex-1">{label}</span>
                    {href === '/admin/messages' && (status?.unreadMessages ?? 0) > 0 && (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-accent-ink">{status?.unreadMessages}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 border-t border-line pt-3">
              <a href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted hover:bg-bg hover:text-ink">
                <ExternalLink className="size-4" aria-hidden /> View live site
              </a>
              <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted hover:bg-bg hover:text-ink">
                <LogOut className="size-4" aria-hidden /> Log out
              </button>
              <p className="truncate px-3 pt-2 text-xs text-muted" title={email}>{email}</p>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 py-2.5 backdrop-blur sm:px-8">
            <p className="flex items-center gap-2 text-sm" role="status">
              <span aria-hidden className={`size-2 rounded-full ${dirty ? 'bg-amber-500' : 'bg-accent'}`} />
              {status === null ? 'Checking status' : dirty ? 'You have unpublished changes' : 'Everything is published'}
            </p>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Link href="/admin/preview" className="btn btn-ghost !py-2"><Eye className="size-4" aria-hidden /> Preview</Link>
              <button type="button" className="btn btn-primary !py-2" onClick={publish} disabled={publishing || !dirty}>
                {publishing && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
                {publishing ? 'Publishing' : 'Publish'}
              </button>
            </div>
          </div>
          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-8">{children}</main>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
        {toasts.map((t) => (
          <p
            key={t.id}
            className={`pointer-events-auto max-w-md rounded-xl border px-4 py-3 text-sm shadow-lg ${
              t.kind === 'error' ? 'border-danger bg-surface text-danger' : 'border-line bg-ink text-bg'
            }`}
          >
            {t.text}
          </p>
        ))}
      </div>
    </AdminContext.Provider>
  );
}
