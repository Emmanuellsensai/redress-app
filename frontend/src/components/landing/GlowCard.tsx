import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTilt } from '../../hooks/useTilt';

/**
 * Card that tilts with the cursor and projects a realistic shadow
 * opposite to the tilt (via useTilt), plus a mouse-follow gradient glow
 * spotlight on top. The visible card element receives the tilt ref so
 * the shadow attaches to the correct silhouette.
 */
export function GlowCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const tiltRef = useTilt<HTMLDivElement>(6);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hover, setHover] = useState(false);
  const inner = useRef<HTMLDivElement | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      style={{ perspective: 1000 }}
    >
      <div
        ref={(node) => {
          tiltRef.current = node;
          inner.current = node;
        }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onMouseMove={(e) => {
          const el = inner.current;
          if (!el) return;
          const r = el.getBoundingClientRect();
          setPos({
            x: ((e.clientX - r.left) / r.width) * 100,
            y: ((e.clientY - r.top) / r.height) * 100,
          });
        }}
        style={{
          position: 'relative',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: 26,
          height: '100%',
          overflow: 'hidden',
          willChange: 'transform, box-shadow',
        }}
      >
        {/* mouse-follow glow */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(240px circle at ${pos.x}% ${pos.y}%, rgba(0, 0, 254, 0.14), transparent 55%)`,
            opacity: hover ? 1 : 0,
            transition: 'opacity 200ms ease',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative' }}>{children}</div>
      </div>
    </motion.div>
  );
}
