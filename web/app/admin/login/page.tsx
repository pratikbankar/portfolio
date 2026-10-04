'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type FormEvent, useEffect, useState } from 'react';
import { inputClass } from '@/components/admin/ui';
import { api } from '@/lib/adminApi';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Someone who is already logged in goes straight to the dashboard.
  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((res) => res.ok && router.replace('/admin'))
      .catch(() => undefined);
  }, [router]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true);
    setError('');
    try {
      await api('/auth/login', {
        method: 'POST',
        body: { email: String(data.get('email') ?? ''), password: String(data.get('password') ?? '') },
      });
      router.replace('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not log in');
      setBusy(false);
    }
  }

  return (
    <main className="grid flex-1 place-items-center px-4 py-16">
      <form onSubmit={onSubmit} className="card w-full max-w-sm p-8">
        <h1 className="font-display text-2xl font-semibold tracking-tight">Admin login</h1>
        <p className="mt-1.5 text-sm text-muted">Sign in to manage your portfolio.</p>
        <label className="mt-6 block text-sm font-medium">
          Email
          <input name="email" type="email" autoComplete="username" required className={inputClass} />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
        </label>
        {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary mt-6 w-full" disabled={busy}>
          {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
          {busy ? 'Signing in' : 'Sign in'}
        </button>
        {busy && <p className="mt-3 text-center text-xs text-muted">This can take up to a minute if the server was idle.</p>}
      </form>
    </main>
  );
}
