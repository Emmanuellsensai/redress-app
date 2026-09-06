import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ShieldCheck,
  Cpu,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { MidnightLogo } from '../components/ui/MidnightLogo';
import { ClaimMockup } from '../components/landing/ClaimMockup';
import { AmbientRings } from '../components/landing/AmbientRings';
import { AgentBubble } from '../components/landing/AgentBubble';
import { GlowCard } from '../components/landing/GlowCard';
import { TechStripe } from '../components/landing/TechStripe';
import { useCountUp } from '../hooks/useCountUp';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.6, ease: 'easeOut' as const },
};

/* Midnight-family gradients for the AI-judge avatars — variations of the
   Midnight brand blue with subtle indigo shifts so each bubble reads as
   distinct while staying inside the ecosystem palette. */
const g1 = 'linear-gradient(135deg, #0000FE 0%, #4747FF 100%)';
const g2 = 'linear-gradient(135deg, #6D5EFF 0%, #0000FE 100%)';
const g3 = 'linear-gradient(135deg, #0000CC 0%, #000066 100%)';
const g4 = 'linear-gradient(135deg, #4747FF 0%, #7A6DFF 100%)';

export default function Landing() {
  const heroRef = useRef<HTMLElement | null>(null);
  // Scroll progress across the hero. 0 at top of hero, 1 when the hero has
  // fully scrolled past. Framer's `useScroll` returns a MotionValue, so
  // downstream transforms don't cause React re-renders.
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  // Cinematic unveiling layers. Different rates → parallax depth as the
  // user scrolls, so the initial descent reveals the world instead of just
  // scrolling flat page content.
  const headlineY = useTransform(heroProgress, [0, 1], [0, -260]);
  const headlineScale = useTransform(heroProgress, [0, 1], [1, 0.86]);
  const headlineOpacity = useTransform(heroProgress, [0, 0.75], [1, 0]);

  const subheadY = useTransform(heroProgress, [0, 1], [0, -180]);
  const subheadOpacity = useTransform(heroProgress, [0, 0.6], [1, 0]);

  const ctaY = useTransform(heroProgress, [0, 1], [0, -120]);
  const ctaOpacity = useTransform(heroProgress, [0, 0.55], [1, 0]);

  const ringsRot = useTransform(heroProgress, [0, 1], [0, 90]);
  const ringsScale = useTransform(heroProgress, [0, 1], [1, 1.4]);

  const agentDrift = useTransform(heroProgress, [0, 1], [0, 220]);
  const agentDriftInverse = useTransform(heroProgress, [0, 1], [0, -220]);
  const agentBob = useTransform(heroProgress, [0, 1], [0, 60]);

  return (
    <main>
      {/* ─────────── HERO ─────────── */}
      <section
        ref={heroRef}
        style={{
          position: 'relative',
          minHeight: 780,
          padding: '96px 0 120px',
          overflow: 'hidden',
          background:
            'radial-gradient(1100px 700px at 50% 30%, rgba(238, 238, 255, 0.95), transparent 65%), var(--color-surface)',
          perspective: 1400,
        }}
      >
        <AmbientRings rot={ringsRot} scale={ringsScale} />

        {/* Agent avatars — three orbit clockwise, three counter, each on its
            own vertical rate so the hero feels like a rotating scene. */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2 }}>
          <AgentBubble
            seed="adjudicator-scale"
            name="Adjudicator"
            role="verdict engine"
            x="6%"
            y="120px"
            gradient={g1}
            delay={0.15}
            driftX={agentDrift}
            driftY={agentBob}
          />
          <AgentBubble
            seed="fraud-analyst-brain"
            name="Fraud analyst"
            role="Gemini 3.6"
            x="82%"
            y="90px"
            gradient={g2}
            delay={0.22}
            driftX={agentDriftInverse}
            driftY={agentBob}
          />
          <AgentBubble
            seed="kyc-reviewer-print"
            name="KYC reviewer"
            role="pattern check"
            x="2%"
            y="360px"
            gradient={g3}
            delay={0.3}
            driftX={agentDrift}
            driftY={agentDriftInverse}
          />
          <AgentBubble
            seed="refund-clerk-fast"
            name="Refund clerk"
            role="Groq Llama"
            x="80%"
            y="380px"
            gradient={g2}
            delay={0.36}
            driftX={agentDriftInverse}
            driftY={agentDrift}
          />
          <AgentBubble
            seed="appeals-judge-gavel"
            name="Appeals judge"
            role="escalation"
            x="10%"
            y="600px"
            gradient={g4}
            delay={0.42}
            driftX={agentDrift}
            driftY={agentBob}
          />
          <AgentBubble
            seed="auditor-eye"
            name="Auditor"
            role="regulator view"
            x="72%"
            y="620px"
            gradient={g1}
            delay={0.48}
            driftX={agentDriftInverse}
            driftY={agentBob}
          />
        </div>

        {/* Center content, parallax-layered */}
        <div
          className="container"
          style={{
            position: 'relative',
            zIndex: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              y: headlineY,
              scale: headlineScale,
              opacity: headlineOpacity,
              fontSize: 'clamp(42px, 5.6vw, 70px)',
              letterSpacing: '-0.025em',
              lineHeight: 1.05,
              maxWidth: 820,
              margin: '0 auto 6px',
              color: 'var(--color-ink)',
              willChange: 'transform, opacity',
            }}
          >
            A panel of AI judges for the claims your app receives.
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.65, delay: 0.35, ease: 'easeOut' }}
            style={{
              width: 220,
              height: 5,
              margin: '22px auto 26px',
              background: 'var(--grad-accent)',
              borderRadius: 999,
              transformOrigin: 'center',
            }}
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
            style={{
              y: subheadY,
              opacity: subheadOpacity,
              fontSize: 17,
              lineHeight: 1.6,
              color: 'var(--color-ink-muted)',
              maxWidth: 640,
              margin: '0 auto 32px',
              willChange: 'transform, opacity',
            }}
          >
            Every fraud report, refund request, chargeback, KYC exception, and account appeal is
            encrypted in the claimant's browser, adjudicated by an AI panel off-chain, and
            committed to Midnight as a hash you can audit but never expose.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.24, ease: 'easeOut' }}
            style={{
              y: ctaY,
              opacity: ctaOpacity,
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              justifyContent: 'center',
              willChange: 'transform, opacity',
            }}
          >
            <Link to="/submit" style={{ textDecoration: 'none' }}>
              <Button size="lg" trailing={<ArrowRight size={16} strokeWidth={1.75} />}>
                Get started
              </Button>
            </Link>
            <Link to="/dashboard" style={{ textDecoration: 'none' }}>
              <Button size="lg" variant="ghost">
                Platform dashboard
              </Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            style={{
              marginTop: 30,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 14px',
              borderRadius: 999,
              background: 'var(--color-ink)',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 500,
              boxShadow: '0 10px 24px -14px rgba(0, 0, 0, 0.35)',
            }}
          >
            <MidnightLogo size={16} />
            Live on Midnight Preprod
          </motion.div>
        </div>

        {/* Scroll hint */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--color-ink-muted)',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            zIndex: 4,
          }}
        >
          Scroll to reveal
        </motion.div>
      </section>

      {/* ─────────── TECH STRIPE ─────────── */}
      <TechStripe />

      {/* ─────────── STATS ─────────── */}
      <section style={{ padding: '80px 0 60px', background: 'var(--color-surface)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: 8,
            }}
          >
            {[
              { to: 256, label: 'byte witness', note: 'padded evidence' },
              { to: 3, prefix: '< ', suffix: 's', label: 'verdict latency', note: 'Gemini + Groq' },
              { customValue: 'SHA-256', label: 'audit hash', note: 'browser-verifiable' },
              { to: 0, label: 'plaintext on-chain', note: 'commitments only' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              >
                <StatTile {...s} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── FEATURES ─────────── */}
      <section style={{ padding: '96px 0', background: 'var(--color-surface-alt)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 0.95fr)',
              gap: 60,
              alignItems: 'start',
              marginBottom: 48,
            }}
          >
            <div>
              <motion.div
                {...fadeUp}
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-accent)',
                  marginBottom: 12,
                  letterSpacing: '-0.005em',
                }}
              >
                Features
              </motion.div>
              <motion.h2
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: 0.05 }}
                style={{
                  fontSize: 'clamp(30px, 3.8vw, 46px)',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.05,
                }}
              >
                A verdict on every claim.
                <br />
                Nothing sensitive on chain.
              </motion.h2>
            </div>
            <motion.p
              {...fadeUp}
              transition={{ ...fadeUp.transition, delay: 0.1 }}
              style={{
                fontSize: 15,
                lineHeight: 1.7,
                color: 'var(--color-ink-muted)',
                marginTop: 32,
              }}
            >
              Redress bolts a full claims desk onto any app: a submission flow that encrypts
              client-side, a panel of AI judges for fast adjudication, and an auditable trail of
              commitments that regulators can verify without ever holding your users' data in
              plaintext.
            </motion.p>
          </div>

          {/* Big product visual with 3D reveal on scroll */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 12 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              position: 'relative',
              padding: 24,
              background: 'var(--color-surface)',
              borderRadius: 20,
              border: '1px solid var(--color-border)',
              boxShadow: '0 40px 60px -40px rgba(10, 10, 10, 0.35)',
              marginBottom: 48,
              transformStyle: 'preserve-3d',
              transformOrigin: 'top center',
            }}
          >
            <span
              aria-hidden
              style={{
                position: 'absolute',
                right: -14,
                top: -14,
                width: 90,
                height: 90,
                borderRadius: 14,
                background: 'var(--grad-accent)',
                zIndex: 0,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <ClaimMockup />
            </div>
          </motion.div>

          {/* Feature cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 22,
            }}
          >
            {[
              {
                Icon: ShieldCheck,
                title: 'Encrypted at source',
                body: 'Evidence sealed to the platform key with a single-use ephemeral keypair. The plaintext never leaves the browser.',
              },
              {
                Icon: Cpu,
                title: 'AI panel of judges',
                body: 'Specialised agents adjudicate fraud, refunds, chargebacks, KYC exceptions, and appeals. Reasoning stays private.',
              },
              {
                Icon: CheckCircle2,
                title: 'Auditable by anyone',
                body: 'Regulators paste plaintext, re-hash locally, compare on-chain commitments. Match or not, no exposure.',
              },
            ].map(({ Icon, title, body }, i) => (
              <GlowCard key={title} delay={i * 0.08}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 42,
                    height: 42,
                    borderRadius: 999,
                    background: 'var(--grad-accent-soft)',
                    color: 'var(--color-accent)',
                    marginBottom: 16,
                  }}
                >
                  <Icon size={20} strokeWidth={1.75} />
                </div>
                <h3 style={{ fontSize: 20, marginBottom: 8, letterSpacing: '-0.01em' }}>
                  {title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--color-ink-muted)' }}>
                  {body}
                </p>
              </GlowCard>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

function StatTile({
  to,
  prefix,
  suffix,
  customValue,
  label,
  note,
}: {
  to?: number;
  prefix?: string;
  suffix?: string;
  customValue?: string;
  label: string;
  note: string;
}) {
  const { ref, value } = useCountUp(to ?? 0);
  const display = customValue ?? `${prefix ?? ''}${value.toLocaleString()}${suffix ?? ''}`;

  return (
    <div
      ref={ref}
      style={{
        padding: '24px 4px 24px 20px',
        borderLeft: '2px solid var(--color-border)',
      }}
    >
      <div
        style={{
          fontFamily: 'var(--font-display)',
          fontSize: 40,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: 10,
          background: customValue ? 'var(--grad-accent)' : undefined,
          WebkitBackgroundClip: customValue ? 'text' : undefined,
          backgroundClip: customValue ? 'text' : undefined,
          color: customValue ? 'transparent' : 'var(--color-ink)',
        }}
      >
        {display}
      </div>
      <div style={{ fontSize: 13, color: 'var(--color-ink)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{note}</div>
    </div>
  );
}
