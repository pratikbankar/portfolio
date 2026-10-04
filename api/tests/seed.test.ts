import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { seed } from '../src/seed/run.js';
import { ADMIN, startTestApp, type TestApp } from './helpers.js';

let t: TestApp;

beforeAll(async () => {
  t = await startTestApp();
});
afterAll(async () => {
  await t.stop();
});
beforeEach(async () => {
  await t.reset();
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const site = async () => (await request(t.app).get('/api/public/site')).body.content;

describe('seed', () => {
  it('publishes the resume content', async () => {
    await seed();
    const c = await site();
    expect(c.profile.name).toBe('Pratik Bankar');
    expect(c.profile.jobTitle).toBe('Senior Full Stack Engineer');
    expect(c.experiences.map((e: any) => e.company)).toEqual([
      'LTIMindtree', 'Cuelogic Technologies', 'Policy Planner Web Agg Pvt. Ltd', 'Pocket InfoTech',
    ]);
    expect(c.experiences[0].endDate).toBeNull();
    expect(c.education).toHaveLength(3);
    expect(c.certifications).toHaveLength(4);
    expect(c.certifications.filter((x: any) => x.status === 'in-progress')).toHaveLength(2);
    expect(c.awards.map((a: any) => a.title)).toEqual(['Hi-Five Award', 'Super Crew Award']);
    expect(c.projects).toHaveLength(1);
    expect(c.projects[0]).toMatchObject({ slug: 'quattr', role: 'Senior Product Engineer' });
    expect(c.projects[0].highlights).toHaveLength(4);
    expect(new Set(c.skills.map((s: any) => s.category)).size).toBe(7);
    expect(c.socialLinks.map((l: any) => l.platform)).toEqual(['LinkedIn', 'GitHub', 'Email']);
  });

  it('publishes the profile photo', async () => {
    await seed();
    const { photoFileId } = (await site()).profile;
    expect(photoFileId).toMatch(/^[a-f0-9]{24}$/);
    const res = await request(t.app).get(`/api/files/${photoFileId}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
  });

  it('never publishes the phone number or date of birth', async () => {
    await seed();
    const json = JSON.stringify(await site());
    expect(json).not.toContain('8208966949');
    expect(json).not.toMatch(/1993|15th May|Date of Birth/i);
  });

  it('contains no em-dashes', async () => {
    await seed();
    expect(JSON.stringify(await site())).not.toContain('—');
  });

  it('creates an admin who can log in', async () => {
    await seed();
    const res = await request(t.app).post('/api/auth/login').send(ADMIN);
    expect(res.status).toBe(200);
  });

  it('does not duplicate or overwrite content when run again', async () => {
    await seed();
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(ADMIN);
    await agent.put('/api/admin/profile').send({ name: 'Edited Name' });

    await seed();
    // The edit is an unpublished draft, so it is checked through the admin preview.
    const draft = (await agent.get('/api/admin/preview')).body;
    expect(draft.profile.name).toBe('Edited Name');
    expect(draft.experiences).toHaveLength(4);
    expect(draft.projects).toHaveLength(1);
    expect(draft.skills).toHaveLength((await site()).skills.length);
  });

  it('restores the resume content when reset is requested', async () => {
    await seed();
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(ADMIN);
    await agent.put('/api/admin/profile').send({ name: 'Edited Name' });

    await seed({ reset: true });
    const c = await site();
    expect(c.profile.name).toBe('Pratik Bankar');
    expect(c.experiences).toHaveLength(4);
  });
});
