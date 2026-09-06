import { useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'outline' | 'onDark';
type Size = 'md' | 'lg';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  leading?: ReactNode;
  trailing?: ReactNode;
};

const sizeStyle: Record<Size, React.CSSProperties> = {
  md: { padding: '10px 20px', fontSize: 14, borderRadius: 999 },
  lg: { padding: '14px 26px', fontSize: 15, borderRadius: 999 },
};

const baseVariant: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--grad-accent)',
    color: '#FFFFFF',
    border: '1px solid transparent',
    boxShadow: '0 14px 28px -14px rgba(0, 0, 254, 0.55)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-ink)',
    border: '1px solid var(--color-border)',
  },
  outline: {
    background: 'var(--color-surface)',
    color: 'var(--color-ink)',
    border: '1px solid var(--color-border)',
  },
  onDark: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: '#F3EDE3',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    backdropFilter: 'blur(6px)',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  leading,
  trailing,
  children,
  style,
  ...rest
}: Props) {
  const [hover, setHover] = useState(false);

  return (
    <button
      {...rest}
      onMouseEnter={(e) => {
        setHover(true);
        rest.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        setHover(false);
        rest.onMouseLeave?.(e);
      }}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontWeight: 500,
        cursor: 'pointer',
        overflow: 'hidden',
        transition:
          'transform 160ms cubic-bezier(.2,.7,.2,1), box-shadow 160ms ease, background-color 160ms ease',
        transform: hover ? 'translateY(-1px)' : 'translateY(0)',
        ...sizeStyle[size],
        ...baseVariant[variant],
        ...style,
      }}
    >
      {/* shine sweep on primary */}
      {variant === 'primary' && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(120deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
            transform: hover ? 'translateX(120%)' : 'translateX(-120%)',
            transition: 'transform 700ms cubic-bezier(.2,.7,.2,1)',
            pointerEvents: 'none',
          }}
        />
      )}
      {leading && <span style={{ position: 'relative', display: 'inline-flex' }}>{leading}</span>}
      <span style={{ position: 'relative' }}>{children}</span>
      {trailing && (
        <span
          style={{
            position: 'relative',
            display: 'inline-flex',
            transition: 'transform 200ms ease',
            transform: hover ? 'translateX(4px)' : 'translateX(0)',
          }}
        >
          {trailing}
        </span>
      )}
    </button>
  );
}
