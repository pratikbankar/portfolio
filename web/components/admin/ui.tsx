import type { ReactNode } from 'react';

export const inputClass =
  'mt-1.5 w-full rounded-lg border border-line bg-bg px-3 py-2 text-ink placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-danger';

export function PageHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="card p-6 text-center" role="alert">
      <p className="text-danger">{message}</p>
      <button type="button" className="btn btn-ghost mt-4" onClick={onRetry}>Try again</button>
    </div>
  );
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return <p className="py-10 text-center text-muted" role="status">{label}</p>;
}
