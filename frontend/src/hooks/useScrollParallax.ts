import { useEffect, useState } from 'react';

/**
 * Reports vertical scroll position and the fraction of the way down the page,
 * updated on rAF. Used to drive the orbiting hero elements as the user
 * scrolls (rings rotate more, agent bubbles arc outward, cards depth-tilt).
 */
export function useScrollParallax() {
  const [y, setY] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return y;
}
