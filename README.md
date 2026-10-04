# Pratik Bankar: Portfolio

A personal portfolio website with a built-in admin panel. Every piece of content on the site
(profile, skills, experience, projects, education, certifications, awards, resume, social links)
is stored in MongoDB and edited through the admin panel, with no code changes.

## How it fits together

```
Browser
   |
   v
web/   Next.js app on Vercel
       - public site, server rendered and cached
       - admin panel under /admin
       - /api/* is proxied to the API, so the browser only talks to one origin
   |
   v
api/   Express REST API on Render
   |
   v
MongoDB Atlas (content, uploaded files, contact messages)
```

| Part | Stack |
|---|---|
| `web/` | Next.js (App Router), React, TypeScript, Tailwind CSS |
| `api/` | Node.js, Express, TypeScript, Mongoose, Zod |
| Database | MongoDB. Uploaded images and the resume PDF are stored in GridFS |

## Features

**Public site**

- Hero, About, Skills, Experience, Projects (with a detail page each), Education, Certifications,
  Awards, Resume (view and download) and Contact
- Responsive layout, light and dark theme, subtle scroll animations that respect reduced motion
- SEO: per-page titles and descriptions, Open Graph and Twitter cards, a generated link preview
  image, `sitemap.xml`, `robots.txt` and structured data
- Optimized, lazy loaded images
- Contact form with validation, a honeypot field, a timing check and rate limiting

**Admin panel** (`/admin`)

- Secure login (bcrypt password hash, httpOnly session cookie, rate limited)
- Add, edit, delete and drag to reorder every collection
- Upload a profile photo, project screenshots and the resume
- Switch sections on or off
- Read contact form messages
- **Draft, preview, publish**: edits are saved as a draft. Open Preview to see the site with your
  draft, then press Publish. The live site updates within seconds.

## Run it locally

Requires Node.js 20 or newer. No MongoDB installation is needed for a quick start.

```bash
# 1. API, with an in-memory database seeded from the resume
cd api
npm install
npm run dev:memory        # http://localhost:4000, prints the local admin login

# 2. Web app, in a second terminal
cd web
npm install
cp .env.example .env.local
# set REVALIDATE_SECRET=local-revalidate-secret in .env.local
npm run dev               # http://localhost:3000, admin at /admin
```

`dev:memory` loses its data when it stops. To keep data, run a real MongoDB instead:

```bash
cd api
cp .env.example .env      # fill in every value
npm run seed              # creates the admin account and the initial content
npm run dev
```

If the web app runs on a port other than 3000, set `WEB_ORIGIN` for the API to match.

## Environment variables

**api/** (see `api/.env.example`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Signs the admin session. At least 32 random characters |
| `WEB_ORIGIN` | Public URL of the web app, no trailing slash |
| `REVALIDATE_SECRET` | Shared with the web app. Lets a publish refresh the cached pages |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | The admin account created by the seed. Password of 10 characters or more |
| `PORT` | Defaults to 4000 |

**web/** (see `web/.env.example`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base URL of the API, no trailing slash |
| `NEXT_PUBLIC_SITE_URL` | Public URL of the site. Optional on Vercel until you add a custom domain |
| `REVALIDATE_SECRET` | Must match the API value |

Never commit `.env` files. Only the `.env.example` files are tracked.

## Scripts

| Where | Command | What it does |
|---|---|---|
| `api` | `npm run dev` | Start the API with reload |
| `api` | `npm run dev:memory` | Start the API with a seeded in-memory database |
| `api` | `npm test` | API tests (in-memory MongoDB) |
| `api` | `npm run seed` | Create the admin and initial content if missing |
| `api` | `npm run seed -- --reset` | Replace all content with the resume content |
| `api` | `npm run seed -- --reset-password` | Set the admin password to the current `ADMIN_PASSWORD` |
| `web` | `npm run dev` | Start the site |
| `web` | `npm test` | Unit tests |
| `web` | `npm run lint` / `npm run typecheck` | Static checks |
| `web` | `npm run build` | Production build |

## Deploy (free tiers)

1. **MongoDB Atlas**: create a free M0 cluster, a database user, and allow network access from
   anywhere (`0.0.0.0/0`, because Render's free tier has no fixed IP). Copy the connection string
   and put a database name in it, for example `...mongodb.net/portfolio`.
2. **Render**: New > Blueprint, pick this repository. `render.yaml` defines the service. Fill in
   `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` and, for now, any placeholder URL for
   `WEB_ORIGIN`. The first start creates the admin account and loads the initial content.
3. **Vercel**: import this repository and set the root directory to `web`. Add
   `NEXT_PUBLIC_API_URL` (the Render URL) and `REVALIDATE_SECRET` (copy the generated value from
   Render). Deploy, then enable Web Analytics in the project settings.
4. Back on **Render**, set `WEB_ORIGIN` to the Vercel URL and save. The service restarts.
5. Open `/admin` on the Vercel URL, log in, upload your photo and resume, and press Publish.

Both hosts serve HTTPS automatically.

**Adding a custom domain later**: add the domain in the Vercel project, then set
`NEXT_PUBLIC_SITE_URL` on Vercel and `WEB_ORIGIN` on Render to `https://your-domain` and redeploy
both. No code changes are needed.

**Free tier limits to know**

- Render's free service sleeps after about 15 minutes without traffic and takes 30 to 60 seconds
  to wake. Public pages are cached on Vercel, so visitors are not affected. The first admin login
  or contact form submission after a quiet period is slow.
- If the API is unreachable, the site keeps serving the last published pages. Images and the
  resume download are served by the API, so they are slow on the first visit after a sleep.
- **Recommended**: keep the API awake with a free uptime monitor (for example UptimeRobot or
  cron-job.org) that requests `https://<your-render-url>/api/health` every 10 minutes. This
  removes the slow first login, the slow first image and the slow first contact message.

## Forgotten admin password

Set a new `ADMIN_PASSWORD` on Render, change the start command once to
`node dist/seed/run.js --reset-password && npm start`, deploy, then change it back.

## Project layout

```
api/
  src/
    app.ts            Express app: middleware and routes
    config.ts         Environment validation
    routes/           auth, admin CRUD, files, messages, public
    services/         publish (draft and snapshot), files (GridFS), singletons
    models/           Mongoose schemas
    schemas.ts        Request validation
    seed/             Initial content from the resume
  tests/              API tests
web/
  app/                Pages: home, project detail, admin, sitemap, robots
  components/site/    Public sections
  components/admin/   Admin shell, editor, uploads
  lib/                Data loading, SEO, admin API client, collection definitions
docs/superpowers/     Design spec and implementation plan
render.yaml           Render service definition
```
