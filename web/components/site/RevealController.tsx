'use client';

import { useEffect } from 'react';

/** Turns on scroll reveal animations for every `.reveal` element on the page. */
export function RevealController() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const root = document.documentElement;
    const items = [...document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)')];
    // Anything already on screen (or scrolled past) stays visible, so nothing flashes on load.
    const pending = items.filter((el) => {
      const onScreen = el.getBoundingClientRect().top < window.innerHeight;
      if (onScreen) el.classList.add('is-visible');
      return !onScreen;
    });
    root.classList.add('js-reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -60px 0px' },
    );
    pending.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      root.classList.remove('js-reveal');
    };
  }, []);

  return null;
}
