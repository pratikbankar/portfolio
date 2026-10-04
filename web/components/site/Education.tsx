import { GraduationCap } from 'lucide-react';
import type { SiteContent } from '@/lib/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

const year = (d: string | null) => (d ? d.slice(0, 4) : 'Present');

export function Education({ site }: { site: SiteContent }) {
  return (
    <Section id="education" eyebrow="Education" title="Education">
      <ul className="grid gap-4 lg:grid-cols-3">
        {site.education.map((e, i) => (
          <li key={e._id}>
            <Reveal delay={Math.min(i * 0.06, 0.2)}>
              <div className="card h-full p-6">
                <GraduationCap className="size-6 text-accent" aria-hidden />
                <h3 className="mt-4 font-display text-lg font-semibold leading-snug">{e.degree}</h3>
                {e.field && <p className="mt-1 text-accent">{e.field}</p>}
                <p className="mt-3 text-muted">{e.institution}</p>
                <p className="mt-1 text-sm text-muted">{[e.location, `${year(e.startDate)} to ${year(e.endDate)}`].filter(Boolean).join(' · ')}</p>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
