import { timingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';

function authorized(given: string | null): boolean {
  const secret = process.env.REVALIDATE_SECRET ?? '';
  if (!secret || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Called by the API after a publish so the public pages show the new content straight away. */
export async function POST(request: Request) {
  if (!authorized(request.headers.get('x-revalidate-secret'))) {
    return Response.json({ error: { code: 'unauthorized', message: 'Invalid secret' } }, { status: 401 });
  }
  // expire: 0 makes the next visit wait for fresh content instead of seeing the old page once more.
  revalidateTag('site', { expire: 0 });
  return Response.json({ revalidated: true });
}
