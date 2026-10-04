import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AdminUser, createAdminUser } from '../src/models/AdminUser.js';
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
  await createAdminUser(ADMIN.email, ADMIN.password);
});

const SECRET = 'test-secret-test-secret-test-secret';

describe('auth', () => {
  it('logs in with correct credentials and sets an httpOnly session cookie', async () => {
    const res = await request(t.app).post('/api/auth/login').send(ADMIN);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: ADMIN.email });
    const cookie = ([] as string[]).concat(res.headers['set-cookie'] ?? []).join(';');
    expect(cookie).toContain('pf_session=');
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
  });

  it('accepts the email in any letter case', async () => {
    const res = await request(t.app)
      .post('/api/auth/login')
      .send({ email: 'Admin@Example.COM', password: ADMIN.password });
    expect(res.status).toBe(200);
  });

  it('rejects a wrong password', async () => {
    const res = await request(t.app)
      .post('/api/auth/login')
      .send({ email: ADMIN.email, password: 'wrong-password-123' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_credentials');
  });

  it('rejects an unknown email with the same error as a wrong password', async () => {
    const res = await request(t.app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: ADMIN.password });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_credentials');
  });

  it('rejects a login body that is not strings', async () => {
    const res = await request(t.app)
      .post('/api/auth/login')
      .send({ email: { $ne: '' }, password: { $ne: '' } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('validation_error');
  });

  it('returns the current admin for a valid session', async () => {
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(ADMIN);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ email: ADMIN.email });
  });

  it('rejects /me without a cookie', async () => {
    const res = await request(t.app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('unauthorized');
  });

  it('rejects a cookie signed with another secret', async () => {
    const user = await AdminUser.findOne({ email: ADMIN.email });
    const forged = jwt.sign({ sub: String(user!._id) }, 'some-other-secret-some-other-secret');
    const res = await request(t.app).get('/api/auth/me').set('Cookie', `pf_session=${forged}`);
    expect(res.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const user = await AdminUser.findOne({ email: ADMIN.email });
    const expired = jwt.sign({ sub: String(user!._id) }, SECRET, { expiresIn: -10 });
    const res = await request(t.app).get('/api/auth/me').set('Cookie', `pf_session=${expired}`);
    expect(res.status).toBe(401);
  });

  it('rejects a valid token whose admin no longer exists', async () => {
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(ADMIN);
    await AdminUser.deleteMany({});
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('logout clears the session', async () => {
    const agent = request.agent(t.app);
    await agent.post('/api/auth/login').send(ADMIN);
    const out = await agent.post('/api/auth/logout');
    expect(out.status).toBe(200);
    const res = await agent.get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('stores a bcrypt hash, never the plain password', async () => {
    const user = await AdminUser.findOne({ email: ADMIN.email });
    expect(user!.passwordHash).not.toContain(ADMIN.password);
    expect(user!.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  it('limits each visitor separately behind the web proxy, so one person cannot lock the owner out', async () => {
    const attempt = (visitor: string) =>
      request(t.app)
        .post('/api/auth/login')
        .set('x-test-ratelimit', '1')
        .set('X-Forwarded-For', `${visitor}, 76.76.21.21`)
        .send({ email: ADMIN.email, password: 'wrong-password-123' });
    for (let i = 0; i < 5; i++) expect((await attempt('203.0.113.7')).status).toBe(401);
    expect((await attempt('203.0.113.7')).status).toBe(429);
    const owner = await request(t.app)
      .post('/api/auth/login')
      .set('x-test-ratelimit', '1')
      .set('X-Forwarded-For', '198.51.100.9, 76.76.21.21')
      .send(ADMIN);
    expect(owner.status).toBe(200);
  });

  it('rate limits repeated login attempts', async () => {
    const attempt = () =>
      request(t.app)
        .post('/api/auth/login')
        .set('x-test-ratelimit', '1')
        .send({ email: ADMIN.email, password: 'wrong-password-123' });
    for (let i = 0; i < 5; i++) expect((await attempt()).status).toBe(401);
    const sixth = await attempt();
    expect(sixth.status).toBe(429);
    expect(sixth.body.error.code).toBe('rate_limited');
  });
});
