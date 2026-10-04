import { ArrowLeft, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/site/Footer';
import { Header } from '@/components/site/Header';
import { GoogleAnalytics } from '@/components/site/GoogleAnalytics';
import { GithubIcon } from '@/components/site/Icons';
import { RevealController } from '@/components/site/RevealController';
import { projectMetadata } from '@/lib/seo';
import { fileUrl, getSite, visibleSections } from '@/lib/site';

export const revalidate = 300;

export async function generateStaticParams() {
  const site = await getSite();
  return visibleSections(site).includes('projects') ? site.projects.map((p) => ({ slug: p.slug })) : [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const site = await getSite();
  const project = visibleSections(site).includes('projects') ? site.projects.find((p) => p.slug === slug) : undefined;
  return project ? projectMetadata(site, project) : { title: 'Project not found' };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const site = await getSite();
  const visible = visibleSections(site);
  const project = visible.includes('projects') ? site.projects.find((p) => p.slug === slug) : undefined;
  if (!project) notFound();

  return (
    <>
      <Header name={site.profile.name} sections={visible} base="/" />
      <main id="main" className="container-page flex-1 py-12 sm:py-16">
        <Link href="/#projects" className="inline-flex items-center gap-2 text-sm text-muted hover:text-accent">
          <ArrowLeft className="size-4" aria-hidden /> All projects
        </Link>

        <header className="mt-8 max-w-3xl">
          {project.role && <p className="eyebrow">{project.role}</p>}
          <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">{project.title}</h1>
          {project.subtitle && <p className="mt-3 text-xl text-accent">{project.subtitle}</p>}
          {project.description && (
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted">
              {project.description.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}
          {(project.githubUrl || project.liveUrl) && (
            <div className="mt-8 flex flex-wrap gap-3">
              {project.liveUrl && (
                <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  <ExternalLink className="size-4" aria-hidden /> Live demo
                </a>
              )}
              {project.githubUrl && (
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <GithubIcon className="size-4" /> View code
                </a>
              )}
            </div>
          )}
        </header>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          {project.highlights.length > 0 && (
            <section aria-labelledby="highlights">
              <h2 id="highlights" className="font-display text-2xl font-semibold">What I did</h2>
              <ul className="mt-5 space-y-4">
                {project.highlights.map((line, i) => (
                  <li key={i} className="flex gap-4">
                    <span aria-hidden className="mt-0.5 font-mono text-sm text-accent">{String(i + 1).padStart(2, '0')}</span>
                    <span className="text-muted">{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {project.technologies.length > 0 && (
            <section aria-labelledby="tech" className="card h-fit p-6">
              <h2 id="tech" className="font-display text-lg font-semibold">Technologies</h2>
              <ul className="mt-4 flex flex-wrap gap-2">
                {project.technologies.map((t) => <li key={t} className="chip">{t}</li>)}
              </ul>
            </section>
          )}
        </div>

        {project.imageFileIds.length > 0 && (
          <section aria-labelledby="screens" className="mt-14">
            <h2 id="screens" className="font-display text-2xl font-semibold">Screenshots</h2>
            <ul className="mt-6 grid gap-6 md:grid-cols-2">
              {project.imageFileIds.map((id, i) => (
                <li key={id} className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-line bg-surface">
                  <Image
                    src={fileUrl(id)}
                    alt={`${project.title} screenshot ${i + 1}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    className="object-cover"
                  />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <Footer site={site} />
      <RevealController />
      <GoogleAnalytics id={site.profile.gaMeasurementId} />
    </>
  );
}
