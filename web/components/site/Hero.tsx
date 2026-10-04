import { ArrowRight, Download, MapPin } from 'lucide-react';
import Image from 'next/image';
import { filePath, fileUrl } from '@/lib/site';
import type { SectionKey, SiteContent } from '@/lib/types';
import { SocialIcon } from './Icons';
import { Reveal } from './Reveal';

export function Hero({ site, visible }: { site: SiteContent; visible: SectionKey[] }) {
  const { profile, socialLinks } = site;
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
  const showResume = visible.includes('resume');

  return (
    <section id="top" className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 [background:radial-gradient(60rem_30rem_at_85%_-10%,var(--accent-soft),transparent_70%)]"
      />
      <div className="container-page grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.35fr_1fr] lg:py-28">
        <Reveal>
          {profile.jobTitle && <p className="eyebrow">{profile.jobTitle}</p>}
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {profile.name}
          </h1>
          {profile.tagline && <p className="mt-6 max-w-xl text-xl leading-snug text-ink sm:text-2xl">{profile.tagline}</p>}
          {profile.summary && <p className="mt-5 max-w-xl leading-relaxed text-muted">{profile.summary}</p>}

          {profile.location && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted">
              <MapPin className="size-4 text-accent" aria-hidden />
              {profile.location}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {visible.includes('projects') && (
              <a href="#projects" className="btn btn-primary">
                View Projects <ArrowRight className="size-4" aria-hidden />
              </a>
            )}
            {visible.includes('contact') && (
              <a href="#contact" className={`btn ${visible.includes('projects') ? 'btn-ghost' : 'btn-primary'}`}>
                Contact Me
              </a>
            )}
            {showResume && (
              <a href={filePath(profile.resumeFileId, true)} className="btn btn-ghost">
                <Download className="size-4" aria-hidden /> Download Resume
              </a>
            )}
          </div>

          {socialLinks.length > 0 && (
            <ul className="mt-8 flex flex-wrap items-center gap-2">
              {socialLinks.map((link) => (
                <li key={link._id}>
                  <a
                    href={link.url}
                    target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                    rel="noopener noreferrer"
                    aria-label={link.platform}
                    title={link.platform}
                    className="grid size-10 place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-accent hover:text-accent"
                  >
                    <SocialIcon platform={link.platform} className="size-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal delay={0.1} className="mx-auto w-full max-w-xs lg:max-w-sm">
          <div className="relative aspect-square">
            <div aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-[2rem] border border-accent/40" />
            <div className="relative size-full overflow-hidden rounded-[2rem] border border-line bg-surface">
              {profile.photoFileId ? (
                <Image
                  src={fileUrl(profile.photoFileId)}
                  alt={`Portrait of ${profile.name}`}
                  fill
                  priority
                  sizes="(min-width: 1024px) 24rem, 20rem"
                  className="object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center [background:linear-gradient(135deg,var(--accent-soft),var(--surface))]">
                  <span className="font-display text-7xl font-semibold tracking-tight text-accent" aria-hidden>
                    {initials}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
