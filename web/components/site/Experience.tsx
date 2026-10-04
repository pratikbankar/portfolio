import { formatRange } from '@/lib/site';
import type { SiteContent } from '@/lib/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function Experience({ site }: { site: SiteContent }) {
  return (
    <Section id="experience" eyebrow="Experience" title="Where I have worked">
      <ol className="relative space-y-10 border-l border-line pl-6 sm:pl-10">
        {site.experiences.map((job) => (
          <li key={job._id} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[calc(1.5rem+5px)] top-2 size-2.5 rounded-full ring-4 ring-bg sm:-left-[calc(2.5rem+5px)] ${job.endDate ? 'bg-line' : 'bg-accent'}`}
            />
            <Reveal>
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-xl font-semibold">
                  {job.role} <span className="text-muted">at</span> {job.company}
                </h3>
                <p className="font-mono text-xs uppercase tracking-wider text-muted">{formatRange(job.startDate, job.endDate)}</p>
              </div>
              {job.location && <p className="mt-1 text-sm text-muted">{job.location}</p>}

              {job.responsibilities.length > 0 && (
                <ul className="mt-4 space-y-2 text-muted">
                  {job.responsibilities.map((line, i) => (
                    <li key={i} className="flex gap-3">
                      <span aria-hidden className="mt-2.5 size-1 shrink-0 rounded-full bg-muted" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}

              {job.achievements.length > 0 && (
                <div className="mt-5 rounded-xl border border-line bg-accent-soft/50 p-4">
                  <p className="font-mono text-xs uppercase tracking-widest text-accent">Key achievements</p>
                  <ul className="mt-2 space-y-1.5">
                    {job.achievements.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
