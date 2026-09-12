import { useEffect, useState } from 'react';
import { padEvidence, readPublicState, type PublicState } from '@redress/sdk';
import { CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { errorText } from '../lib/errorText';
import { toHex } from '../lib/hex';

const computeHash = async (data: Uint8Array): Promise<Uint8Array> => {
  const buf = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(buf);
};

type MatchResult = 'match' | 'mismatch' | null;

export default function Verify() {
  const [state, setState] = useState<PublicState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [evidenceInput, setEvidenceInput] = useState('');
  const [verdictInput, setVerdictInput] = useState('');
  const [evidenceMatch, setEvidenceMatch] = useState<MatchResult>(null);
  const [verdictMatch, setVerdictMatch] = useState<MatchResult>(null);
  const [computedEvidenceHash, setComputedEvidenceHash] = useState<string | null>(null);
  const [computedVerdictHash, setComputedVerdictHash] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setState(await readPublicState());
      } catch (err) {
        setError(errorText(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const verify = async () => {
    if (!state) return;
    setEvidenceMatch(null);
    setVerdictMatch(null);
    setComputedEvidenceHash(null);
    setComputedVerdictHash(null);

    if (evidenceInput.trim().length > 0) {
      const padded = padEvidence(new TextEncoder().encode(evidenceInput));
      const hash = await computeHash(padded);
      setComputedEvidenceHash(toHex(hash));
      const on = toHex(state.latestEvidenceHash);
      setEvidenceMatch(on === toHex(hash) ? 'match' : 'mismatch');
    }
    if (verdictInput.trim().length > 0) {
      const padded = padEvidence(new TextEncoder().encode(verdictInput));
      const hash = await computeHash(padded);
      setComputedVerdictHash(toHex(hash));
      const on = toHex(state.latestVerdictHash);
      setVerdictMatch(on === toHex(hash) ? 'match' : 'mismatch');
    }
  };

  return (
    <main className="container" style={{ padding: '48px 0', maxWidth: 720 }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Verify</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: 20 }}>
        Regulator / auditor view. Paste the plaintext evidence and verdict - this page re-hashes
        them in your browser and compares to the on-chain commitments. No wallet needed.
      </p>

      <div className="notice">
        <ShieldCheck
          size={14}
          strokeWidth={1.5}
          style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-success)' }}
        />
        This verification runs entirely in your browser. No data is sent anywhere.
      </div>

      {loading ? (
        <div className="card">
          <span className="spinner" /> Reading contract state…
        </div>
      ) : error ? (
        <div className="card" style={{ borderColor: 'var(--color-accent)' }}>
          {error}
        </div>
      ) : !state ? (
        <div className="card">Contract not deployed yet.</div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 20,
                marginBottom: 20,
              }}
            >
              <Stat label="Claims" value={String(state.claimCount)} />
              <Stat label="Verdicts" value={String(state.verdictCount)} />
            </div>
            <HashRow label="Latest evidence hash (on-chain)" value={toHex(state.latestEvidenceHash)} />
            <HashRow label="Latest verdict hash (on-chain)" value={toHex(state.latestVerdictHash)} />
          </div>

          <div className="card">
            <div className="field">
              <label htmlFor="ev">Evidence plaintext</label>
              <textarea
                id="ev"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                placeholder="Paste the plaintext evidence you were given."
              />
            </div>
            <div className="field">
              <label htmlFor="ver">Verdict plaintext</label>
              <textarea
                id="ver"
                value={verdictInput}
                onChange={(e) => setVerdictInput(e.target.value)}
                placeholder="Paste the plaintext verdict (JSON blob) you were given."
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={verify}
              disabled={evidenceInput.trim().length === 0 && verdictInput.trim().length === 0}
            >
              Verify hashes
            </button>

            {evidenceMatch && (
              <ResultRow
                label="Evidence"
                match={evidenceMatch}
                computed={computedEvidenceHash}
                onchain={toHex(state.latestEvidenceHash)}
              />
            )}
            {verdictMatch && (
              <ResultRow
                label="Verdict"
                match={verdictMatch}
                computed={computedVerdictHash}
                onchain={toHex(state.latestVerdictHash)}
              />
            )}
          </div>

          <div
            style={{
              marginTop: 16,
              fontSize: 12,
              color: 'var(--color-ink-muted)',
              lineHeight: 1.5,
            }}
          >
            Note: this page compares raw SHA-256 of the padded 256-byte plaintext to the on-chain
            hash. Compact's <span className="mono">persistentHash</span> may include a domain
            separator; if hashes don't match end-to-end, that is the first thing to investigate.
          </div>
        </>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>{value}</div>
    </div>
  );
}

function HashRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>{label}</div>
      <div className="hash">{value}</div>
    </div>
  );
}

function ResultRow({
  label,
  match,
  computed,
  onchain,
}: {
  label: string;
  match: MatchResult;
  computed: string | null;
  onchain: string;
}) {
  const ok = match === 'match';
  return (
    <div
      style={{
        marginTop: 20,
        padding: 16,
        border: `1px solid ${ok ? 'var(--color-success)' : 'var(--color-accent)'}`,
        borderRadius: 4,
        background: 'var(--color-surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 8,
          color: ok ? 'var(--color-success)' : 'var(--color-accent)',
          fontWeight: 600,
        }}
      >
        {ok ? (
          <CheckCircle2 size={18} strokeWidth={1.5} />
        ) : (
          <XCircle size={18} strokeWidth={1.5} />
        )}
        {label} {ok ? 'matches' : 'does not match'} the on-chain hash
      </div>
      {computed && (
        <>
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
            Computed
          </div>
          <div className="hash" style={{ marginBottom: 8 }}>
            {computed}
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
            On-chain
          </div>
          <div className="hash">{onchain}</div>
        </>
      )}
    </div>
  );
}
