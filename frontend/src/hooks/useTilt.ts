import { useEffect, useRef } from 'react';

/**
 * Mouse-follow 3D tilt with a realistic projected shadow.
 *
 * When the card tilts, the shadow projects to the OPPOSITE side (a card
 * tilting toward the top-right casts its shadow to the bottom-left). This
 * sells the depth in a way a static shadow never does — the card actually
 * looks like it's lifting off the page toward the cursor.
 *
 * Respects `prefers-reduced-motion`: no tilt, no shadow tracking.
 */
export function useTilt<T extends HTMLElement>(max = 6) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let rafId = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let hovering = false;

    const apply = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;

      const rX = currentY.toFixed(2);
      const rY = currentX.toFixed(2);
      el.style.transform = `perspective(900px) rotateX(${rX}deg) rotateY(${rY}deg)`;

      // Project shadow opposite to the tilt direction. As tilt increases,
      // the shadow shifts further and softens.
      const magnitude = Math.min(1, Math.sqrt(currentX * currentX + currentY * currentY) / max);
      const shX = -currentX * 1.6;
      const shY = currentY * 1.6;
      const spread = 14 + magnitude * 22;
      const opacity = 0.14 + magnitude * 0.22;
      el.style.boxShadow = `${shX.toFixed(1)}px ${shY.toFixed(1)}px ${spread.toFixed(
        0,
      )}px -6px rgba(0, 0, 254, ${opacity.toFixed(3)}), 0 6px 14px -8px rgba(10, 10, 10, 0.18)`;

      const moving =
        Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05;
      if (moving) {
        rafId = requestAnimationFrame(apply);
      } else {
        rafId = 0;
      }
    };

    const onMove = (e: MouseEvent) => {
      hovering = true;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      targetX = (px - 0.5) * max * 2;
      targetY = -(py - 0.5) * max * 2;
      if (!rafId) rafId = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      hovering = false;
      targetX = 0;
      targetY = 0;
      if (!rafId) rafId = requestAnimationFrame(apply);
    };

    el.style.transformStyle = 'preserve-3d';
    el.style.transition = 'box-shadow 220ms ease-out, transform 120ms ease-out';
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      if (rafId) cancelAnimationFrame(rafId);
      el.style.transform = '';
      el.style.boxShadow = '';
    };
  }, [max]);

  return ref;
}
