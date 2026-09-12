import { Github, ExternalLink, Twitter } from 'lucide-react';
import { motion } from 'framer-motion';
import { RedressLogo } from '../ui/RedressLogo';
import { MidnightLogo } from '../ui/MidnightLogo';

/**
 * Shared site footer with a "liquid glass" surface.
 *
 * The glass is composed from three layered elements:
 *   1. a base linear gradient (semi-opaque, tinted with the brand blue)
 *   2. a strong backdrop-filter blur so anything scrolled behind melts
 *   3. a hairline highlight at the top edge - the glass "cap"
 * Plus a soft top-inset shadow to sell the depth.
 */
export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      style={{
        position: 'relative',
        marginTop: 40,
        padding: '48px 0 36px',
        color: 'var(--color-ink)',
        background:
          'linear-gradient(180deg, rgba(238, 238, 255, 0.55) 0%, rgba(255, 255, 255, 0.6) 100%)',
        backdropFilter: 'blur(22px) saturate(180%)',
        WebkitBackdropFilter: 'blur(22px) saturate(180%)',
        borderTop: '1px solid rgba(0, 0, 254, 0.14)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.7), 0 -10px 30px -20px rgba(0, 0, 254, 0.18)',
      }}
    >
      {/* Glass top edge highlight - a thin bright line that reads as the rim
          of a piece of frosted glass */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            'linear-gradient(90deg, rgba(0, 0, 254, 0) 0%, rgba(0, 0, 254, 0.35) 50%, rgba(0, 0, 254, 0) 100%)',
        }}
      />

      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr) minmax(0, 0.8fr)',
          gap: 40,
          alignItems: 'start',
        }}
      >
        {/* Brand block */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <RedressLogo size={30} />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: '-0.01em',
              }}
            >
              Redress
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: 'var(--color-ink-muted)',
              maxWidth: 360,
              marginBottom: 14,
            }}
          >
            Privacy-preserving claims infrastructure. A panel of AI judges, private evidence,
            verdicts anyone can audit.
          </p>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              borderRadius: 999,
              background: 'rgba(10, 10, 10, 0.9)',
              color: '#FFFFFF',
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            <MidnightLogo size={14} />
            Built on Midnight
          </div>
        </div>

        {/* Product links */}
        <FooterCol
          heading="Product"
          links={[
            { label: 'Submit a claim', href: '/submit' },
            { label: 'Platform dashboard', href: '/dashboard' },
            { label: 'Regulator verify', href: '/verify' },
            { label: 'Deploy contract', href: '/deploy' },
          ]}
        />

        {/* External links */}
        <FooterCol
          heading="Ecosystem"
          links={[
            { label: 'GitHub', href: 'https://github.com/Emmanuellsensai/redress-app', external: true, Icon: Github },
            { label: 'Midnight Network', href: 'https://midnight.network', external: true, Icon: ExternalLink },
            { label: '@Emmanuellsensai', href: 'https://x.com/Emmanuellsensai', external: true, Icon: Twitter },
          ]}
        />
      </div>

      <div
        className="container"
        style={{
          marginTop: 36,
          paddingTop: 20,
          borderTop: '1px solid rgba(0, 0, 254, 0.08)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          fontSize: 12,
          color: 'var(--color-ink-muted)',
        }}
      >
        <div>© {new Date().getFullYear()} Redress Labs · Apache-2.0</div>
        <div>Built for the Midnight Buildathon · Wave 1</div>
      </div>
    </motion.footer>
  );
}

function FooterCol({
  heading,
  links,
}: {
  heading: string;
  links: { label: string; href: string; external?: boolean; Icon?: React.ComponentType<{ size?: number; strokeWidth?: number }> }[];
}) {
  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--color-ink)',
          marginBottom: 14,
        }}
      >
        {heading}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(({ label, href, external, Icon }) => (
          <li key={label}>
            <a
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noreferrer' : undefined}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'var(--color-ink-muted)',
                transition: 'color 160ms ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-ink-muted)')}
            >
              {Icon && <Icon size={13} strokeWidth={1.6} />}
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
