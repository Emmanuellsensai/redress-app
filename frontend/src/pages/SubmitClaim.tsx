import { useEffect, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import {
  connectToContract,
  padEvidence,
  readPublicState,
  redressCallTx,
  sealEvidence,
  type PublicState,
} from '@redress/sdk';
import type { ClaimType } from '@redress/sdk';
import { ShieldCheck, Send, AlertCircle, CheckCircle2 } from 'lucide-react';
import WalletConnect from '../components/WalletConnect';
import { errorText } from '../lib/errorText';
import { toHex } from '../lib/hex';

const CLAIM_TYPES: { value: ClaimType; label: string }[] = [
  { value: 'fraud', label: 'Fraud' },
  { value: 'refund', label: 'Refund request' },
  { value: 'chargeback', label: 'Chargeback' },
  { value: 'kyc_exception', label: 'KYC exception' },
  { value: 'account_appeal', label: 'Account appeal' },
];

const MAX_EVIDENCE_CHARS = 200;

export default function SubmitClaim() {
  const [state, setState] = useState<PublicState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [claimType, setClaimType] = useState<ClaimType>('fraud');
  const [evidence, setEvidence] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ txId: string; evidenceHash: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshState = async () => {
    try {
      const s = await readPublicState();
      setState(s);
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  const submit = async () => {
    if (!api || !accountId || !state?.platformPublicKey) return;
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const bytes = new TextEncoder().encode(evidence);
      const envelope = sealEvidence(bytes, state.platformPublicKey);
      const padded = padEvidence(bytes);
      const contract = await connectToContract(api, accountId);
      const outcome = await redressCallTx(contract).submit_claim(envelope, padded);
      // Re-read state to surface the freshly committed evidence hash.
      const updated = await readPublicState();
      setState(updated);
      setResult({
        txId: outcome.public.txId,
        evidenceHash: updated ? toHex(updated.latestEvidenceHash) : '(unknown)',
      });
      setEvidence('');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="container" style={{ padding: '48px 0', maxWidth: 720 }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Submit a claim</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: 24 }}>
        File a fraud, refund, chargeback, KYC, or account claim. Your evidence is encrypted in
        your browser before it reaches the chain.
      </p>

      <div className="notice">
        <ShieldCheck
          size={14}
          strokeWidth={1.5}
          style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-success)' }}
        />
        Your evidence is encrypted in your browser before it touches the chain. The platform can
        decrypt it; nobody else can. The chain stores only a one-way hash of your evidence and
        the encrypted envelope.
      </div>

      <div style={{ marginBottom: 24 }}>
        <WalletConnect
          onConnect={(a, id) => {
            setApi(a);
            setAccountId(id);
          }}
          onDisconnect={() => {
            setApi(null);
            setAccountId(null);
          }}
        />
      </div>

      {loadingState ? (
        <div className="card">
          <span className="spinner" /> Reading contract state…
        </div>
      ) : !state ? (
        <div className="card">
          <AlertCircle
            size={16}
            strokeWidth={1.5}
            style={{ color: 'var(--color-warning)', marginRight: 6, verticalAlign: 'middle' }}
          />
          The contract is not deployed yet. Deploy it via <span className="mono">/deploy</span>.
        </div>
      ) : !state.platformPublicKey ? (
        <div className="card">
          <AlertCircle
            size={16}
            strokeWidth={1.5}
            style={{ color: 'var(--color-warning)', marginRight: 6, verticalAlign: 'middle' }}
          />
          No platform has registered yet. Claims cannot be submitted until a platform publishes
          its public key.
        </div>
      ) : (
        <div className="card">
          <div className="field">
            <label htmlFor="claim-type">Claim type</label>
            <select
              id="claim-type"
              value={claimType}
              onChange={(e) => setClaimType(e.target.value as ClaimType)}
              disabled={submitting}
            >
              {CLAIM_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="evidence">
              Evidence ({evidence.length}/{MAX_EVIDENCE_CHARS})
            </label>
            <textarea
              id="evidence"
              value={evidence}
              maxLength={MAX_EVIDENCE_CHARS}
              onChange={(e) => setEvidence(e.target.value)}
              disabled={submitting}
              placeholder="Describe the incident. Dates, amounts, identifiers — the platform will read this after decrypting."
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={submit}
            disabled={submitting || !api || !accountId || evidence.trim().length === 0}
          >
            {submitting ? <span className="spinner" /> : <Send size={14} strokeWidth={1.5} />}
            {submitting ? 'Encrypting & submitting…' : 'Submit claim'}
          </button>
        </div>
      )}

      {result && (
        <div className="card-verdict" style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
            <CheckCircle2 size={18} strokeWidth={1.5} style={{ color: 'var(--color-success)' }} />
            <span style={{ fontWeight: 600 }}>Claim submitted</span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 6 }}>
            Transaction ID
          </div>
          <div className="hash" style={{ marginBottom: 12 }}>
            {result.txId}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 6 }}>
            Evidence hash (on-chain commitment)
          </div>
          <div className="hash">{result.evidenceHash}</div>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            borderColor: 'var(--color-accent)',
          }}
        >
          <AlertCircle
            size={20}
            strokeWidth={1.5}
            style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ fontSize: 14 }}>{error}</div>
        </div>
      )}
    </main>
  );
}
