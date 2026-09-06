import { FileCode, Lock, Sparkles, Zap, Wallet, type LucideIcon } from 'lucide-react';
import { MidnightLogo } from '../ui/MidnightLogo';

/**
 * Continuous horizontal marquee for the tech stack band.
 *
 * The trick for a seamless loop: render the items twice back-to-back in a
 * flex row and animate `translateX(0) → translateX(-50%)`. Because the
 * second copy is identical, the moment the first copy has scrolled its
 * full width, the second copy sits in the exact position the first copy
 * started in — so the loop never has a visible seam.
 *
 * Pauses on hover so a viewer can read the stack.
 */
export function TechStripe() {
  const items: { label: string; Icon?: LucideIcon; custom?: React.ReactNode }[] = [
    { label: 'Cardano', custom: <CardanoGlyph /> },
    { label: 'Midnight', custom: <MidnightGlyph /> },
    { label: 'Compact', Icon: FileCode },
    { label: 'nacl.box', Icon: Lock },
    { label: 'Gemini 3.6', Icon: Sparkles },
    { label: 'Groq · Llama', Icon: Zap },
    { label: 'Midnight wallets', Icon: Wallet },
  ];

  const row = (keyPrefix: string) =>
    items.map(({ label, Icon, custom }) => (
      <div
        key={`${keyPrefix}-${label}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 32px',
          opacity: 0.98,
          whiteSpace: 'nowrap',
          borderRight: '1px solid rgba(255, 255, 255, 0.16)',
        }}
      >
        <span
          aria-hidden
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.22)',
            border: '1px solid rgba(255, 255, 255, 0.35)',
            color: '#FFFFFF',
          }}
        >
          {custom ?? (Icon ? <Icon size={15} strokeWidth={1.75} /> : null)}
        </span>
        {label}
      </div>
    ));

  return (
    <div
      style={{
        background: 'var(--grad-tech-stripe)',
        padding: '22px 0',
        color: '#FFFFFF',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)',
        fontSize: 15,
        fontWeight: 600,
        letterSpacing: '0.005em',
        position: 'relative',
      }}
      className="redress-marquee-host"
    >
      {/* soft edge fades so items appear to emerge/dissolve at the sides */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 80,
          background: 'linear-gradient(90deg, rgba(0, 0, 166, 0.7), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: 0,
          width: 80,
          background: 'linear-gradient(270deg, rgba(71, 71, 255, 0.7), transparent)',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          display: 'flex',
          width: 'max-content',
          animation: 'redress-marquee 30s linear infinite',
        }}
      >
        {row('a')}
        {row('b')}
      </div>

      <style>{`
        @keyframes redress-marquee {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        .redress-marquee-host:hover > div:last-of-type {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}

function CardanoGlyph() {
  const points = [
    [12, 3.5], [19.5, 8], [19.5, 16], [12, 20.5], [4.5, 16], [4.5, 8],
  ];
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.6} />
      ))}
      <circle cx={12} cy={12} r={1.4} />
    </svg>
  );
}

function MidnightGlyph() {
  return <MidnightLogo size={16} />;
}
