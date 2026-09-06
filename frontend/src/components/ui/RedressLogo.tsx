/**
 * Redress brand mark v2 — fuses the two identities Emmanuel has for
 * Redress: the blue circular target/seal from the AKINDO submission, and
 * the shield-with-verdict-check from Redress Labs. The result is a
 * layered, gently 3D shield rendered entirely in SVG:
 *
 *  - Outer seal ring (target motif from the AKINDO icon)
 *  - Shield body with a blue gradient (top-highlight to bottom-shadow)
 *  - Bold "R" mark in the shield's negative space
 *  - Small verdict checkmark badge in the upper right corner
 *
 * The 3D feel comes from a linear gradient + top-inner highlight arc +
 * SVG drop shadow filter. Nothing rasterized — scales cleanly to any
 * size, from favicon to hero.
 */
export function RedressLogo({
  size = 32,
  className,
  variant = 'full',
}: {
  size?: number;
  className?: string;
  /** `full`: shield + seal ring + verdict badge. `mono`: same paths as a
   *  single currentColor stroke, best for nav or tight spaces. */
  variant?: 'full' | 'mono';
}) {
  if (variant === 'mono') return <RedressMono size={size} className={className} />;
  const gradId = 'redress-shield-grad';
  const highlightId = 'redress-shield-highlight';
  const shadowId = 'redress-shield-shadow';
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      aria-label="Redress"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#4747FF" />
          <stop offset="55%" stopColor="#0000FE" />
          <stop offset="100%" stopColor="#0000A6" />
        </linearGradient>
        <linearGradient id={highlightId} x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
        <filter id={shadowId} x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.4" floodColor="#0000FE" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Outer seal ring — target motif from the AKINDO mark */}
      <circle cx="32" cy="32" r="30" fill="none" stroke="#4747FF" strokeWidth="1.5" opacity="0.35" />
      <circle cx="32" cy="32" r="27" fill="none" stroke="#4747FF" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 3" />

      {/* Shield body */}
      <path
        d="M32 8 L52 16 L52 32 Q52 46 32 58 Q12 46 12 32 L12 16 Z"
        fill={`url(#${gradId})`}
        filter={`url(#${shadowId})`}
      />

      {/* Top glossy highlight — read as 3D dome */}
      <path
        d="M32 8 L52 16 L52 24 Q42 30 32 30 Q22 30 12 24 L12 16 Z"
        fill={`url(#${highlightId})`}
      />

      {/* Letter R in the shield's negative space */}
      <g fill="none" stroke="#FFFFFF" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M24 22 V44" />
        <path d="M24 22 H33 A6 6 0 0 1 33 34 H24" />
        <path d="M31 34 L40 44" />
      </g>

      {/* Verdict badge (cream ring + blue check) — the "shield with checkmark"
          from the Redress Labs mark, refactored into a corner accent */}
      <g transform="translate(46 14)">
        <circle cx="0" cy="0" r="7" fill="#FFFFFF" />
        <circle cx="0" cy="0" r="7" fill="none" stroke="#0000A6" strokeWidth="0.8" opacity="0.4" />
        <path
          d="M-3 0 L-0.8 2.4 L3 -2"
          fill="none"
          stroke="#0000FE"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** Mono-color variant — no gradients or shadows, one currentColor line
 *  drawing. For nav bars and any place a filled mark would be too heavy. */
function RedressMono({ size = 26, className }: { size?: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label="Redress"
    >
      {/* Shield outline */}
      <path d="M32 8 L52 16 L52 32 Q52 46 32 58 Q12 46 12 32 L12 16 Z" />
      {/* R letterform */}
      <path d="M24 22 V44" />
      <path d="M24 22 H33 A6 6 0 0 1 33 34 H24" />
      <path d="M31 34 L40 44" />
      {/* Verdict dot */}
      <circle cx="46" cy="14" r="3" fill="currentColor" stroke="none" />
    </svg>
  );
}
