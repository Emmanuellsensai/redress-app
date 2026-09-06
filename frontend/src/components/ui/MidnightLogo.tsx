/**
 * Midnight Network glyph, corrected to match the actual mark:
 *   - Solid filled outer disk
 *   - An inset "bezel" ring (a darker shade of the disk)
 *   - Three stacked capsule-shaped dashes inside, in the same darker shade
 *
 * The darker inner details are painted with a semi-opaque black overlay so
 * the glyph works on any currentColor background (blue nav pill, dark
 * pill, tech-stripe circles). Reference:
 * https://midnight.network/brand-hub
 */
export function MidnightLogo({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const inner = 'rgba(0, 0, 0, 0.45)';
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-label="Midnight Network"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer solid disk */}
      <circle cx="12" cy="12" r="11" fill="currentColor" />
      {/* Bezel ring */}
      <circle cx="12" cy="12" r="8.5" fill="none" stroke={inner} strokeWidth="1.3" />
      {/* Three stacked capsule dashes */}
      <rect x="10.9" y="6.6" width="2.2" height="3" rx="1.1" fill={inner} />
      <rect x="10.9" y="10.5" width="2.2" height="3" rx="1.1" fill={inner} />
      <rect x="10.9" y="14.4" width="2.2" height="3" rx="1.1" fill={inner} />
    </svg>
  );
}
