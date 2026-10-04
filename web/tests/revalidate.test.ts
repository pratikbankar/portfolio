import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const revalidateTag = vi.fn();
vi.mock('next/cache', () => ({ revalidateTag }));

const call = async (secret?: string) => {
  const { POST } = await import('../app/internal/revalidate/route');
  return POST(new Request('http://localhost/internal/revalidate', {
    method: 'POST',
    headers: secret === undefined ? {} : { 'x-revalidate-secret': secret },
  }));
};

beforeEach(() => {
  revalidateTag.mockClear();
  vi.stubEnv('REVALIDATE_SECRET', 'a-long-shared-secret');
});
afterEach(() => vi.unstubAllEnvs());

describe('POST /internal/revalidate', () => {
  it('refreshes the site content when the secret matches', async () => {
    const res = await call('a-long-shared-secret');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ revalidated: true });
    expect(revalidateTag).toHaveBeenCalledWith('site', { expire: 0 });
  });

  it('rejects a missing secret', async () => {
    expect((await call()).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret', async () => {
    expect((await call('wrong')).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it('rejects every request when no secret is configured', async () => {
    vi.stubEnv('REVALIDATE_SECRET', '');
    expect((await call('')).status).toBe(401);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});
