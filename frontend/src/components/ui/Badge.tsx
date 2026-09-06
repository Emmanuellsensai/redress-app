import type { ReactNode } from 'react';

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--color-ink)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      {children}
    </span>
  );
}
