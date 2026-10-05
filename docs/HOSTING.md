# Hosting, accounts and costs

Everything about where this site runs, how to manage it, and what is and is not free.
Written on 2026-10-04, updated 2026-10-05. No passwords or secret keys are in this file or anywhere in the repository.

## Live addresses

| What | Address |
|---|---|
| Portfolio site | https://pratik-bankar-portfolio.vercel.app |
| Admin panel | https://pratik-bankar-portfolio.vercel.app/admin |
| API (used by the site, not opened directly) | https://pratik-bankar-portfolio-api.vercel.app |
| Source code | https://github.com/pratikbankar/portfolio |

## Where each part runs

| Part | Provider | Name there | Plan |
|---|---|---|---|
| Site and admin panel | Vercel | project `pratik-bankar-portfolio` (folder `web/`) | Hobby, free |
| API | Vercel | project `pratik-bankar-portfolio-api` (folder `api/`) | Hobby, free |
| Database and uploaded files | MongoDB Atlas | project `portfolio`, cluster `portfolio`, region Singapore | M0, free |
| Code | GitHub | `pratikbankar/portfolio`, public | free |

Both Vercel projects are in the team "Pratik Portfolio". All accounts are under
`pratikbankar88@gmail.com`.

An older Atlas cluster named `Portfollio` exists in "Project 0". This site does not use it.
A Render account was created during setup but nothing runs there (Render asks for a card even
on its free plan), so it can be ignored or deleted.

## Second project: Web Vitals Monitor

A separate project shown on the portfolio, with its own repository and deployment.

| What | Where |
|---|---|
| Live demo | https://web-vitals-monitor-pratik.vercel.app |
| Source code | https://github.com/pratikbankar/web-vitals-monitor (public) |
| Hosting | Vercel project `web-vitals-monitor-pratik`, same team, Hobby plan, auto-deploys on push to `main` |
| Database | Database `vitals` on the same free Atlas cluster as the portfolio |
| Audits | Google PageSpeed Insights API, free, using an API key from the Google Cloud project `web-vitals-monitor` |
| Daily re-audit | Vercel Cron, once a day at 03:00 UTC |

Its secrets (Google API key, admin key, cron secret) are kept the same way as the portfolio's:
in `~/.config/portfolio-deploy/` on the deploy Mac and in the Vercel project settings.

The Google API key should be restricted to the PageSpeed Insights API only (Google Cloud,
APIs and Services, Credentials, edit the key). The free quota is far above what the demo uses.

## Third project: API Mock Studio

| What | Where |
|---|---|
| Live demo | https://api-mock-studio-pratik.vercel.app |
| Source code | https://github.com/pratikbankar/api-mock-studio (public) |
| Hosting | Vercel project `api-mock-studio-pratik`, same team, Hobby plan, auto-deploys on push to `main` |
| Database | Database `mocks` on the same free Atlas cluster |

It needs no API keys. Its only secret is the database connection string, kept in the Vercel
project settings. Workspaces unused for 30 days are deleted automatically, so its storage
stays small.

## Admin login

- Email: `pratikbankar88@gmail.com`
- Password: generated at deploy time and stored only on the Mac used for the deploy, in
  `~/.config/portfolio-deploy/admin_password`. View it with:

  ```bash
  cat ~/.config/portfolio-deploy/admin_password
  ```

There is no change-password screen. To set a new password, see "Forgotten admin password" in
the README.

## Where the secrets are

| Secret | Stored in |
|---|---|
| Admin password, database password, session key, revalidation key | `~/.config/portfolio-deploy/` on the deploy Mac (readable only by that user) |
| The same values as environment variables | Vercel project settings (Environment Variables) |

None of these are in the repository. If that Mac is lost, the site keeps working, because Vercel
holds its own copies; you would only need to reset the admin password.

## Updating the site

- **Content** (text, skills, projects, photo, resume, sections): log in to the admin panel, edit,
  open Preview, then press Publish. The live site updates within seconds. No deploy is needed.
- **Code**: push to the `main` branch on GitHub. Both Vercel projects rebuild and go live
  automatically (the site from `web/`, the API from `api/`).

## Is it free forever?

Free with no end date and no card on file, so there can be no surprise charge. "Forever" depends
on the providers keeping their free plans and on staying inside their limits.

**Vercel, Hobby plan**

- No time limit. It is for personal, non-commercial use, which a portfolio is. Turning the site
  into a business (selling something, running ads) requires a paid plan under their terms.
- Monthly usage caps apply (bandwidth, function time, image optimizations). A portfolio is
  normally far below them. If a cap is exceeded, Vercel pauses that feature until the next month
  instead of billing.

**MongoDB Atlas, M0 cluster**

- No time limit. Storage is capped at 512 MB; this site uses a few MB.
- Atlas may pause a free cluster that receives no connections for about 60 days. Normal visits
  and admin logins count as connections. If it is ever paused, open the cluster in Atlas and
  click Resume.

**GitHub**: public repositories are free.

**What would cost money**

- A custom domain, roughly $10 to $15 a year from a domain registrar. Connecting it to Vercel
  is free. Steps are in the README under "Adding a custom domain later".
- Choosing to upgrade a plan.

These limits are stated from general knowledge of the providers' plans, not from a re-read of
their current terms on the date above. Check the pricing pages if a limit matters:
vercel.com/pricing and mongodb.com/pricing.

## Limits of this setup

- Each uploaded file (image or resume PDF) can be at most 4 MB.
- Rate limits on login and the contact form are approximate, because they are counted per
  running server instance.
- Contact form messages are stored in the database and shown in the admin panel. No email is
  sent when one arrives.

## Things still to do

- **Resume**: not uploaded yet. The original PDF shows a phone number and date of birth, which
  the site otherwise never publishes. Upload it (or a version without those details) under
  Admin, Resume, then Publish. Until then the Resume section and its download button are hidden.
- **Analytics**: switch on Web Analytics in the `pratik-bankar-portfolio` project in Vercel so
  visits are recorded. Google Analytics is optional: paste a measurement ID under Admin, Profile.

## If a provider ever changes its free plan

The code is in this repository and the database can be exported from Atlas, so the site can move
to another host. `render.yaml` is kept for running the API on Render if that becomes preferable.
