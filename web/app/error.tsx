'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="container-page grid flex-1 place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">Temporarily unavailable</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">This page could not be loaded</h1>
        <p className="mt-3 text-muted">The server may be waking up. Please try again in a moment.</p>
        <button type="button" onClick={reset} className="btn btn-primary mt-8">Try again</button>
      </div>
    </main>
  );
}
