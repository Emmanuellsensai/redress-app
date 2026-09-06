import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTilt } from '../../hooks/useTilt';
import { Lock, Cpu, CheckCircle2 } from 'lucide-react';

/**
 * Live "encrypted claim in transit" card. Cycles through three stages:
 *   0 sealing → 1 hashing → 2 verdict
 * Text labels use Plus Jakarta Sans; hash values stay in the mono font.
 * A small customer avatar in the header grounds the card as belonging to
 * a specific (illustrated) person.
 */
export function ClaimMockup() {
  const ref = useTilt<HTMLDivElement>(6);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = setInterval(() => setStage((s) => (s + 1) % 3), 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      style={{ perspective: 1200, position: 'relative' }}
    >
      <div
        ref={ref}
        style={{
          position: 'relative',
          background:
            'linear-gradient(180deg, rgba(238, 238, 255, 0.98) 0%, rgba(220, 220, 255, 0.9) 100%)',
          border: '1px solid rgba(0, 0, 254, 0.28)',
          borderRadius: 18,
          padding: 22,
          boxShadow:
            '0 30px 60px -30px rgba(10, 10, 10, 0.35), 0 8px 24px -12px rgba(0, 0, 254, 0.22)',
          willChange: 'transform',
          fontFamily: 'var(--font-body)',
        }}
      >
        {/* gradient border shimmer */}
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 18,
            padding: 1,
            background:
              'linear-gradient(120deg, rgba(0, 0, 254, 0.6), rgba(0, 0, 254, 0) 40%, rgba(109, 94, 255, 0.55) 90%)',
            WebkitMask:
              'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
            pointerEvents: 'none',
          }}
        />

        {/* Header with customer avatar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px solid rgba(0, 0, 254, 0.18)',
          }}
        >
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <img
              src="https://api.dicebear.com/9.x/personas/svg?seed=jane-2026&backgroundColor=eeeeff"
              alt="claimant avatar"
              width={32}
              height={32}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 4px 8px -4px rgba(0, 0, 0, 0.2)',
              }}
              loading="lazy"
            />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-ink)' }}>
                Jane's claim
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-ink-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <PulsingDot /> live claim
              </div>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)' }}>
            #0x{stage.toString(16).padStart(3, '0')}f9
          </span>
        </div>

        <Step
          active={stage === 0}
          done={stage > 0}
          icon={<Lock size={14} strokeWidth={1.75} />}
          label="Envelope"
          value="7d3f 9a2c c1e8 b420 …"
          note="ephemeral · one-time"
        />

        <Connector active={stage >= 1} />

        <Step
          active={stage === 1}
          done={stage > 1}
          icon={<Cpu size={14} strokeWidth={1.75} />}
          label="Evidence hash"
          value="0x9b2e a17f 3d55 c084 …"
          note="in-circuit persistentHash"
          mono
        />

        <Connector active={stage >= 2} />

        <Step
          active={stage === 2}
          done={false}
          icon={<CheckCircle2 size={14} strokeWidth={1.75} />}
          label="AI verdict"
          value="APPROVED · 0.92"
          note="reasoning stays private"
          accent
        />
      </div>
    </motion.div>
  );
}

function PulsingDot() {
  return (
    <span
      style={{
        position: 'relative',
        width: 6,
        height: 6,
        display: 'inline-block',
      }}
    >
      <span
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'var(--color-success)',
        }}
      />
      <span
        aria-hidden
        style={{
          position: 'absolute',
          inset: -3,
          borderRadius: '50%',
          background: 'rgba(45, 106, 79, 0.35)',
          animation: 'redress-pulse 1.8s ease-out infinite',
        }}
      />
      <style>{`
        @keyframes redress-pulse {
          0%   { transform: scale(0.6); opacity: 0.8; }
          80%  { transform: scale(1.7); opacity: 0; }
          100% { transform: scale(1.7); opacity: 0; }
        }
      `}</style>
    </span>
  );
}

function Connector({ active }: { active: boolean }) {
  return (
    <div
      style={{
        margin: '4px 0',
        height: 18,
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 2,
          height: '100%',
          background: active
            ? 'linear-gradient(180deg, #0000FE, #4747FF)'
            : 'rgba(0, 0, 254, 0.22)',
          transition: 'background 400ms ease',
          borderRadius: 2,
        }}
      />
    </div>
  );
}

function Step({
  active,
  done,
  icon,
  label,
  value,
  note,
  mono,
  accent,
}: {
  active: boolean;
  done: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
  note: string;
  mono?: boolean;
  accent?: boolean;
}) {
  const highlight = active || accent;
  return (
    <div
      style={{
        background: highlight ? 'rgba(238, 238, 255, 0.95)' : 'rgba(255, 255, 255, 0.8)',
        border: `1px solid ${
          active ? 'rgba(0, 0, 254, 0.55)' : 'rgba(0, 0, 254, 0.12)'
        }`,
        borderRadius: 10,
        padding: '11px 14px',
        boxShadow: active
          ? '0 8px 24px -12px rgba(0, 0, 254, 0.55)'
          : 'none',
        transition: 'border-color 300ms ease, background 300ms ease, box-shadow 300ms ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-ink-muted)',
          marginBottom: 6,
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {icon}
          {label}
        </span>
        {done && (
          <span
            style={{
              color: 'var(--color-success)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            ✓ done
          </span>
        )}
        {active && (
          <span
            style={{
              color: 'var(--color-accent-2)',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            working…
          </span>
        )}
      </div>
      <div
        style={{
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-body)',
          fontSize: accent ? 15 : 13,
          fontWeight: accent ? 700 : 500,
          color: accent ? 'var(--color-success)' : 'var(--color-ink)',
          marginBottom: 3,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{note}</div>
    </div>
  );
}
