# Portfolio Website with Admin CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a portfolio site for Pratik Bankar whose content is fully managed through a secure admin panel.

**Architecture:** A Next.js app on Vercel renders the public site from a published snapshot and hosts the admin panel under `/admin`. It proxies `/api/*` to an Express API on Render, which stores draft content, the published snapshot and uploaded files in MongoDB Atlas.

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind CSS, motion, next-themes, @dnd-kit; Express 4, Mongoose 8, Zod, bcryptjs, jsonwebtoken, multer, helmet, express-rate-limit; Vitest, Supertest, mongodb-memory-server.

**Spec:** `docs/superpowers/specs/2026-10-04-portfolio-design.md`

## Global Constraints

- Node 20 or newer. TypeScript strict mode in both packages.
- Two packages: `api/` and `web/`, each with its own `package.json`. No workspace tooling.
- Public endpoints read only from `publishedSnapshot`. Draft content is never public.
- Phone number and date of birth are never stored or rendered.
- Error JSON shape everywhere: `{ error: { code, message, details? } }`.
- Session cookie name `pf_session`: httpOnly, Secure in production, SameSite=Lax, 7 days.
- bcrypt cost 12. Upload limits: images 5 MB (jpeg, png, webp, avif), PDF 10 MB.
- Rate limits: login 5 per 15 min per IP; contact 5 per hour per IP.
- All secrets from environment variables; every variable listed in `.env.example`.
- No em-dashes in any copy or documentation.
- Commit after every task, authored as `pratikbankar88@gmail.com`, pushed to `origin main`.

## Review Focus

1. API asleep or unreachable while Vercel builds or revalidates: the public page must still render (last cache, or a minimal fallback with name and title), never a 500. Test in Task 8.
2. Deleting an uploaded file that a project, the profile photo or the resume still references: the reference is cleared, and the public site shows no broken image or dead resume button. Test in Task 4.
3. Tampered, expired or missing session cookie on any `/api/admin/*` route returns 401, and the admin UI redirects to login instead of showing an empty page. Tests in Tasks 2 and 10.
4. Two projects whose titles produce the same slug: the second gets a unique slug (`quattr-2`), not a 500 or a silent overwrite. Test in Task 3.
5. Reorder request containing unknown, duplicate or missing ids: rejected with 400 and no partial reorder. Test in Task 3.

---

## File Structure

```
api/
  package.json, tsconfig.json, vitest.config.ts, .env.example
  src/
    index.ts                 start server (connect, listen)
    app.ts                   createApp(): express app, middleware, routers
    config.ts                env parsing with Zod
    db.ts                    connect(uri), disconnect()
    errors.ts                AppError, notFound, errorHandler
    middleware/auth.ts       signSession, requireAuth
    middleware/validate.ts   validate(schema)
    middleware/limits.ts     loginLimiter, contactLimiter
    models/                  one file per collection (see Task 2 and 3)
    schemas.ts               Zod schemas for every resource
    routes/auth.ts
    routes/crud.ts           crudRouter(model, schema, opts)
    routes/admin.ts          mounts cruds, singletons, files, messages, publish
    routes/public.ts         site, project by slug, contact, health
    routes/files.ts          public GET /api/files/:id
    services/files.ts        saveFile, openFile, deleteFile (GridFS)
    services/publish.ts      buildDraft, publish, getPublished, hasUnpublishedChanges
    seed/content.ts          resume content
    seed/run.ts              seed script
  tests/
    helpers.ts               startTestApp(), loginAgent()
    health.test.ts auth.test.ts crud.test.ts files.test.ts
    publish.test.ts contact.test.ts seed.test.ts
web/
  next.config.ts             rewrites /api/* to API_URL, image remotePatterns
  .env.example
  app/
    layout.tsx               theme provider, analytics, base metadata
    page.tsx                 public home (server component)
    projects/[slug]/page.tsx
    sitemap.ts robots.ts not-found.tsx error.tsx
    internal/revalidate/route.ts
    admin/layout.tsx admin/login/page.tsx admin/page.tsx
    admin/[resource]/page.tsx   generic list and form editor
    admin/profile/page.tsx admin/sections/page.tsx admin/resume/page.tsx
    admin/messages/page.tsx admin/preview/page.tsx
  components/site/           SiteView, Header, Hero, About, Skills, Experience,
                             Projects, Education, Certifications, Awards,
                             Resume, Contact, Footer, ThemeToggle, Reveal
  components/admin/          AdminShell, ResourceEditor, SortableList,
                             FieldRenderer, FileUpload, PublishButton
  lib/types.ts               SiteContent and resource types (mirror of API)
  lib/site.ts                getSite(), fileUrl(), fallbackSite
  lib/adminApi.ts            api(path, init) with 401 redirect
  lib/resources.ts           field definitions per admin resource
render.yaml
README.md
```

Shared content type, used by API publish service and by the web app:

```ts
export interface SiteContent {
  profile: Profile;            // name, jobTitle, tagline, summary, about, location,
                               // email, photoFileId, resumeFileId, seoTitle,
                               // seoDescription, gaMeasurementId
  sections: Record<SectionKey, boolean>;
  skills: Skill[];             // { _id, name, category, order }
  experiences: Experience[];   // { company, role, location, startDate, endDate|null,
                               //   responsibilities[], achievements[], order }
  projects: Project[];         // { title, slug, subtitle, role, description,
                               //   highlights[], technologies[], imageFileIds[],
                               //   githubUrl, liveUrl, featured, order }
  education: Education[];
  certifications: Certification[];   // status: 'completed' | 'in-progress'
  awards: Award[];
  socialLinks: SocialLink[];
}
export type SectionKey = 'about' | 'skills' | 'experience' | 'projects' | 'education'
  | 'certifications' | 'awards' | 'resume' | 'contact';
```

---

### Task 1: API scaffold, config, errors, health

**Files:** Create `api/package.json`, `api/tsconfig.json`, `api/vitest.config.ts`, `api/.env.example`, `api/src/{index,app,config,db,errors}.ts`, `api/tests/{helpers,health.test}.ts`, root `.gitignore`.

**Interfaces:**
- Produces: `createApp(): Express`; `config` with `MONGODB_URI, JWT_SECRET, WEB_ORIGIN, REVALIDATE_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, NODE_ENV, PORT`; `class AppError(status, code, message, details?)`; `startTestApp(): Promise<{ app, stop }>` (in-memory MongoDB).

- [ ] Step 1: `npm init`, install dependencies, write tsconfig (strict, ES2022, NodeNext) and scripts `dev`, `build`, `start`, `test`, `seed`.
- [ ] Step 2: Write failing test:

```ts
it('reports health', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ ok: true });
});
it('returns the error shape for unknown routes', async () => {
  const res = await request(app).get('/api/nope');
  expect(res.status).toBe(404);
  expect(res.body.error.code).toBe('not_found');
});
```

- [ ] Step 3: Run `npm test`, expect failure (no app).
- [ ] Step 4: Implement config, db, errors, app (helmet, cors with `WEB_ORIGIN` and credentials, `express.json({ limit: '100kb' })`, cookie-parser, `trust proxy` 1, 404, error handler that hides stack in production).
- [ ] Step 5: Run tests, expect pass. Commit `feat(api): scaffold with health and error handling`.

### Task 2: Admin user and authentication

**Files:** Create `api/src/models/AdminUser.ts`, `api/src/middleware/{auth,validate,limits}.ts`, `api/src/routes/auth.ts`, `api/tests/auth.test.ts`. Modify `api/src/app.ts`, `api/tests/helpers.ts`.

**Interfaces:**
- Produces: `POST /api/auth/login {email,password}` sets `pf_session`; `POST /api/auth/logout`; `GET /api/auth/me` returns `{ email }`; `requireAuth` middleware; `loginAgent(app): Promise<SuperAgentTest>` test helper that creates an admin and logs in.

- [ ] Step 1: Write failing tests: correct login returns 200 and sets an httpOnly cookie; wrong password returns 401 `invalid_credentials`; `/me` without cookie returns 401; `/me` with a cookie signed by another secret returns 401; `/me` with an expired token returns 401; logout clears the cookie; the stored password is not the plain text; sixth login attempt in the window returns 429.
- [ ] Step 2: Run, expect failures.
- [ ] Step 3: Implement model (email unique lowercase, passwordHash), `signSession(userId)` with 7 day JWT, `requireAuth` verifying cookie, limiter (disabled when `NODE_ENV=test` unless header `x-test-ratelimit` is set), routes.
- [ ] Step 4: Run, expect pass. Commit `feat(api): admin authentication`.

### Task 3: Content models, validation and CRUD

**Files:** Create `api/src/models/{Profile,SectionSettings,Skill,Experience,Project,Education,Certification,Award,SocialLink}.ts`, `api/src/schemas.ts`, `api/src/routes/{crud,admin}.ts`, `api/tests/crud.test.ts`. Modify `api/src/app.ts`.

**Interfaces:**
- Produces: `crudRouter(model, schema, { slugFrom?: string })` giving `GET /`, `POST /`, `PUT /reorder` (body `{ ids: string[] }`), `PUT /:id`, `DELETE /:id`; mounted at `/api/admin/{skills,experiences,projects,education,certifications,awards,social-links}`; `GET|PUT /api/admin/profile`; `GET|PUT /api/admin/sections`. Singletons are fetched with `getSingleton(model)` which upserts `{ key: 'main' }`.

- [ ] Step 1: Write failing tests: every admin route returns 401 without a session; create, list (sorted by `order`), update, delete for skills; new items get `order = max + 1`; invalid body returns 400 `validation_error` with field details; experience with `endDate` earlier than `startDate` returns 400; invalid URL in project `githubUrl` returns 400; two projects titled "Quattr" get slugs `quattr` and `quattr-2`; reorder with the full id set reorders; reorder with an unknown, duplicate or missing id returns 400 and leaves order unchanged; invalid ObjectId in `:id` returns 400, unknown id returns 404; profile and sections `PUT` then `GET` round trip; profile rejects unknown keys such as `phone`.
- [ ] Step 2: Run, expect failures.
- [ ] Step 3: Implement models, strict Zod schemas, the CRUD factory and admin router.
- [ ] Step 4: Run, expect pass. Commit `feat(api): content models and admin CRUD`.

### Task 4: File storage

**Files:** Create `api/src/services/files.ts`, `api/src/routes/files.ts`, `api/tests/files.test.ts`. Modify `api/src/routes/admin.ts`, `api/src/app.ts`.

**Interfaces:**
- Produces: `saveFile(buffer, { filename, contentType }): Promise<string>`; `openFile(id): Promise<{ stream, contentType, length, filename } | null>`; `deleteFile(id)`; `POST /api/admin/files` (multipart field `file`) returns `{ id, contentType, filename }`; `DELETE /api/admin/files/:id`; public `GET /api/files/:id` with `Cache-Control: public, max-age=31536000, immutable`.

- [ ] Step 1: Write failing tests: upload png then fetch returns the same bytes and content type; PDF upload works and is served with `Content-Disposition: inline; filename=...`; a `.exe` or `text/html` upload returns 400 `unsupported_file_type`; an image over 5 MB returns 413; upload without a session returns 401; unknown file id returns 404; deleting a file referenced by `profile.photoFileId`, `profile.resumeFileId` or a project's `imageFileIds` clears those references.
- [ ] Step 2: Run, expect failures.
- [ ] Step 3: Implement with multer memory storage (10 MB cap, per-type check in handler) and `mongoose.mongo.GridFSBucket` bucket `uploads`.
- [ ] Step 4: Run, expect pass. Commit `feat(api): file uploads in GridFS`.

### Task 5: Publish, preview, dashboard and public content

**Files:** Create `api/src/models/PublishedSnapshot.ts`, `api/src/services/publish.ts`, `api/src/routes/public.ts`, `api/tests/publish.test.ts`. Modify `api/src/routes/admin.ts`, `api/src/app.ts`.

**Interfaces:**
- Produces: `buildDraft(): Promise<SiteContent>`; `publish(): Promise<{ publishedAt }>` (stores snapshot, then POSTs `${WEB_ORIGIN}/internal/revalidate` with header `x-revalidate-secret`, ignoring network failure but reporting `revalidated: boolean`); `GET /api/admin/preview`; `POST /api/admin/publish`; `GET /api/admin/dashboard` returning `{ counts, unreadMessages, publishedAt, hasUnpublishedChanges }`; `GET /api/public/site` returning `{ content: SiteContent | null, publishedAt }`; `GET /api/public/projects/:slug`.

- [ ] Step 1: Write failing tests: before any publish, public site returns `content: null`; after creating a skill and publishing, public site contains it; a skill created after publish appears in preview but not in public site, and dashboard reports `hasUnpublishedChanges: true`; after publishing again the flag is false; public project by slug returns only published projects and 404 otherwise; publish succeeds with every collection empty; publish succeeds when the revalidation call fails and reports `revalidated: false`.
- [ ] Step 2: Run, expect failures.
- [ ] Step 3: Implement. `hasUnpublishedChanges` compares `JSON.stringify` of the draft against the stored snapshot content.
- [ ] Step 4: Run, expect pass. Commit `feat(api): draft preview and publish`.

### Task 6: Contact form and messages

**Files:** Create `api/src/models/ContactMessage.ts`, `api/tests/contact.test.ts`. Modify `api/src/routes/{public,admin}.ts`, `api/src/schemas.ts`.

**Interfaces:**
- Produces: `POST /api/contact { name, email, subject?, message, website (honeypot), startedAt (ms epoch) }` returning `{ ok: true }`; `GET /api/admin/messages`; `PATCH /api/admin/messages/:id { read }`; `DELETE /api/admin/messages/:id`.

- [ ] Step 1: Write failing tests: valid submission is stored and listed newest first; invalid email or 5 character message returns 400; filled honeypot returns 200 but stores nothing; `startedAt` under 3 seconds ago returns 200 but stores nothing; message over 5000 characters returns 400; HTML in the message is stored as text and returned unchanged (the UI escapes it); sixth submission in the window returns 429; messages routes require a session; mark read and delete work.
- [ ] Step 2: Run, expect failures.
- [ ] Step 3: Implement. Store a SHA-256 hash of the IP, never the IP.
- [ ] Step 4: Run, expect pass. Commit `feat(api): contact form with spam protection`.

### Task 7: Seed script

**Files:** Create `api/src/seed/{content,run}.ts`, `api/tests/seed.test.ts`.

**Interfaces:**
- Produces: `seed({ reset?: boolean }): Promise<void>`; `npm run seed`. Creates the admin from `ADMIN_EMAIL` and `ADMIN_PASSWORD` if missing, inserts resume content only when collections are empty (or always with `--reset`), then publishes.

- [ ] Step 1: Write failing tests: after seeding, the public site has profile name "Pratik Bankar", 4 experiences, 3 education entries, 4 certifications, 2 awards, 1 project with slug `quattr`, 7 skill categories; no field anywhere in the snapshot contains the phone number or date of birth; running seed twice does not duplicate anything; the admin can log in.
- [ ] Step 2: Run, expect failures.
- [ ] Step 3: Implement content from the resume (spec section 12) and the runner.
- [ ] Step 4: Run, expect pass. Commit `feat(api): seed resume content`.

### Task 8: Public site

**Files:** Create the `web/` app with `create-next-app` (TypeScript, Tailwind, App Router, no src dir); `web/next.config.ts`, `web/lib/{types,site}.ts`, `web/components/site/*`, `web/app/{layout,page,not-found,error}.tsx`, `web/app/projects/[slug]/page.tsx`, `web/.env.example`.

**Interfaces:**
- Consumes: `GET /api/public/site`, `GET /api/files/:id`.
- Produces: `getSite(): Promise<SiteContent>` (fetch with tag `site`; on failure or `content: null` returns `fallbackSite` containing only name and job title, with every section disabled); `fileUrl(id): string`; `<SiteView content={SiteContent} preview?: boolean />` used by both the home page and admin preview.

- [ ] Step 1: Scaffold, add rewrite `/api/:path*` to `${API_URL}/api/:path*`, image `remotePatterns` for the API host, env `API_URL`, `NEXT_PUBLIC_API_ORIGIN`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`.
- [ ] Step 2: Write `lib/site.ts` with a unit test (Vitest) for the Review Focus case: when fetch rejects or returns 500, `getSite()` resolves to `fallbackSite` and does not throw.
- [ ] Step 3: Build sections. Each returns null when its section flag is false or its list is empty. Hero uses an initials avatar when `photoFileId` is empty and hides Download Resume when `resumeFileId` is empty. Header nav lists only visible sections. Theme toggle with `next-themes`. `Reveal` wrapper uses `motion` and respects `prefers-reduced-motion`.
- [ ] Step 4: Contact form component: client validation, honeypot input hidden from users and assistive tech, `startedAt` captured on mount, success and error states.
- [ ] Step 5: Project detail page with `generateStaticParams` and `notFound()` for unknown slugs.
- [ ] Step 6: Run seeded API and web locally; check home and project page at 375, 768 and 1440 widths in both themes; stop the API and confirm the page still renders. `npm run lint && npm run build` pass. Commit `feat(web): public portfolio site`.

### Task 9: SEO, revalidation, analytics

**Files:** Create `web/app/{sitemap,robots}.ts`, `web/app/internal/revalidate/route.ts`, `web/components/site/{JsonLd,Analytics}.tsx`. Modify `web/app/layout.tsx`, `web/app/page.tsx`, `web/app/projects/[slug]/page.tsx`.

**Interfaces:**
- Consumes: `REVALIDATE_SECRET`, `getSite()`.
- Produces: `POST /internal/revalidate` (401 without the matching `x-revalidate-secret`, otherwise `revalidateTag('site')` and `{ revalidated: true }`).

- [ ] Step 1: `generateMetadata` on home and project pages: title, description, canonical, Open Graph, Twitter card, from profile SEO fields with sensible defaults.
- [ ] Step 2: `sitemap.ts` (home plus each project), `robots.ts` (disallow `/admin` and `/internal`), JSON-LD `Person`.
- [ ] Step 3: Revalidate route with a unit test for the 401 path.
- [ ] Step 4: `@vercel/analytics` in layout; Google Analytics script only when `profile.gaMeasurementId` is set.
- [ ] Step 5: Verify with `curl` that the built home page HTML contains the title, OG tags and JSON-LD, and that publishing from the API updates the page. Commit `feat(web): SEO, revalidation and analytics`.

### Task 10: Admin panel

**Files:** Create `web/lib/{adminApi,resources}.ts`, `web/components/admin/*`, `web/app/admin/**`.

**Interfaces:**
- Consumes: every `/api/auth/*` and `/api/admin/*` endpoint above.
- Produces: `api<T>(path, init?): Promise<T>` which throws `ApiError` with the server message and redirects to `/admin/login` on 401; `resources` map describing fields per resource (`text`, `textarea`, `list`, `date`, `url`, `select`, `boolean`, `images`), driving the generic `ResourceEditor`.

- [ ] Step 1: `adminApi` with a unit test: a 401 response triggers the login redirect; a 400 surfaces `error.message` and field details.
- [ ] Step 2: Login page and `AdminShell` (sidebar nav, logout, Publish button with unpublished-changes badge). The shell calls `/api/auth/me` and redirects when unauthenticated.
- [ ] Step 3: `ResourceEditor`: list, add, edit, delete with confirmation, inline validation errors, and drag reorder through `@dnd-kit/sortable` calling `PUT /reorder`. Route `admin/[resource]` covers skills, experiences, projects, education, certifications, awards and social links.
- [ ] Step 4: Profile page (including photo upload and Google Analytics ID), resume upload and replace page, section toggles page, messages page (unread badge, mark read, delete; message text rendered as text, never HTML).
- [ ] Step 5: Dashboard with counts, unread messages, last published time. Preview page rendering `<SiteView preview />` from `/api/admin/preview`.
- [ ] Step 6: Browser pass against the local stack: log in, edit a skill, confirm preview shows it and public does not, publish, confirm public shows it; upload a project image and a resume; toggle a section off; submit the contact form and read it in admin; log out and confirm `/admin` redirects. `npm run lint && npm run build` pass. Commit `feat(web): admin panel`.

### Task 11: Documentation and deploy config

**Files:** Create `README.md`, `render.yaml`, finalize `api/.env.example` and `web/.env.example`.

- [ ] Step 1: `render.yaml`: free web service, root `api`, build `npm ci && npm run build`, start `npm start`, health check `/api/health`, env vars declared with `sync: false` for secrets.
- [ ] Step 2: README: overview, architecture diagram, local setup, environment variables table, seed, tests, deployment steps for Atlas, Render and Vercel, adding a custom domain later, free tier limits.
- [ ] Step 3: Run the full API test suite and both builds from a clean install. Commit `docs: README and deploy config`.

### Task 12: Production deployment

Requires the owner to sign in to MongoDB Atlas, Render and Vercel.

- [ ] Step 1: Atlas: create M0 cluster, database user, network access `0.0.0.0/0`, copy the connection string.
- [ ] Step 2: Render: create the service from `render.yaml`, set `MONGODB_URI`, `JWT_SECRET`, `REVALIDATE_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `WEB_ORIGIN`. Run the seed once.
- [ ] Step 3: Vercel: import the repo with root `web`, set `API_URL`, `NEXT_PUBLIC_API_ORIGIN`, `NEXT_PUBLIC_SITE_URL`, `REVALIDATE_SECRET`. Enable Web Analytics.
- [ ] Step 4: Set `WEB_ORIGIN` on Render to the Vercel URL and redeploy.
- [ ] Step 5: Production check: home page, project page, `sitemap.xml`, `robots.txt`, contact submission, admin login, edit and publish, resume download, HTTPS on both hosts.
