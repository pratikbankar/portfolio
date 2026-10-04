import { Trophy } from 'lucide-react';
import type { SiteContent } from '@/lib/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function Awards({ site }: { site: SiteContent }) {
  return (
    <Section id="awards" eyebrow="Awards" title="Awards & recognition">
      <ul className="grid gap-4 md:grid-cols-2">
        {site.awards.map((a, i) => (
          <li key={a._id}>
            <Reveal delay={Math.min(i * 0.06, 0.2)}>
              <div className="card relative h-full overflow-hidden p-6">
                <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-accent" />
                <div className="flex items-start gap-4">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                    <Trophy className="size-5" aria-hidden />
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{a.title}</h3>
                    <p className="mt-0.5 text-sm text-accent">{[a.issuer, a.year].filter(Boolean).join(' · ')}</p>
                    {a.description && <p className="mt-3 text-muted">{a.description}</p>}
                  </div>
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
