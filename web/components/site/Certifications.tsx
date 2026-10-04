import { BadgeCheck, Clock } from 'lucide-react';
import type { SiteContent } from '@/lib/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function Certifications({ site }: { site: SiteContent }) {
  return (
    <Section id="certifications" eyebrow="Certifications" title="Certifications & training">
      <ul className="grid gap-4 sm:grid-cols-2">
        {site.certifications.map((c, i) => {
          const done = c.status === 'completed';
          const name = c.url ? (
            <a href={c.url} target="_blank" rel="noopener noreferrer" className="hover:text-accent hover:underline">{c.name}</a>
          ) : c.name;
          return (
            <li key={c._id}>
              <Reveal delay={Math.min(i * 0.05, 0.2)}>
                <div className="card flex h-full items-start gap-4 p-5">
                  {done
                    ? <BadgeCheck className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
                    : <Clock className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />}
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium">{name}</h3>
                    <p className="mt-1 text-sm text-muted">{[c.issuer, c.year].filter(Boolean).join(' · ')}</p>
                  </div>
                  <span className={`chip shrink-0 ${done ? 'border-accent/40 text-accent' : 'text-muted'}`}>
                    {done ? 'Completed' : 'In progress'}
                  </span>
                </div>
              </Reveal>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}
