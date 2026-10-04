import type { SiteContent } from '@/lib/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function About({ site }: { site: SiteContent }) {
  const paragraphs = site.profile.about.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const first = site.experiences.at(-1)?.startDate.slice(0, 4);
  const facts = [
    site.profile.location && { label: 'Based in', value: site.profile.location },
    site.experiences[0] && { label: 'Currently', value: `${site.experiences[0].role}, ${site.experiences[0].company}` },
    first && { label: 'Building for the web since', value: first },
  ].filter((f): f is { label: string; value: string } => Boolean(f));

  return (
    <Section id="about" eyebrow="About" title="A bit about me">
      <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        <Reveal className="space-y-5 text-lg leading-relaxed text-muted">
          {paragraphs.map((p, i) => (
            <p key={i} className={i === 0 ? 'text-ink' : undefined}>{p}</p>
          ))}
        </Reveal>
        {facts.length > 0 && (
          <Reveal delay={0.1}>
            <dl className="card divide-y divide-line">
              {facts.map((f) => (
                <div key={f.label} className="p-5">
                  <dt className="font-mono text-xs uppercase tracking-widest text-muted">{f.label}</dt>
                  <dd className="mt-1.5 font-medium">{f.value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        )}
      </div>
    </Section>
  );
}
