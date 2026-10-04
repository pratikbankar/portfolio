import type { SiteContent, Skill } from '@/lib/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

/** Groups skills by category, keeping the order the admin set. */
function byCategory(skills: Skill[]): Array<[string, Skill[]]> {
  const groups = new Map<string, Skill[]>();
  for (const skill of skills) groups.set(skill.category, [...(groups.get(skill.category) ?? []), skill]);
  return [...groups];
}

export function Skills({ site }: { site: SiteContent }) {
  return (
    <Section id="skills" eyebrow="Skills" title="Skills & technologies" intro="The tools I reach for most, grouped by where they sit in the stack.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {byCategory(site.skills).map(([category, items], i) => (
          <Reveal key={category} delay={Math.min(i * 0.05, 0.25)}>
            <div className="card h-full p-6">
              <h3 className="font-display text-lg font-semibold">{category}</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {items.map((s) => (
                  <li key={s._id} className="chip">{s.name}</li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
