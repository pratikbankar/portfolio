import { visibleSections } from '@/lib/site';
import type { SiteContent } from '@/lib/types';
import { About } from './About';
import { Awards } from './Awards';
import { Certifications } from './Certifications';
import { Contact } from './Contact';
import { Education } from './Education';
import { Experience } from './Experience';
import { Footer } from './Footer';
import { Header } from './Header';
import { Hero } from './Hero';
import { Projects } from './Projects';
import { Resume } from './Resume';
import { RevealController } from './RevealController';
import { Skills } from './Skills';

/**
 * The whole public page. The home page renders it with published content and the admin
 * preview renders it with the draft, so the preview is exactly what will be published.
 */
export function SiteView({ content, preview = false }: { content: SiteContent; preview?: boolean }) {
  const visible = visibleSections(content);
  const show = (key: (typeof visible)[number]) => visible.includes(key);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        Skip to content
      </a>
      <Header name={content.profile.name} sections={visible} />
      <main id="main">
        <Hero site={content} visible={visible} />
        {show('about') && <About site={content} />}
        {show('skills') && <Skills site={content} />}
        {show('experience') && <Experience site={content} />}
        {show('projects') && <Projects site={content} preview={preview} />}
        {show('education') && <Education site={content} />}
        {show('certifications') && <Certifications site={content} />}
        {show('awards') && <Awards site={content} />}
        {show('resume') && <Resume site={content} />}
        {show('contact') && <Contact site={content} preview={preview} />}
      </main>
      <Footer site={content} />
      {/* The preview renders after load, so it skips the animation and shows everything at once. */}
      {!preview && <RevealController />}
    </>
  );
}
