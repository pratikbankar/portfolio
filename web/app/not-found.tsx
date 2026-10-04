import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="container-page grid flex-1 place-items-center py-24 text-center">
      <div>
        <p className="eyebrow">404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted">The page you are looking for does not exist or has been moved.</p>
        <Link href="/" className="btn btn-primary mt-8">Back to home</Link>
      </div>
    </main>
  );
}
