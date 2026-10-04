'use client';

import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { SECTION_LABELS } from '@/lib/site';
import type { SectionKey } from '@/lib/types';
import { ThemeToggle } from './ThemeToggle';

interface Props {
  name: string;
  sections: SectionKey[];
  /** '' on the home page; '/' elsewhere so the links lead back to the home page sections. */
  base?: string;
}

export function Header({ name, sections, base = '' }: Props) {
  const [open, setOpen] = useState(false);
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <a href={`${base}#top`} className="flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-accent font-mono text-xs font-bold text-accent-ink">
            {initials || 'PB'}
          </span>
          <span className="max-[380px]:hidden">{name}</span>
        </a>

        <nav aria-label="Sections" className="hidden items-center gap-1 lg:flex">
          {sections.map((key) => (
            <a
              key={key}
              href={`${base}#${key}`}
              className="rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-ink"
            >
              {SECTION_LABELS[key]}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {sections.length > 0 && (
            <button
              type="button"
              className="grid size-10 place-items-center rounded-full border border-line bg-surface lg:hidden"
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X className="size-[18px]" aria-hidden /> : <Menu className="size-[18px]" aria-hidden />}
            </button>
          )}
        </div>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Sections" className="border-t border-line bg-bg lg:hidden">
          <div className="container-page grid grid-cols-2 gap-1 py-3 sm:grid-cols-3">
            {sections.map((key) => (
              <a
                key={key}
                href={`${base}#${key}`}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-ink hover:bg-surface"
              >
                {SECTION_LABELS[key]}
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
