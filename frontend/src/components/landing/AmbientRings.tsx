import { motion, type MotionValue } from 'framer-motion';

/**
 * Centered concentric ring backdrop. Takes MotionValues from the parent's
 * `useScroll` so the outer rotation and scale respond frame-perfectly to
 * scroll progress inside the hero — no re-render, no jank.
 */
export function AmbientRings({
  rot,
  scale,
}: {
  rot: MotionValue<number>;
  scale: MotionValue<number>;
}) {
  const ring = 'rgba(0, 0, 254, 0.08)';
  const ringStrong = 'rgba(71, 71, 255, 0.18)';

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      <motion.div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          x: '-50%',
          y: '-50%',
          rotate: rot,
          scale,
          width: 1100,
          height: 1100,
          transformOrigin: 'center',
          willChange: 'transform',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            animation: 'redress-slow-orbit 140s linear infinite',
            transformOrigin: 'center',
          }}
        >
          <svg viewBox="0 0 1100 1100" width="1100" height="1100">
            {[110, 170, 230, 290, 355, 420, 490, 555].map((r, i) => (
              <circle
                key={r}
                cx="550"
                cy="550"
                r={r}
                fill="none"
                stroke={i % 2 === 0 ? ring : ringStrong}
                strokeWidth={i === 3 || i === 6 ? 1.4 : 0.9}
                strokeDasharray={i % 3 === 0 ? '3 7' : undefined}
              />
            ))}
            <circle cx="550" cy={550 - 355} r="4" fill="rgba(0, 0, 254, 0.7)" />
            <circle cx={550 + 420} cy="550" r="3" fill="rgba(71, 71, 255, 0.65)" />
            <circle cx="550" cy={550 + 490} r="4" fill="rgba(109, 94, 255, 0.7)" />
            <circle cx={550 - 290} cy="550" r="3" fill="rgba(0, 0, 204, 0.7)" />
          </svg>
        </div>
      </motion.div>

      {/* soft warm center wash */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 780,
          height: 780,
          borderRadius: '50%',
          background:
            'radial-gradient(closest-side, rgba(238, 238, 255, 0.9), rgba(238, 238, 255, 0) 70%)',
          filter: 'blur(20px)',
        }}
      />

      <style>{`
        @keyframes redress-slow-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
