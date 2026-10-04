import type { SiteContent } from '@/lib/types';
import { SocialIcon } from './Icons';

export function Footer({ site }: { site: SiteContent }) {
  return (
    <footer className="border-t border-line py-8">
      <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
        <p>© {new Date().getFullYear()} {site.profile.name}</p>
        {site.socialLinks.length > 0 && (
          <ul className="flex items-center gap-4">
            {site.socialLinks.map((link) => (
              <li key={link._id}>
                <a
                  href={link.url}
                  target={link.url.startsWith('mailto:') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-accent"
                >
                  <SocialIcon platform={link.platform} className="size-4" /> {link.platform}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </footer>
  );
}
