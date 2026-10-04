import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ContactMessage } from '../src/models/ContactMessage.js';
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

const valid = {
  name: 'Asha Rao',
  email: 'asha@example.com',
  subject: 'Role at Acme',
  message: 'Hello Pratik, we would like to talk about a role.',
  extra_notes: '',
  elapsedMs: 9000,
};
const send = (body: object) => request(t.app).post('/api/contact').send(body);
const stored = () => ContactMessage.countDocuments();

describe('contact form', () => {
  it('stores a valid message and lists it for the admin, newest first', async () => {
    expect((await send(valid)).status).toBe(200);
    await send({ ...valid, name: 'Second Sender' });
    const list = await agent.get('/api/admin/messages');
    expect(list.status).toBe(200);
    expect(list.body.map((m: any) => m.name)).toEqual(['Second Sender', 'Asha Rao']);
    expect(list.body[1]).toMatchObject({ email: 'asha@example.com', subject: 'Role at Acme', read: false });
  });

  it('never stores or returns the sender IP address', async () => {
    await send(valid);
    const [msg] = (await agent.get('/api/admin/messages')).body;
    expect(JSON.stringify(msg)).not.toMatch(/127\.0\.0\.1|::1|ipHash/);
    const doc = await ContactMessage.findOne().lean();
    expect(doc!.ipHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects an invalid email', async () => {
    const res = await send({ ...valid, email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.error.details[0].path).toBe('email');
    expect(await stored()).toBe(0);
  });

  it('rejects a message that is too short or too long', async () => {
    expect((await send({ ...valid, message: 'hi' })).status).toBe(400);
    expect((await send({ ...valid, message: 'x'.repeat(5001) })).status).toBe(400);
    expect(await stored()).toBe(0);
  });

  it('accepts a message without a subject', async () => {
    const { subject: _s, ...noSubject } = valid;
    expect((await send(noSubject)).status).toBe(200);
    expect(await stored()).toBe(1);
  });

  it('silently drops a submission that fills the honeypot', async () => {
    const res = await send({ ...valid, extra_notes: 'http://spam.example' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(await stored()).toBe(0);
  });

  it('silently drops a submission sent faster than a person could type', async () => {
    expect((await send({ ...valid, elapsedMs: 800 })).status).toBe(200);
    const { elapsedMs: _e, ...noTiming } = valid;
    expect((await send(noTiming)).status).toBe(200);
    expect(await stored()).toBe(0);
  });

  it('stores HTML as plain text without altering it', async () => {
    const message = '<script>alert(1)</script> <b>hello</b> there';
    await send({ ...valid, message });
    const [msg] = (await agent.get('/api/admin/messages')).body;
    expect(msg.message).toBe(message);
  });

  it('rejects non-string fields', async () => {
    const res = await send({ ...valid, name: { $gt: '' } });
    expect(res.status).toBe(400);
  });

  it('rate limits repeated submissions', async () => {
    const limited = () => send(valid).set('x-test-ratelimit', '1');
    for (let i = 0; i < 5; i++) expect((await limited()).status).toBe(200);
    const sixth = await limited();
    expect(sixth.status).toBe(429);
    expect(await stored()).toBe(5);
  });
});

describe('contact rate limit behind the web proxy', () => {
  // The web app proxies requests, so the API sees "visitor, proxy" in X-Forwarded-For.
  const from = (visitor: string) =>
    send(valid).set('x-test-ratelimit', '1').set('X-Forwarded-For', `${visitor}, 76.76.21.21`);

  it('counts each visitor separately even though they share the proxy address', async () => {
    for (let i = 0; i < 5; i++) expect((await from('203.0.113.7')).status).toBe(200);
    expect((await from('203.0.113.7')).status).toBe(429);
    expect((await from('198.51.100.9')).status).toBe(200);
  });
});

describe('contact rate limit for direct callers', () => {
  it('caps a caller who forges a new visitor address on every request', async () => {
    const forged = (n: number) =>
      send(valid).set('x-test-ratelimit', '1').set('X-Forwarded-For', `10.0.${Math.floor(n / 250)}.${n % 250}, 192.0.2.50`);
    for (let i = 0; i < 60; i++) expect((await forged(i)).status).toBe(200);
    expect((await forged(60)).status).toBe(429);
  });
});

describe('admin messages', () => {
  it('requires a session', async () => {
    expect((await request(t.app).get('/api/admin/messages')).status).toBe(401);
  });

  it('marks a message read and counts unread on the dashboard', async () => {
    await send(valid);
    await send(valid);
    const [first] = (await agent.get('/api/admin/messages')).body;
    expect((await agent.get('/api/admin/dashboard')).body.unreadMessages).toBe(2);

    const res = await agent.patch(`/api/admin/messages/${first._id}`).send({ read: true });
    expect(res.status).toBe(200);
    expect(res.body.read).toBe(true);
    expect((await agent.get('/api/admin/dashboard')).body.unreadMessages).toBe(1);
  });

  it('deletes a message', async () => {
    await send(valid);
    const [msg] = (await agent.get('/api/admin/messages')).body;
    expect((await agent.delete(`/api/admin/messages/${msg._id}`)).status).toBe(200);
    expect(await stored()).toBe(0);
    expect((await agent.delete(`/api/admin/messages/${msg._id}`)).status).toBe(404);
  });

  it('does not let a message be edited through the read flag endpoint', async () => {
    await send(valid);
    const [msg] = (await agent.get('/api/admin/messages')).body;
    const res = await agent.patch(`/api/admin/messages/${msg._id}`).send({ read: true, message: 'changed' });
    expect(res.status).toBe(400);
  });
});
