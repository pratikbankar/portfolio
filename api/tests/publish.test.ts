import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { loginAgent, startTestApp, type TestApp } from './helpers.js';

let t: TestApp;
let agent: Awaited<ReturnType<typeof loginAgent>>;
let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  t = await startTestApp();
});
afterAll(async () => {
  await t.stop();
});
beforeEach(async () => {
  await t.reset();
  agent = await loginAgent(t.app);
  fetchMock = vi.fn(async () => new Response('{}', { status: 200 }));
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const site = async () => (await request(t.app).get('/api/public/site')).body;
const addSkill = (name: string) => agent.post('/api/admin/skills').send({ name, category: 'Frontend' });
const dashboard = async () => (await agent.get('/api/admin/dashboard')).body;

describe('publish flow', () => {
  it('serves no content before the first publish', async () => {
    const res = await request(t.app).get('/api/public/site');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ content: null, publishedAt: null });
  });

  it('requires a session for preview, publish and dashboard', async () => {
    expect((await request(t.app).get('/api/admin/preview')).status).toBe(401);
    expect((await request(t.app).post('/api/admin/publish')).status).toBe(401);
    expect((await request(t.app).get('/api/admin/dashboard')).status).toBe(401);
  });

  it('publishes with every collection empty', async () => {
    const res = await agent.post('/api/admin/publish');
    expect(res.status).toBe(200);
    const body = await site();
    expect(body.content.skills).toEqual([]);
    expect(body.content.profile.name).toBe('');
    expect(typeof body.publishedAt).toBe('string');
  });

  it('makes draft content public only after publishing', async () => {
    await addSkill('React');
    await agent.post('/api/admin/publish');
    expect((await site()).content.skills.map((s: any) => s.name)).toEqual(['React']);

    await addSkill('Node.js');
    const preview = (await agent.get('/api/admin/preview')).body;
    expect(preview.skills.map((s: any) => s.name)).toEqual(['React', 'Node.js']);
    expect((await site()).content.skills.map((s: any) => s.name)).toEqual(['React']);

    await agent.post('/api/admin/publish');
    expect((await site()).content.skills.map((s: any) => s.name)).toEqual(['React', 'Node.js']);
  });

  it('tracks whether there are unpublished changes', async () => {
    expect((await dashboard()).hasUnpublishedChanges).toBe(true);
    await agent.post('/api/admin/publish');
    expect((await dashboard()).hasUnpublishedChanges).toBe(false);

    await addSkill('React');
    expect((await dashboard()).hasUnpublishedChanges).toBe(true);
    await agent.post('/api/admin/publish');
    expect((await dashboard()).hasUnpublishedChanges).toBe(false);

    await agent.put('/api/admin/sections').send({
      about: true, skills: false, experience: true, projects: true, education: true,
      certifications: true, awards: true, resume: true, contact: true,
    });
    expect((await dashboard()).hasUnpublishedChanges).toBe(true);
  });

  it('reports counts and the last publish time on the dashboard', async () => {
    await addSkill('React');
    await agent.post('/api/admin/projects').send({ title: 'Quattr' });
    await agent.post('/api/admin/publish');
    const d = await dashboard();
    expect(d.counts).toMatchObject({ skills: 1, projects: 1, experiences: 0 });
    expect(d.unreadMessages).toBe(0);
    expect(typeof d.publishedAt).toBe('string');
  });

  it('serves a published project by slug and hides unpublished ones', async () => {
    await agent.post('/api/admin/projects').send({ title: 'Quattr' });
    await agent.post('/api/admin/publish');
    await agent.post('/api/admin/projects').send({ title: 'Draft Only' });

    const ok = await request(t.app).get('/api/public/projects/quattr');
    expect(ok.status).toBe(200);
    expect(ok.body.title).toBe('Quattr');
    expect((await request(t.app).get('/api/public/projects/draft-only')).status).toBe(404);
    expect((await request(t.app).get('/api/public/projects/nope')).status).toBe(404);
  });

  it('does not expose the content of a disabled section', async () => {
    await agent.put('/api/admin/profile').send({ name: 'Pratik', about: 'Long story' });
    await agent.post('/api/admin/projects').send({ title: 'Quattr' });
    await agent.put('/api/admin/sections').send({
      about: false, skills: true, experience: true, projects: false, education: true,
      certifications: true, awards: true, resume: true, contact: true,
    });
    await agent.post('/api/admin/publish');

    const { content } = await site();
    expect(content.projects).toEqual([]);
    expect(content.profile.about).toBe('');
    expect(content.sections.projects).toBe(false);
    expect((await request(t.app).get('/api/public/projects/quattr')).status).toBe(404);
  });

  it('never includes internal fields in public content', async () => {
    await addSkill('React');
    await agent.post('/api/admin/publish');
    const json = JSON.stringify(await site());
    expect(json).not.toContain('passwordHash');
    expect(json).not.toContain('updatedAt');
  });

  it('asks the web app to revalidate with the shared secret', async () => {
    const res = await agent.post('/api/admin/publish');
    expect(res.body.revalidated).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:3000/internal/revalidate');
    expect(init.method).toBe('POST');
    expect(init.headers['x-revalidate-secret']).toBe('test-revalidate-secret');
  });

  it('still publishes when the web app cannot be reached', async () => {
    fetchMock.mockRejectedValue(new Error('connect ECONNREFUSED'));
    await addSkill('React');
    const res = await agent.post('/api/admin/publish');
    expect(res.status).toBe(200);
    expect(res.body.revalidated).toBe(false);
    expect((await site()).content.skills).toHaveLength(1);
  });

  it('reports revalidation as failed when the web app rejects the request', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 401 }));
    const res = await agent.post('/api/admin/publish');
    expect(res.status).toBe(200);
    expect(res.body.revalidated).toBe(false);
  });
});
