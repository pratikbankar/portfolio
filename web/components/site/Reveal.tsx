import type { CSSProperties, ReactNode } from 'react';

/**
 * Marks content to fade up as it scrolls into view. On its own this renders fully visible
 * content; RevealController adds the animation once JavaScript is running, so the page is
 * never blank for visitors, crawlers or link previews that do not run the script.
 */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <div className={`reveal ${className ?? ''}`} style={{ '--reveal-delay': `${delay}s` } as CSSProperties}>
      {children}
    </div>
  );
}
