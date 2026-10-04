import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { loginAgent, startTestApp, type TestApp } from './helpers.js';

let t: TestApp;
let agent: Awaited<ReturnType<typeof loginAgent>>;

beforeAll(async () => {
  t = await startTestApp();
});
afterAll(async () => {
  await t.stop();
});
beforeEach(async () => {
  await t.reset();
  agent = await loginAgent(t.app);
});

const skill = (name: string, category = 'Frontend') => ({ name, category });
const experience = {
  company: 'LTIMindtree',
  role: 'Senior Product Engineer',
  location: 'Pune, India',
  startDate: '2021-09',
  endDate: null,
  responsibilities: ['Built React apps'],
  achievements: [],
};
const project = { title: 'Quattr', description: 'SEO platform', technologies: ['React'] };

describe('admin routes require a session', () => {
  const routes: Array<[string, string]> = [
    ['get', '/api/admin/skills'],
    ['post', '/api/admin/skills'],
    ['put', '/api/admin/skills/reorder'],
    ['put', '/api/admin/skills/64b7f0c2a1b2c3d4e5f60718'],
    ['delete', '/api/admin/skills/64b7f0c2a1b2c3d4e5f60718'],
    ['get', '/api/admin/experiences'],
    ['get', '/api/admin/projects'],
    ['get', '/api/admin/education'],
    ['get', '/api/admin/certifications'],
    ['get', '/api/admin/awards'],
    ['get', '/api/admin/social-links'],
    ['get', '/api/admin/profile'],
    ['put', '/api/admin/profile'],
    ['get', '/api/admin/sections'],
    ['put', '/api/admin/sections'],
  ];
  it.each(routes)('%s %s returns 401 without a cookie', async (method, path) => {
    const res = await (request(t.app) as any)[method](path).send({});
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });
});

describe('skills CRUD', () => {
  it('creates, lists in order, updates and deletes', async () => {
    const a = await agent.post('/api/admin/skills').send(skill('React.js'));
    const b = await agent.post('/api/admin/skills').send(skill('TypeScript'));
    expect(a.status).toBe(201);
    expect(a.body.order).toBe(0);
    expect(b.body.order).toBe(1);

    const list = await agent.get('/api/admin/skills');
    expect(list.body.map((s: any) => s.name)).toEqual(['React.js', 'TypeScript']);

    const upd = await agent.put(`/api/admin/skills/${a.body._id}`).send(skill('React', 'UI'));
    expect(upd.status).toBe(200);
    expect(upd.body).toMatchObject({ name: 'React', category: 'UI', order: 0 });

    const del = await agent.delete(`/api/admin/skills/${a.body._id}`);
    expect(del.status).toBe(200);
    const after = await agent.get('/api/admin/skills');
    expect(after.body.map((s: any) => s.name)).toEqual(['TypeScript']);
  });

  it('rejects an invalid body with field details', async () => {
    const res = await agent.post('/api/admin/skills').send({ name: '', category: 'Frontend' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
    expect(res.body.error.details[0].path).toBe('name');
  });

  it('rejects unknown fields instead of storing them', async () => {
    const res = await agent.post('/api/admin/skills').send({ ...skill('React'), isAdmin: true });
    expect(res.status).toBe(400);
  });

  it('returns 400 for a malformed id and 404 for an unknown id', async () => {
    const bad = await agent.put('/api/admin/skills/not-an-id').send(skill('X'));
    expect(bad.status).toBe(400);
    expect(bad.body.error.code).toBe('invalid_id');
    const missing = await agent.put('/api/admin/skills/64b7f0c2a1b2c3d4e5f60718').send(skill('X'));
    expect(missing.status).toBe(404);
    const missingDel = await agent.delete('/api/admin/skills/64b7f0c2a1b2c3d4e5f60718');
    expect(missingDel.status).toBe(404);
  });
});

describe('reorder', () => {
  async function three() {
    const ids: string[] = [];
    for (const n of ['A', 'B', 'C']) ids.push((await agent.post('/api/admin/skills').send(skill(n))).body._id);
    return ids;
  }
  const names = async () => (await agent.get('/api/admin/skills')).body.map((s: any) => s.name);

  it('applies a full new order', async () => {
    const [a, b, c] = await three();
    const res = await agent.put('/api/admin/skills/reorder').send({ ids: [c, a, b] });
    expect(res.status).toBe(200);
    expect(await names()).toEqual(['C', 'A', 'B']);
  });

  it('rejects a missing id and leaves the order unchanged', async () => {
    const [a, b] = await three();
    const res = await agent.put('/api/admin/skills/reorder').send({ ids: [b, a] });
    expect(res.status).toBe(400);
    expect(await names()).toEqual(['A', 'B', 'C']);
  });

  it('rejects a duplicate id', async () => {
    const [a, b] = await three();
    const res = await agent.put('/api/admin/skills/reorder').send({ ids: [a, a, b] });
    expect(res.status).toBe(400);
    expect(await names()).toEqual(['A', 'B', 'C']);
  });

  it('rejects an unknown id', async () => {
    const [a, b] = await three();
    const res = await agent
      .put('/api/admin/skills/reorder')
      .send({ ids: [a, b, '64b7f0c2a1b2c3d4e5f60718'] });
    expect(res.status).toBe(400);
    expect(await names()).toEqual(['A', 'B', 'C']);
  });
});

describe('experiences', () => {
  it('accepts a current role with no end date', async () => {
    const res = await agent.post('/api/admin/experiences').send(experience);
    expect(res.status).toBe(201);
    expect(res.body.endDate).toBeNull();
  });

  it('rejects an end date before the start date', async () => {
    const res = await agent.post('/api/admin/experiences').send({ ...experience, endDate: '2020-01' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('endDate');
  });

  it('rejects a malformed date', async () => {
    const res = await agent.post('/api/admin/experiences').send({ ...experience, startDate: 'Sep 2021' });
    expect(res.status).toBe(400);
  });
});

describe('projects', () => {
  it('generates a slug from the title', async () => {
    const res = await agent.post('/api/admin/projects').send(project);
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('quattr');
  });

  it('gives a second project with the same title a unique slug', async () => {
    await agent.post('/api/admin/projects').send(project);
    const res = await agent.post('/api/admin/projects').send(project);
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('quattr-2');
  });

  it('keeps the slug when the title is edited', async () => {
    const created = await agent.post('/api/admin/projects').send(project);
    const res = await agent.put(`/api/admin/projects/${created.body._id}`).send({ ...project, title: 'Quattr Platform' });
    expect(res.body.slug).toBe('quattr');
    expect(res.body.title).toBe('Quattr Platform');
  });

  it('falls back to a usable slug when the title has no latin characters', async () => {
    const res = await agent.post('/api/admin/projects').send({ ...project, title: '日本語' });
    expect(res.status).toBe(201);
    expect(res.body.slug).toBe('project');
  });

  it('rejects a non-http link', async () => {
    const res = await agent.post('/api/admin/projects').send({ ...project, githubUrl: 'javascript:alert(1)' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('githubUrl');
  });

  it('accepts empty optional links', async () => {
    const res = await agent.post('/api/admin/projects').send({ ...project, githubUrl: '', liveUrl: '' });
    expect(res.status).toBe(201);
  });
});

describe('other collections', () => {
  it('stores education, certifications, awards and social links', async () => {
    const edu = await agent.post('/api/admin/education').send({
      degree: 'B.Tech', field: 'Computer Science', institution: 'Department of Technology',
      location: 'Kolhapur', startDate: '2011-07', endDate: '2014-07',
    });
    const cert = await agent.post('/api/admin/certifications').send({ name: 'AWS Certification', status: 'in-progress' });
    const award = await agent.post('/api/admin/awards').send({ title: 'Hi-Five Award', issuer: 'LTIMindtree' });
    const link = await agent.post('/api/admin/social-links').send({ platform: 'LinkedIn', url: 'https://linkedin.com/in/x' });
    const mail = await agent.post('/api/admin/social-links').send({ platform: 'Email', url: 'mailto:a@b.co' });
    expect([edu.status, cert.status, award.status, link.status, mail.status]).toEqual([201, 201, 201, 201, 201]);
    expect(cert.body.status).toBe('in-progress');
  });

  it('rejects an unknown certification status', async () => {
    const res = await agent.post('/api/admin/certifications').send({ name: 'X', status: 'maybe' });
    expect(res.status).toBe(400);
  });
});

describe('profile and sections', () => {
  it('returns defaults before anything is saved', async () => {
    const profile = await agent.get('/api/admin/profile');
    expect(profile.status).toBe(200);
    expect(profile.body.name).toBe('');
    const sections = await agent.get('/api/admin/sections');
    expect(sections.body).toEqual({
      about: true, skills: true, experience: true, projects: true, education: true,
      certifications: true, awards: true, resume: true, contact: true,
    });
  });

  it('round trips the profile', async () => {
    const body = { name: 'Pratik Bankar', jobTitle: 'Senior Full Stack Engineer', summary: 'Hello' };
    const put = await agent.put('/api/admin/profile').send(body);
    expect(put.status).toBe(200);
    const get = await agent.get('/api/admin/profile');
    expect(get.body).toMatchObject(body);
    expect(get.body).not.toHaveProperty('_id');
  });

  it('rejects fields that must never be stored, such as phone', async () => {
    const res = await agent.put('/api/admin/profile').send({ name: 'Pratik', phone: '+91 0000000000' });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed analytics id', async () => {
    const res = await agent.put('/api/admin/profile').send({ name: 'Pratik', gaMeasurementId: '<script>' });
    expect(res.status).toBe(400);
  });

  it('round trips section toggles', async () => {
    const all = {
      about: true, skills: true, experience: true, projects: false, education: true,
      certifications: true, awards: true, resume: false, contact: true,
    };
    const put = await agent.put('/api/admin/sections').send(all);
    expect(put.status).toBe(200);
    expect((await agent.get('/api/admin/sections')).body).toEqual(all);
  });

  it('rejects a non-boolean toggle', async () => {
    const res = await agent.put('/api/admin/sections').send({ about: 'yes' });
    expect(res.status).toBe(400);
  });
});
