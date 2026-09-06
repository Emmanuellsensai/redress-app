import { motion, type MotionValue } from 'framer-motion';

/**
 * "AI judge" bubble that floats on the hero arc. Renders a bot avatar from
 * DiceBear, a name/role label, and a pulsing live ring. Takes MotionValues
 * from the parent's `useScroll` for smooth parallax drift as the user
 * scrolls — no re-render.
 */
export function AgentBubble({
  seed,
  name,
  role,
  x,
  y,
  delay = 0,
  gradient,
  driftX,
  driftY,
}: {
  seed: string;
  name: string;
  role: string;
  x: string;
  y: string;
  delay?: number;
  gradient: string;
  driftX?: MotionValue<number>;
  driftY?: MotionValue<number>;
}) {
  const bgHex = gradient.match(/#[0-9A-Fa-f]{6}/)?.[0]?.replace('#', '') ?? '0000FE';
  const avatarUrl = `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=${bgHex}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        x: driftX,
        y: driftY,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'none',
        zIndex: 3,
        willChange: 'transform',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          boxShadow: '0 14px 28px -14px rgba(0, 0, 254, 0.5)',
          border: '3px solid #FFFFFF',
        }}
      >
        <img
          src={avatarUrl}
          alt={`${name} avatar`}
          width={58}
          height={58}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <span
          style={{
            position: 'absolute',
            bottom: 2,
            right: 2,
            width: 13,
            height: 13,
            borderRadius: '50%',
            background: '#059669',
            border: '2px solid #FFFFFF',
            animation: 'redress-live 1.8s ease-out infinite',
          }}
        />
      </div>

      <div
        style={{
          background: 'rgba(255, 255, 255, 0.96)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          padding: '6px 12px',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 10px 18px -12px rgba(27, 14, 40, 0.18)',
        }}
      >
        <div
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            color: 'var(--color-ink)',
            letterSpacing: '-0.005em',
          }}
        >
          {name}
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--color-ink-muted)' }}>{role}</div>
      </div>

      <style>{`
        @keyframes redress-live {
          0%   { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0.55); }
          70%  { box-shadow: 0 0 0 9px rgba(5, 150, 105, 0); }
          100% { box-shadow: 0 0 0 0 rgba(5, 150, 105, 0); }
        }
      `}</style>
    </motion.div>
  );
}
