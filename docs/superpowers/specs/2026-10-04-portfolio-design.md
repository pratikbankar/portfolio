# Portfolio Website with Admin CMS: Design

Date: 2026-10-04
Owner: Pratik Bankar
Status: awaiting review

## 1. Goal

A production-ready personal portfolio for Pratik Bankar (Senior Full Stack Engineer) that
recruiters and clients can browse, plus a secure admin panel so every piece of content can be
changed without touching code. Hosted entirely on free tiers, on the provider URL for now, with
a custom domain to be attached later.

Success means:

- The public site loads fast, reads well on mobile, tablet and desktop, and is indexable.
- Pratik can log in, edit any section, preview the result, and publish it, with no deploy.
- All code lives in `github.com/pratikbankar/portfolio` with clear setup documentation.

## 2. Architecture

```
Browser
  |
  v
Vercel: Next.js app (web/)
  - public pages, server rendered and cached
  - /admin/* admin panel (client rendered)
  - /api/* rewritten to the Render API (same-origin cookies)
  |
  v
Render: Express REST API (api/)
  |
  v
MongoDB Atlas (free M0 cluster)
```

- **web/**: Next.js (App Router), React, TypeScript, Tailwind CSS, Framer Motion.
- **api/**: Node.js, Express, TypeScript, Mongoose, Zod validation.
- **Database**: MongoDB Atlas. Uploaded files are stored in MongoDB GridFS because Render's free
  disk is not persistent.

The frontend proxies `/api/*` to the Render service through a Next.js rewrite, so the browser
only ever talks to one origin. This keeps the admin session cookie first-party.

## 3. Repository layout

```
portfolio/
  web/                 Next.js frontend and admin panel
  api/                 Express API
    src/
      models/          Mongoose schemas
      routes/          public, admin, auth, files
      middleware/      auth, validation, errors, rate limit
      services/        publish snapshot, file storage
      seed/            seed script and resume content
    tests/
  docs/
  README.md
  render.yaml          Render service definition
```

## 4. Data model

Each collection is one focused Mongoose model.

| Collection | Key fields |
|---|---|
| `profile` (single doc) | name, jobTitle, tagline, summary, about (long text), location, email, photoFileId, resumeFileId, seoTitle, seoDescription, gaMeasurementId |
| `skills` | name, category, order |
| `experiences` | company, role, location, startDate, endDate (null = present), responsibilities[], achievements[], order |
| `projects` | title, slug, subtitle, role, description, highlights[], technologies[], imageFileIds[], githubUrl, liveUrl, featured, order |
| `education` | degree, field, institution, location, startDate, endDate, order |
| `certifications` | name, issuer, status (completed or in progress), year, url, order |
| `awards` | title, issuer, description, year, order |
| `socialLinks` | platform, url, order |
| `sectionSettings` (single doc) | one enabled flag per section: about, skills, experience, projects, education, certifications, awards, resume, contact |
| `contactMessages` | name, email, subject, message, read, createdAt, ip hash |
| `adminUsers` | email, passwordHash |
| `publishedSnapshot` (single doc) | full copy of all public content at last publish, publishedAt |

Files (project images, profile photo, resume PDF) live in GridFS and are referenced by id.

## 5. Draft, preview and publish

- Admin CRUD edits the working collections. These are the draft.
- `GET /api/admin/preview` returns the draft content. The page `/admin/preview` renders the real
  public page components with it, so the preview is exactly what will ship.
- `POST /api/admin/publish` copies the working collections into `publishedSnapshot` and calls a
  secret revalidation endpoint on the Next.js app, so the public site updates within seconds.
- The public API reads only from `publishedSnapshot`. Unpublished edits are never visible.
- The dashboard shows whether there are unpublished changes.

## 6. API

Public (no auth):

- `GET /api/public/site`: the whole published snapshot in one response.
- `GET /api/public/projects/:slug`: one published project.
- `GET /api/files/:id`: stream an image or the resume from GridFS, with long cache headers.
- `POST /api/contact`: submit the contact form.
- `GET /api/health`: liveness check.

Auth:

- `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.

Admin (session required):

- CRUD for skills, experiences, projects, education, certifications, awards, socialLinks.
- `PUT /api/admin/<collection>/reorder` for ordered collections.
- `GET` and `PUT` for profile and sectionSettings.
- `POST /api/admin/files` (image or PDF upload), `DELETE /api/admin/files/:id`.
- `GET /api/admin/messages`, mark read, delete.
- `GET /api/admin/preview`, `POST /api/admin/publish`, `GET /api/admin/dashboard` (counts,
  unread messages, last published time, unpublished-changes flag).

All request bodies are validated with Zod. Errors return a consistent JSON shape
`{ error: { code, message, details? } }`. Stack traces are never sent in production.

## 7. Security

- One admin account, created by the seed script from `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
- Passwords hashed with bcrypt (cost 12).
- Session is a signed JWT in an httpOnly, Secure, SameSite=Lax cookie, 7 day expiry.
- Login rate limited (5 attempts per 15 minutes per IP).
- Helmet security headers, CORS restricted to the frontend origin, JSON body size limits.
- Uploads restricted by MIME type and size (images 5 MB, PDF 10 MB).
- Secrets only in environment variables. `.env.example` files document every variable.

## 8. Contact form and spam protection

- Client and server validation (name, valid email, message length).
- Hidden honeypot field; submissions that fill it are silently dropped.
- Minimum fill time check (rejects forms submitted in under 3 seconds).
- Rate limit: 5 submissions per hour per IP.
- Messages are stored in MongoDB and shown in the admin panel. No email sending in this version.

## 9. Public site

Single scrolling home page with anchored sections, plus a detail page per project.

Sections, each hidden when disabled in admin or when it has no content:
Hero, About, Skills, Experience, Projects, Education, Certifications, Awards, Resume, Contact.

- Hero: name, title, summary, photo (initials avatar when no photo is uploaded), buttons for
  View Projects, Contact Me and Download Resume.
- Skills grouped by category.
- Experience as a timeline.
- Projects as cards linking to `/projects/[slug]`.
- Resume: view in browser and download.
- Dark and light mode, following system preference with a manual toggle.
- Subtle scroll and hover animations that respect reduced-motion settings.

Privacy: the public site shows email and LinkedIn. Phone number and date of birth from the
resume are not published.

## 10. SEO, performance, analytics

- Server-rendered pages with per-page title, description, canonical URL, Open Graph and Twitter
  card tags, driven by profile and project data.
- Generated `sitemap.xml` and `robots.txt` (admin routes disallowed).
- JSON-LD `Person` structured data.
- Images served through `next/image` (responsive sizes, lazy loading, modern formats).
- Public pages cached on Vercel and revalidated on publish, so the sleeping free Render API
  does not slow down visitors.
- Vercel Web Analytics enabled by default. Google Analytics loads only when a measurement ID is
  set in the admin profile settings.

## 11. Admin panel

Routes under `/admin`: login, dashboard, profile, skills (drag to reorder), experience,
projects (with image upload), education, certifications, awards, social links, resume upload,
messages, section toggles, preview, and a Publish button available from every page.

## 12. Seed content

Seeded from the resume so the site is complete on first deploy:

- Profile, summary, seven skill categories.
- Four roles: LTIMindtree, Cuelogic Technologies, Policy Planner Web Agg, Pocket InfoTech.
- Three education entries.
- Certifications: Node.js and React.js Training, AWS Certification (in progress), GitHub Copilot
  (in progress), Angular: The Complete Guide (Udemy).
- Awards: Hi-Five Award (two received), Super Crew Award, both LTIMindtree.
- One project: Quattr, Enterprise SEO and Content Optimization Platform, role Senior Product
  Engineer, with the technologies and four highlights from the resume. No screenshots or links.
- Social links: LinkedIn, GitHub (`github.com/pratikbankar`), email.

## 13. Error handling

- API: central error middleware, typed error classes, 404 handler, validation errors as 400,
  auth failures as 401, unexpected errors logged and returned as a generic 500.
- Web: error boundary and not-found pages; if the API is unreachable during a rebuild the last
  cached page keeps being served; forms show inline errors and a retry message.

## 14. Testing

- API: Vitest and Supertest against an in-memory MongoDB. Covers login and session, protected
  route rejection, validation, CRUD and reorder, contact spam rules, and the rule that public
  endpoints only ever return published content.
- Web: type check, lint and production build must pass; a manual browser pass on mobile, tablet
  and desktop widths in both themes before deploy.

## 15. Deployment

- MongoDB Atlas M0 cluster, network access open to Render.
- Render free web service for `api/`, defined in `render.yaml`.
- Vercel project for `web/`, with `API_URL` pointing at Render.
- HTTPS is provided by Vercel and Render. A custom domain can be attached in Vercel later
  without code changes (one environment variable for the site URL).
- Known limit: the free Render service sleeps after about 15 minutes idle; the first contact
  submission or admin login after that takes 30 to 60 seconds.

Account sign-ins for Atlas, Render and Vercel must be done by the owner.

## 16. Out of scope

Email notifications for contact messages, multiple admin users, blog, internationalisation,
and custom domain setup.
