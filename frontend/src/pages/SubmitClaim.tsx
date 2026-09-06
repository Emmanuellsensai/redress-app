import { useEffect, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import {
  connectToContract,
  padEvidence,
  readPublicState,
  redressCallTx,
  sealEvidence,
  type PublicState,
  type ClaimType,
  type Verdict,
} from '@redress/sdk';
import {
  ShieldCheck,
  Send,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  UserRoundCog,
} from 'lucide-react';
import WalletConnect from '../components/WalletConnect';
import { errorText } from '../lib/errorText';
import { toHex } from '../lib/hex';
import { fetchVerdict } from '../lib/verdict-client';

const CLAIM_TYPES: { value: ClaimType; label: string }[] = [
  { value: 'fraud', label: 'Fraud' },
  { value: 'refund', label: 'Refund request' },
  { value: 'chargeback', label: 'Chargeback' },
  { value: 'kyc_exception', label: 'KYC exception' },
  { value: 'account_appeal', label: 'Account appeal' },
];

const MAX_EVIDENCE_CHARS = 200;

/** The reporter-centric flow: submit → AI verdict → accept, reject, or
 *  escalate → on-chain commitment. The reporter drives the whole
 *  interaction; the platform receives finalized verdicts to act on. */
type Stage =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'adjudicating' }
  | { kind: 'verdict'; verdict: Verdict; submissionTxId: string; evidenceHash: string }
  | { kind: 'posting'; verdict: Verdict; submissionTxId: string; evidenceHash: string; finalDecision: 'approved' | 'denied' | 'escalate' }
  | { kind: 'done'; verdict: Verdict; finalVerdict: Verdict; submissionTxId: string; verdictTxId: string; evidenceHash: string; verdictHash: string };

export default function SubmitClaim() {
  const [state, setState] = useState<PublicState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [claimType, setClaimType] = useState<ClaimType>('fraud');
  const [evidence, setEvidence] = useState('');
  const [stage, setStage] = useState<Stage>({ kind: 'idle' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setState(await readPublicState());
      } finally {
        setLoadingState(false);
      }
    })();
  }, []);

  const submitAndAdjudicate = async () => {
    if (!api || !accountId || !state?.platformPublicKey) return;
    setError(null);
    setStage({ kind: 'submitting' });

    try {
      const bytes = new TextEncoder().encode(evidence);
      const envelope = sealEvidence(bytes, state.platformPublicKey);
      const padded = padEvidence(bytes);
      const contract = await connectToContract(api, accountId);
      const outcome = await redressCallTx(contract).submit_claim(envelope, padded);

      const updated = await readPublicState();
      setState(updated);
      const evidenceHash = updated ? toHex(updated.latestEvidenceHash) : '(unknown)';

      // Straight into AI adjudication with the plaintext the reporter
      // just typed — no need to decrypt anything.
      setStage({ kind: 'adjudicating' });
      const verdict = await fetchVerdict(evidence, claimType);
      setStage({
        kind: 'verdict',
        verdict,
        submissionTxId: outcome.public.txId,
        evidenceHash,
      });
    } catch (err) {
      setError(errorText(err));
      setStage({ kind: 'idle' });
    }
  };

  const decide = async (finalDecision: 'approved' | 'denied' | 'escalate') => {
    if (stage.kind !== 'verdict') return;
    if (!api || !accountId) return;
    const { verdict, submissionTxId, evidenceHash } = stage;
    setError(null);
    setStage({ kind: 'posting', verdict, submissionTxId, evidenceHash, finalDecision });
    try {
      // Reporter has authority to override the AI here. If they accept,
      // the on-chain verdict is the AI's exact judgement. If they reject
      // or escalate, we override the `decision` field and note that this
      // is the reporter's decision (confidence 1.0 by definition — the
      // reporter is expressing their own certainty, not the AI's).
      const finalVerdict: Verdict =
        finalDecision === 'approved'
          ? verdict
          : {
              decision: finalDecision,
              confidence: 1,
              reasoning:
                finalDecision === 'denied'
                  ? `Reporter rejected the AI verdict. AI reasoning was: ${verdict.reasoning}`
                  : `Reporter escalated the case to a human agent. AI reasoning was: ${verdict.reasoning}`,
              claimType: verdict.claimType,
              timestamp: Date.now(),
            };
      const verdictBlob = JSON.stringify({
        d: finalVerdict.decision,
        c: finalVerdict.confidence,
        r: finalVerdict.reasoning,
        t: finalVerdict.claimType,
        ts: finalVerdict.timestamp,
      });
      const padded = padEvidence(new TextEncoder().encode(verdictBlob));
      const contract = await connectToContract(api, accountId);
      const outcome = await redressCallTx(contract).post_verdict(padded);
      const updated = await readPublicState();
      setState(updated);
      setStage({
        kind: 'done',
        verdict,
        finalVerdict,
        submissionTxId,
        verdictTxId: outcome.public.txId,
        evidenceHash,
        verdictHash: updated ? toHex(updated.latestVerdictHash) : '(unknown)',
      });
    } catch (err) {
      setError(errorText(err));
      setStage({
        kind: 'verdict',
        verdict: stage.verdict,
        submissionTxId: stage.submissionTxId,
        evidenceHash: stage.evidenceHash,
      });
    }
  };

  const reset = () => {
    setEvidence('');
    setClaimType('fraud');
    setStage({ kind: 'idle' });
    setError(null);
  };

  const submitBusy = stage.kind === 'submitting' || stage.kind === 'adjudicating';

  return (
    <main className="container" style={{ padding: '48px 0 80px', maxWidth: 780 }}>
      <h1 style={{ fontSize: 34, marginBottom: 12 }}>File a claim</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: 24 }}>
        Submit your evidence, review the AI verdict, and choose what happens next.
      </p>

      <div className="notice">
        <ShieldCheck
          size={14}
          strokeWidth={1.5}
          style={{ verticalAlign: 'middle', marginRight: 6, color: 'var(--color-success)' }}
        />
        Your evidence is encrypted in your browser before it touches the chain. Only the platform
        can decrypt it. The chain stores a one-way hash and the sealed envelope.
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
          <AlertCircle size={16} strokeWidth={1.5} style={warnIcon} /> The contract is not
          deployed yet.
        </div>
      ) : !state.platformPublicKey ? (
        <div className="card">
          <AlertCircle size={16} strokeWidth={1.5} style={warnIcon} /> No platform has registered
          yet. Claims cannot be submitted until a platform publishes its public key.
        </div>
      ) : (
        <>
          {/* STEP 1 — the form (only visible while idle or actively submitting) */}
          {(stage.kind === 'idle' || stage.kind === 'submitting' || stage.kind === 'adjudicating') && (
            <div className="card">
              <div className="field">
                <label htmlFor="claim-type">Claim type</label>
                <select
                  id="claim-type"
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value as ClaimType)}
                  disabled={submitBusy}
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
                  disabled={submitBusy}
                  placeholder="Describe the incident. Dates, amounts, identifiers — the platform will read this after decrypting."
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={submitAndAdjudicate}
                disabled={
                  submitBusy || !api || !accountId || evidence.trim().length === 0
                }
              >
                {submitBusy ? <span className="spinner" /> : <Send size={14} strokeWidth={1.5} />}
                {stage.kind === 'submitting'
                  ? 'Encrypting & submitting…'
                  : stage.kind === 'adjudicating'
                    ? 'Asking the AI judge…'
                    : 'Submit for AI verdict'}
              </button>
            </div>
          )}

          {/* STEP 2 — the AI verdict (visible while verdict is pending decision) */}
          {(stage.kind === 'verdict' || stage.kind === 'posting') && (
            <VerdictCard
              verdict={stage.verdict}
              submissionTxId={stage.submissionTxId}
              evidenceHash={stage.evidenceHash}
              posting={stage.kind === 'posting' ? stage.finalDecision : null}
              onDecide={decide}
            />
          )}

          {/* STEP 3 — done */}
          {stage.kind === 'done' && (
            <DoneCard
              verdict={stage.verdict}
              finalVerdict={stage.finalVerdict}
              submissionTxId={stage.submissionTxId}
              verdictTxId={stage.verdictTxId}
              evidenceHash={stage.evidenceHash}
              verdictHash={stage.verdictHash}
              onReset={reset}
            />
          )}
        </>
      )}

      {error && (
        <div
          className="card"
          style={{
            marginTop: 20,
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            borderColor: 'var(--color-warning)',
          }}
        >
          <AlertCircle
            size={20}
            strokeWidth={1.5}
            style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ fontSize: 14 }}>{error}</div>
        </div>
      )}
    </main>
  );
}

const warnIcon: React.CSSProperties = {
  color: 'var(--color-warning)',
  marginRight: 6,
  verticalAlign: 'middle',
};

function VerdictCard({
  verdict,
  submissionTxId,
  evidenceHash,
  posting,
  onDecide,
}: {
  verdict: Verdict;
  submissionTxId: string;
  evidenceHash: string;
  posting: 'approved' | 'denied' | 'escalate' | null;
  onDecide: (d: 'approved' | 'denied' | 'escalate') => void;
}) {
  const busy = posting !== null;
  return (
    <div className="card-verdict" style={{ marginTop: 20 }}>
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 14,
          color: 'var(--color-accent)',
          fontWeight: 700,
        }}
      >
        <Sparkles size={16} strokeWidth={1.6} /> AI verdict
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color:
              verdict.decision === 'approved'
                ? 'var(--color-success)'
                : verdict.decision === 'denied'
                  ? 'var(--color-warning)'
                  : 'var(--color-accent)',
          }}
        >
          {verdict.decision.toUpperCase()}
        </span>
        <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
          confidence {(verdict.confidence * 100).toFixed(0)}%
        </span>
      </div>

      <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>{verdict.reasoning}</p>

      <div
        style={{
          padding: 14,
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 10,
          marginBottom: 18,
        }}
      >
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Submission tx
        </div>
        <div className="hash" style={{ marginBottom: 10 }}>
          {submissionTxId}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Evidence hash on chain
        </div>
        <div className="hash">{evidenceHash}</div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>
        What happens next is up to you.
      </div>
      <p style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 16 }}>
        Approve to send the AI verdict to the platform for automatic resolution. Reject to override
        it. Escalate if you want a human to review it with your consent.
      </p>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={() => onDecide('approved')}
          disabled={busy}
        >
          {posting === 'approved' ? <span className="spinner" /> : <ThumbsUp size={14} strokeWidth={1.6} />}
          Approve
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => onDecide('denied')}
          disabled={busy}
        >
          {posting === 'denied' ? <span className="spinner" /> : <ThumbsDown size={14} strokeWidth={1.6} />}
          Reject
        </button>
        <button
          className="btn btn-ghost"
          onClick={() => onDecide('escalate')}
          disabled={busy}
        >
          {posting === 'escalate' ? <span className="spinner" /> : <UserRoundCog size={14} strokeWidth={1.6} />}
          Escalate to human
        </button>
      </div>
    </div>
  );
}

function DoneCard({
  verdict,
  finalVerdict,
  submissionTxId,
  verdictTxId,
  evidenceHash,
  verdictHash,
  onReset,
}: {
  verdict: Verdict;
  finalVerdict: Verdict;
  submissionTxId: string;
  verdictTxId: string;
  evidenceHash: string;
  verdictHash: string;
  onReset: () => void;
}) {
  const overridden = finalVerdict.decision !== verdict.decision;
  return (
    <div className="card" style={{ marginTop: 20, borderColor: 'var(--color-success)' }}>
      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          marginBottom: 14,
          color: 'var(--color-success)',
          fontWeight: 700,
        }}
      >
        <CheckCircle2 size={18} strokeWidth={1.6} />
        Claim resolved and committed on-chain
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Final decision
        </div>
        <div
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 24,
            fontWeight: 800,
            color:
              finalVerdict.decision === 'approved'
                ? 'var(--color-success)'
                : finalVerdict.decision === 'denied'
                  ? 'var(--color-warning)'
                  : 'var(--color-accent)',
          }}
        >
          {finalVerdict.decision.toUpperCase()}
        </div>
        {overridden && (
          <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginTop: 4 }}>
            You overrode the AI's suggested verdict ({verdict.decision.toUpperCase()}).
          </div>
        )}
      </div>

      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Submission tx
        </div>
        <div className="hash" style={{ marginBottom: 10 }}>
          {submissionTxId}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Evidence hash
        </div>
        <div className="hash" style={{ marginBottom: 10 }}>
          {evidenceHash}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Verdict tx
        </div>
        <div className="hash" style={{ marginBottom: 10 }}>
          {verdictTxId}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-ink-muted)', marginBottom: 4 }}>
          Verdict hash
        </div>
        <div className="hash">{verdictHash}</div>
      </div>

      <button className="btn btn-ghost" onClick={onReset}>
        File another claim
      </button>
    </div>
  );
}
