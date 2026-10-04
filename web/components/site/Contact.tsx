import { Mail, MapPin } from 'lucide-react';
import type { SiteContent } from '@/lib/types';
import { ContactForm } from './ContactForm';
import { SocialIcon } from './Icons';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function Contact({ site, preview }: { site: SiteContent; preview: boolean }) {
  const { profile, socialLinks } = site;
  const links = socialLinks.filter((l) => !l.url.startsWith('mailto:'));
  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title="Let's talk"
      intro="Have a role, a project or a question? Send a message and I will get back to you."
    >
      <div className="grid gap-8 lg:grid-cols-[1fr_1.5fr]">
        <Reveal>
          <ul className="space-y-4">
            {profile.email && (
              <li className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><Mail className="size-[18px]" aria-hidden /></span>
                <a href={`mailto:${profile.email}`} className="break-all font-medium hover:text-accent">{profile.email}</a>
              </li>
            )}
            {profile.location && (
              <li className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><MapPin className="size-[18px]" aria-hidden /></span>
                <span>{profile.location}</span>
              </li>
            )}
            {links.map((link) => (
              <li key={link._id} className="flex items-center gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent-soft text-accent"><SocialIcon platform={link.platform} className="size-[18px]" /></span>
                <a href={link.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-accent">{link.platform}</a>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1}>
          <ContactForm disabled={preview} fallbackEmail={profile.email || undefined} />
        </Reveal>
      </div>
    </Section>
  );
}
