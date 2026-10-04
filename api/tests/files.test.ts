import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
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
afterEach(() => {
  vi.unstubAllGlobals();
});

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const png = (size = 64) => Buffer.concat([PNG_HEADER, Buffer.alloc(size, 7)]);
const pdf = (size = 64) => Buffer.concat([Buffer.from('%PDF-1.4\n'), Buffer.alloc(size, 32)]);
const MB = 1024 * 1024;

const upload = (buf: Buffer, filename: string, contentType: string) =>
  agent.post('/api/admin/files').attach('file', buf, { filename, contentType });

const binary = (path: string) =>
  request(t.app)
    .get(path)
    .buffer(true)
    .parse((res, cb) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => cb(null, Buffer.concat(chunks)));
    });

describe('file uploads', () => {
  it('stores an image and serves the same bytes publicly with long caching', async () => {
    const body = png();
    const up = await upload(body, 'shot.png', 'image/png');
    expect(up.status).toBe(201);
    expect(up.body).toMatchObject({ contentType: 'image/png', filename: 'shot.png' });

    const res = await binary(`/api/files/${up.body.id}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/png');
    expect(res.headers['cache-control']).toContain('immutable');
    expect(Buffer.compare(res.body, body)).toBe(0);
  });

  it('serves a PDF inline with its filename, and as a download when asked', async () => {
    const up = await upload(pdf(), 'Pratik Bankar Resume.pdf', 'application/pdf');
    expect(up.status).toBe(201);
    const inline = await binary(`/api/files/${up.body.id}`);
    expect(inline.headers['content-type']).toBe('application/pdf');
    expect(inline.headers['content-disposition']).toMatch(/^inline; filename="Pratik Bankar Resume.pdf"/);
    const dl = await binary(`/api/files/${up.body.id}?download=1`);
    expect(dl.headers['content-disposition']).toMatch(/^attachment;/);
  });

  it('decides the type from the file bytes, not the declared type', async () => {
    const res = await upload(Buffer.from('<html><script>alert(1)</script></html>'), 'x.png', 'image/png');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('unsupported_file_type');
  });

  it('rejects unsupported file types', async () => {
    const res = await upload(Buffer.from('MZ\x90\x00binary'), 'tool.exe', 'application/octet-stream');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('unsupported_file_type');
  });

  it('rejects an image over 5 MB', async () => {
    const res = await upload(png(5 * MB + 10), 'big.png', 'image/png');
    expect(res.status).toBe(413);
  });

  it('accepts a PDF between 5 and 10 MB and rejects one over 10 MB', async () => {
    expect((await upload(pdf(6 * MB), 'ok.pdf', 'application/pdf')).status).toBe(201);
    expect((await upload(pdf(10 * MB + 10), 'big.pdf', 'application/pdf')).status).toBe(413);
  });

  it('rejects a request with no file', async () => {
    const res = await agent.post('/api/admin/files').field('note', 'nothing here');
    expect(res.status).toBe(400);
  });

  it('requires a session to upload or delete', async () => {
    const up = await request(t.app).post('/api/admin/files').attach('file', png(), 'a.png');
    expect(up.status).toBe(401);
    const del = await request(t.app).delete('/api/admin/files/64b7f0c2a1b2c3d4e5f60718');
    expect(del.status).toBe(401);
  });

  it('returns 404 for unknown and malformed file ids', async () => {
    expect((await request(t.app).get('/api/files/64b7f0c2a1b2c3d4e5f60718')).status).toBe(404);
    expect((await request(t.app).get('/api/files/nope')).status).toBe(404);
    expect((await agent.delete('/api/admin/files/64b7f0c2a1b2c3d4e5f60718')).status).toBe(404);
  });

  it('clears every reference when a file is deleted', async () => {
    const photo = (await upload(png(), 'me.png', 'image/png')).body.id;
    const resume = (await upload(pdf(), 'cv.pdf', 'application/pdf')).body.id;
    const shot = (await upload(png(), 'shot.png', 'image/png')).body.id;
    const keep = (await upload(png(), 'keep.png', 'image/png')).body.id;

    await agent.put('/api/admin/profile').send({ name: 'Pratik', photoFileId: photo, resumeFileId: resume });
    const project = await agent.post('/api/admin/projects').send({ title: 'Quattr', imageFileIds: [shot, keep] });

    for (const id of [photo, resume, shot]) {
      expect((await agent.delete(`/api/admin/files/${id}`)).status).toBe(200);
      expect((await request(t.app).get(`/api/files/${id}`)).status).toBe(404);
    }

    const profile = (await agent.get('/api/admin/profile')).body;
    expect(profile.photoFileId).toBe('');
    expect(profile.resumeFileId).toBe('');
    const projects = (await agent.get('/api/admin/projects')).body;
    expect(projects.find((p: any) => p._id === project.body._id).imageFileIds).toEqual([keep]);
  });
});

describe('files and the published site', () => {
  beforeEach(() => {
    // Publishing pings the web app; supertest does not use fetch, so stubbing it is safe here.
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
  });

  const filesCollection = async () => (await import('mongoose')).default.connection.db!.collection('uploads.files');
  const backdate = async (id: string) => {
    const { default: mongoose } = await import('mongoose');
    await (await filesCollection()).updateOne(
      { _id: new mongoose.Types.ObjectId(id) },
      { $set: { uploadDate: new Date(Date.now() - 48 * 60 * 60 * 1000) } },
    );
  };
  const exists = async (id: string) => (await request(t.app).get(`/api/files/${id}`)).status === 200;

  it('refuses to delete a file the live site still shows', async () => {
    const photo = (await upload(png(), 'me.png', 'image/png')).body.id;
    await agent.put('/api/admin/profile').send({ name: 'Pratik', photoFileId: photo });
    await agent.post('/api/admin/publish');

    const res = await agent.delete(`/api/admin/files/${photo}`);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('file_in_use');
    expect(await exists(photo)).toBe(true);
  });

  it('keeps a replaced photo until the replacement is published, then removes it', async () => {
    const oldPhoto = (await upload(png(), 'old.png', 'image/png')).body.id;
    await agent.put('/api/admin/profile').send({ name: 'Pratik', photoFileId: oldPhoto });
    await agent.post('/api/admin/publish');

    const newPhoto = (await upload(png(), 'new.png', 'image/png')).body.id;
    await agent.put('/api/admin/profile').send({ name: 'Pratik', photoFileId: newPhoto });
    await backdate(oldPhoto);
    // Not published yet: the live site still points at the old photo.
    expect(await exists(oldPhoto)).toBe(true);

    await agent.post('/api/admin/publish');
    expect(await exists(oldPhoto)).toBe(false);
    expect(await exists(newPhoto)).toBe(true);
  });

  it('does not remove a recent upload that has not been saved into a form yet', async () => {
    const fresh = (await upload(png(), 'fresh.png', 'image/png')).body.id;
    await agent.post('/api/admin/publish');
    expect(await exists(fresh)).toBe(true);
  });

  it('removes old uploads that nothing refers to', async () => {
    const orphan = (await upload(png(), 'orphan.png', 'image/png')).body.id;
    await backdate(orphan);
    await agent.post('/api/admin/publish');
    expect(await exists(orphan)).toBe(false);
  });
});
