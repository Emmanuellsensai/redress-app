import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Cpu, CheckCircle2, Github, ExternalLink } from 'lucide-react';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.3 },
  transition: { duration: 0.5, ease: 'easeOut' as const },
};

export default function Landing() {
  return (
    <main>
      {/* Hero */}
      <section style={{ padding: '96px 0 72px' }}>
        <div className="container" style={{ maxWidth: 780 }}>
          <motion.h1
            {...fadeUp}
            style={{
              fontSize: 'clamp(40px, 6vw, 64px)',
              letterSpacing: '-0.02em',
              marginBottom: 20,
            }}
          >
            Private claims. Verifiable verdicts.
          </motion.h1>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            style={{
              fontSize: 19,
              lineHeight: 1.55,
              color: 'var(--color-ink-muted)',
              marginBottom: 32,
              maxWidth: 640,
            }}
          >
            Every app has a dispute button. Redress makes it private, AI-adjudicated, and
            auditable, without anyone holding your evidence in plaintext.
          </motion.p>
          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.16 }}
            style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}
          >
            <Link to="/submit" className="btn btn-primary">
              File a Claim
            </Link>
            <Link to="/dashboard" className="btn btn-ghost">
              Platform Dashboard
            </Link>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '72px 0', background: 'var(--color-surface-alt)' }}>
        <div className="container">
          <motion.h2 {...fadeUp} style={{ fontSize: 32, marginBottom: 40 }}>
            How it works
          </motion.h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 24,
            }}
          >
            {[
              {
                Icon: ShieldCheck,
                title: 'Encrypt & Submit',
                body: `Your evidence is encrypted to the platform's public key. Only they can decrypt it. The chain stores a hash commitment, never your data.`,
              },
              {
                Icon: Cpu,
                title: 'AI Adjudication',
                body: `An AI verdict worker evaluates the evidence off-chain. The verdict reasoning stays private. Only its hash goes on-chain.`,
              },
              {
                Icon: CheckCircle2,
                title: 'Verify Anywhere',
                body: `Regulators or auditors paste the plaintext evidence and verdict. The app re-hashes locally and compares to the on-chain commitments. Green check or red X. No trust required.`,
              },
            ].map(({ Icon, title, body }, i) => (
              <motion.div
                key={title}
                {...fadeUp}
                transition={{ ...fadeUp.transition, delay: i * 0.08 }}
                className="card"
              >
                <Icon
                  size={28}
                  strokeWidth={1.5}
                  style={{ color: 'var(--color-accent)', marginBottom: 16 }}
                />
                <h3 style={{ fontSize: 20, marginBottom: 10 }}>{title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--color-ink-muted)' }}>
                  {body}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Built on Midnight */}
      <section style={{ padding: '72px 0' }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <motion.h2 {...fadeUp} style={{ fontSize: 28, marginBottom: 20 }}>
            Built on Midnight
          </motion.h2>
          <motion.p
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.08 }}
            style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--color-ink-muted)' }}
          >
            Midnight's dual-ledger model keeps evidence on the shielded side and only commitments
            on the public side. Zero-knowledge proofs enforce that the committed hashes match real
            evidence the submitter knew — nobody can post an arbitrary hash without the preimage.
          </motion.p>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          padding: '32px 0',
          borderTop: '1px solid var(--color-border)',
          background: 'var(--color-surface-alt)',
        }}
      >
        <div
          className="container"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
            fontSize: 13,
            color: 'var(--color-ink-muted)',
          }}
        >
          <div>Built for the Midnight Buildathon by Redress Labs</div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a
              href="https://github.com/Emmanuellsensai/redress-app"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
            >
              <Github size={14} strokeWidth={1.5} /> GitHub
            </a>
            <a
              href="https://midnight.network"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}
            >
              <ExternalLink size={14} strokeWidth={1.5} /> Midnight Network
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
