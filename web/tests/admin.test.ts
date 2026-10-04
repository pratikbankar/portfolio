import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../lib/adminApi';
import { emptyValues, resources, toPayload, toValues } from '../lib/resources';

const assign = vi.fn();
const respond = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

beforeEach(() => {
  assign.mockClear();
  vi.stubGlobal('window', { location: { assign, pathname: '/admin/skills' } });
});
afterEach(() => vi.unstubAllGlobals());

describe('admin api client', () => {
  it('returns the parsed body on success', async () => {
    vi.stubGlobal('fetch', respond(200, [{ name: 'React' }]));
    expect(await api('/admin/skills')).toEqual([{ name: 'React' }]);
  });

  it('sends JSON with the session cookie', async () => {
    const fetchMock = respond(201, {});
    vi.stubGlobal('fetch', fetchMock);
    await api('/admin/skills', { method: 'POST', body: { name: 'React' } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/admin/skills');
    expect(init.credentials).toBe('same-origin');
    expect(init.body).toBe('{"name":"React"}');
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('sends the login page to an expired session instead of showing an empty screen', async () => {
    vi.stubGlobal('fetch', respond(401, { error: { code: 'unauthorized', message: 'Please log in' } }));
    await expect(api('/admin/skills')).rejects.toBeInstanceOf(ApiError);
    expect(assign).toHaveBeenCalledWith('/admin/login');
  });

  it('does not redirect when the login itself is rejected', async () => {
    vi.stubGlobal('window', { location: { assign, pathname: '/admin/login' } });
    vi.stubGlobal('fetch', respond(401, { error: { code: 'invalid_credentials', message: 'Incorrect email or password' } }));
    await expect(api('/auth/login', { method: 'POST', body: {} })).rejects.toThrow('Incorrect email or password');
    expect(assign).not.toHaveBeenCalled();
  });

  it('exposes the server message and field errors', async () => {
    vi.stubGlobal('fetch', respond(400, {
      error: { code: 'validation_error', message: 'Some fields are invalid', details: [{ path: 'name', message: 'Required' }] },
    }));
    const err = (await api('/admin/skills', { method: 'POST', body: {} }).catch((e: unknown) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe('Some fields are invalid');
    expect(err.fields).toEqual({ name: 'Required' });
  });

  it('explains the size limit when the host rejects an upload that is too large', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('Request Entity Too Large\n\nFUNCTION_PAYLOAD_TOO_LARGE', { status: 413 })));
    await expect(api('/admin/files', { method: 'POST', body: {} })).rejects.toThrow('Files must be 4 MB or smaller');
  });

  it('gives a readable error when the server is unreachable or answers with a non-JSON page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(api('/admin/skills')).rejects.toThrow(/could not reach the server/i);
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>502</html>', { status: 502 })));
    await expect(api('/admin/skills')).rejects.toThrow(/server error \(502\)/i);
  });
});

describe('resource form helpers', () => {
  const exp = resources.experience;

  it('starts a new item with empty values', () => {
    expect(emptyValues(exp.fields)).toMatchObject({ company: '', endDate: null, responsibilities: '' });
    expect(emptyValues(resources.projects.fields)).toMatchObject({ featured: false, imageFileIds: [] });
  });

  it('turns a stored item into form values and back without loss', () => {
    const item = {
      _id: 'x', order: 3, company: 'LTIMindtree', role: 'Engineer', location: 'Pune', startDate: '2021-09', endDate: null,
      responsibilities: ['One', 'Two'], achievements: [],
    };
    const values = toValues(exp.fields, item);
    expect(values.responsibilities).toBe('One\nTwo');
    const content: Record<string, unknown> = { ...item };
    delete content._id;
    delete content.order;
    expect(toPayload(exp.fields, values)).toEqual(content);
  });

  it('drops blank lines and internal fields from the payload', () => {
    const values = { ...emptyValues(exp.fields), company: ' A ', role: 'B', startDate: '2020-01', responsibilities: 'One\n\n  \nTwo\n' };
    const payload = toPayload(exp.fields, { ...values, _id: 'x', order: 1, updatedAt: 'y' });
    expect(payload.responsibilities).toEqual(['One', 'Two']);
    expect(payload.company).toBe('A');
    expect(payload).not.toHaveProperty('_id');
    expect(payload).not.toHaveProperty('order');
  });

  it('covers every managed collection', () => {
    expect(Object.keys(resources).sort()).toEqual(
      ['awards', 'certifications', 'education', 'experience', 'projects', 'skills', 'social-links'],
    );
  });
});
