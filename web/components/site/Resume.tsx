import { Download, Eye, FileText } from 'lucide-react';
import { filePath } from '@/lib/site';
import type { SiteContent } from '@/lib/types';
import { Reveal } from './Reveal';
import { Section } from './Section';

export function Resume({ site }: { site: SiteContent }) {
  const id = site.profile.resumeFileId;
  return (
    <Section id="resume" eyebrow="Resume" title="Resume">
      <Reveal>
        <div className="card flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-accent-soft text-accent">
            <FileText className="size-6" aria-hidden />
          </span>
          <div className="flex-1">
            <h3 className="font-display text-xl font-semibold">My latest resume</h3>
            <p className="mt-1 text-muted">The full picture of my experience, skills and education, as a PDF.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href={filePath(id)} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
              <Eye className="size-4" aria-hidden /> View
            </a>
            <a href={filePath(id, true)} className="btn btn-primary">
              <Download className="size-4" aria-hidden /> Download
            </a>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
