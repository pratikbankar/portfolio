import { ArrowUpRight, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { fileUrl } from '@/lib/site';
import type { Project, SiteContent } from '@/lib/types';
import { GithubIcon } from './Icons';
import { Reveal } from './Reveal';
import { Section } from './Section';

function ProjectCard({ project, preview }: { project: Project; preview: boolean }) {
  const cover = project.imageFileIds[0];
  const tech = project.technologies.slice(0, 7);
  const more = project.technologies.length - tech.length;
  const title = <h3 className="font-display text-xl font-semibold">{project.title}</h3>;

  return (
    <article className="card group flex h-full flex-col overflow-hidden">
      <div className="relative aspect-[16/9] border-b border-line bg-bg">
        {cover ? (
          <Image
            src={fileUrl(cover)}
            alt={`Screenshot of ${project.title}`}
            fill
            sizes="(min-width: 1024px) 34rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center [background:linear-gradient(135deg,var(--accent-soft),var(--surface))]">
            <span aria-hidden className="font-display text-4xl font-semibold tracking-tight text-accent">{project.title}</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        {/* Draft projects have no public page yet, so the preview does not link to one. */}
        {preview ? title : (
          <Link href={`/projects/${project.slug}`} className="transition-colors hover:text-accent">{title}</Link>
        )}
        {project.subtitle && <p className="mt-1 text-sm text-accent">{project.subtitle}</p>}
        {project.description && <p className="mt-3 line-clamp-3 text-muted">{project.description}</p>}

        {tech.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {tech.map((t) => <li key={t} className="chip">{t}</li>)}
            {more > 0 && <li className="chip text-muted">+{more} more</li>}
          </ul>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 pt-6 text-sm font-medium">
          {!preview && (
            <Link href={`/projects/${project.slug}`} className="inline-flex items-center gap-1 text-accent hover:underline">
              Project details <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
              <GithubIcon className="size-4" /> Code
            </a>
          )}
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-muted hover:text-ink">
              <ExternalLink className="size-4" aria-hidden /> Live demo
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

export function Projects({ site, preview }: { site: SiteContent; preview: boolean }) {
  const single = site.projects.length === 1;
  return (
    <Section id="projects" eyebrow="Projects" title="Selected work">
      <div className={`grid gap-6 ${single ? 'max-w-2xl' : 'md:grid-cols-2'}`}>
        {site.projects.map((project, i) => (
          <Reveal key={project._id} delay={Math.min(i * 0.06, 0.24)}>
            <ProjectCard project={project} preview={preview} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
