import { useEffect, useMemo, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import nacl from 'tweetnacl';
import {
  connectToContract,
  generatePlatformKeypair,
  openEvidence,
  padEvidence,
  readPublicState,
  redressCallTx,
  stripPadding,
  type PublicState,
  type Verdict,
  type ClaimType,
} from '@redress/sdk';
import {
  KeyRound,
  Lock,
  Unlock,
  Sparkles,
  Send,
  AlertCircle,
  CheckCircle2,
  Copy,
} from 'lucide-react';
import WalletConnect from '../components/WalletConnect';
import { errorText } from '../lib/errorText';
import { fromHex, toHex, truncateHex } from '../lib/hex';

const SK_STORAGE_KEY = 'redress_platform_sk';

/** Mock verdict — replaced in Phase 4 with a real verdict-worker call. */
const getMockVerdict = async (evidence: string, claimType: ClaimType): Promise<Verdict> => {
  await new Promise((r) => setTimeout(r, 1500));
  return {
    decision: 'approved',
    confidence: 0.85,
    reasoning: `Based on the submitted evidence for this ${claimType.replace(
      '_',
      ' ',
    )} claim, the documentation appears sufficient to support the claim. The evidence describes a specific incident with identifiable details.`,
    claimType,
    timestamp: Date.now(),
  };
};

type ClaimSlot = {
  index: number;
  envelope: Uint8Array;
  plaintext?: string;
  verdict?: Verdict;
  posting?: boolean;
  verdictHash?: string;
  error?: string;
};

export default function Dashboard() {
  const [state, setState] = useState<PublicState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  const [storedSkHex, setStoredSkHex] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [pendingKeypair, setPendingKeypair] = useState<nacl.BoxKeyPair | null>(null);

  const [claims, setClaims] = useState<ClaimSlot[]>([]);

  const refresh = async () => {
    try {
      const s = await readPublicState();
      setState(s);
      if (s) {
        setClaims(
          s.evidenceInbox.map((envelope, index) => ({ index, envelope })),
        );
      }
    } finally {
      setLoadingState(false);
    }
  };

  useEffect(() => {
    setStoredSkHex(localStorage.getItem(SK_STORAGE_KEY));
    refresh();
  }, []);

  const derivedPk = useMemo(() => {
    if (!storedSkHex) return null;
    try {
      return nacl.box.keyPair.fromSecretKey(fromHex(storedSkHex)).publicKey;
    } catch {
      return null;
    }
  }, [storedSkHex]);

  const isRegisteredPlatform =
    !!derivedPk &&
    !!state?.platformPublicKey &&
    derivedPk.length === state.platformPublicKey.length &&
    derivedPk.every((b, i) => b === state.platformPublicKey![i]);

  const generateKeys = () => {
    const kp = generatePlatformKeypair();
    setPendingKeypair(kp);
  };

  const registerOnChain = async () => {
    if (!api || !accountId || !pendingKeypair) return;
    setRegistering(true);
    setRegisterError(null);
    try {
      const contract = await connectToContract(api, accountId);
      await redressCallTx(contract).register_platform(pendingKeypair.publicKey);
      localStorage.setItem(SK_STORAGE_KEY, toHex(pendingKeypair.secretKey));
      setStoredSkHex(toHex(pendingKeypair.secretKey));
      setPendingKeypair(null);
      await refresh();
    } catch (err) {
      setRegisterError(errorText(err));
    } finally {
      setRegistering(false);
    }
  };

  const decrypt = (idx: number) => {
    if (!storedSkHex) return;
    setClaims((prev) =>
      prev.map((c) => {
        if (c.index !== idx) return c;
        try {
          const sk = fromHex(storedSkHex);
          const opened = openEvidence(c.envelope, sk);
          if (!opened) return { ...c, error: 'Decryption failed (wrong key)' };
          const text = new TextDecoder().decode(stripPadding(opened));
          return { ...c, plaintext: text, error: undefined };
        } catch (err) {
          return { ...c, error: errorText(err) };
        }
      }),
    );
  };

  const runVerdict = async (idx: number) => {
    const claim = claims.find((c) => c.index === idx);
    if (!claim?.plaintext) return;
    const verdict = await getMockVerdict(claim.plaintext, 'fraud');
    setClaims((prev) => prev.map((c) => (c.index === idx ? { ...c, verdict } : c)));
  };

  const postVerdict = async (idx: number) => {
    if (!api || !accountId) return;
    const claim = claims.find((c) => c.index === idx);
    if (!claim?.verdict) return;

    setClaims((prev) => prev.map((c) => (c.index === idx ? { ...c, posting: true, error: undefined } : c)));
    try {
      // Compact serialization of the verdict; padded to 256 bytes.
      const verdictBlob = JSON.stringify({
        d: claim.verdict.decision,
        c: claim.verdict.confidence,
        r: claim.verdict.reasoning,
        t: claim.verdict.claimType,
        ts: claim.verdict.timestamp,
      });
      const padded = padEvidence(new TextEncoder().encode(verdictBlob));
      const contract = await connectToContract(api, accountId);
      await redressCallTx(contract).post_verdict(padded);
      const updated = await readPublicState();
      setState(updated);
      setClaims((prev) =>
        prev.map((c) =>
          c.index === idx
            ? {
                ...c,
                posting: false,
                verdictHash: updated ? toHex(updated.latestVerdictHash) : '(unknown)',
              }
            : c,
        ),
      );
    } catch (err) {
      setClaims((prev) =>
        prev.map((c) => (c.index === idx ? { ...c, posting: false, error: errorText(err) } : c)),
      );
    }
  };

  return (
    <main className="container" style={{ padding: '48px 0', maxWidth: 900 }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Platform Dashboard</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: 24 }}>
        Register your platform, decrypt incoming claims, adjudicate with the AI verdict worker,
        and post verdict commitments on-chain.
      </p>

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
        <div className="card">Contract not deployed yet.</div>
      ) : !state.platformPublicKey ? (
        <RegisterPanel
          pendingKeypair={pendingKeypair}
          onGenerate={generateKeys}
          onRegister={registerOnChain}
          registering={registering}
          canRegister={!!api && !!accountId}
          error={registerError}
        />
      ) : !isRegisteredPlatform ? (
        <div className="card">
          <AlertCircle
            size={16}
            strokeWidth={1.5}
            style={{ color: 'var(--color-warning)', marginRight: 6, verticalAlign: 'middle' }}
          />
          A different platform is registered on-chain, or you have no secret key in this browser.
          You cannot decrypt these claims.
          <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-ink-muted)' }}>
            Registered public key:{' '}
            <span className="mono">{truncateHex(toHex(state.platformPublicKey), 8, 6)}</span>
          </div>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="dot" style={{ background: 'var(--color-success)' }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500 }}>Registered platform</div>
                <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                  {claims.length} claim{claims.length === 1 ? '' : 's'} in inbox
                </div>
              </div>
              <div className="mono" style={{ fontSize: 12 }}>
                {truncateHex(toHex(state.platformPublicKey), 8, 6)}
              </div>
            </div>
          </div>

          {claims.length === 0 ? (
            <div className="card">No claims yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {claims.map((claim) => (
                <ClaimCard
                  key={claim.index}
                  claim={claim}
                  onDecrypt={() => decrypt(claim.index)}
                  onGetVerdict={() => runVerdict(claim.index)}
                  onPostVerdict={() => postVerdict(claim.index)}
                  canPost={!!api && !!accountId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function RegisterPanel({
  pendingKeypair,
  onGenerate,
  onRegister,
  registering,
  canRegister,
  error,
}: {
  pendingKeypair: nacl.BoxKeyPair | null;
  onGenerate: () => void;
  onRegister: () => void;
  registering: boolean;
  canRegister: boolean;
  error: string | null;
}) {
  return (
    <div className="card">
      <h2 style={{ fontSize: 20, marginBottom: 8 }}>Register your platform</h2>
      <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', marginBottom: 16 }}>
        Generate a curve25519 keypair. The public key is registered on-chain so claimants can
        encrypt evidence to you; the secret key stays in this browser only.
      </p>

      {!pendingKeypair ? (
        <button className="btn btn-ghost" onClick={onGenerate}>
          <KeyRound size={14} strokeWidth={1.5} />
          Generate keypair
        </button>
      ) : (
        <>
          <div className="notice">
            Your secret key is stored in this browser only. If you clear browser data, you lose
            the ability to decrypt evidence. Back it up now.
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 6 }}>
            Public key (goes on-chain)
          </div>
          <div className="hash" style={{ marginBottom: 12 }}>
            {toHex(pendingKeypair.publicKey)}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 6 }}>
            Secret key (browser-local, back this up)
          </div>
          <div className="hash" style={{ marginBottom: 16 }}>
            {toHex(pendingKeypair.secretKey)}
          </div>
          <button
            className="btn btn-primary"
            onClick={onRegister}
            disabled={registering || !canRegister}
          >
            {registering ? <span className="spinner" /> : <Send size={14} strokeWidth={1.5} />}
            {registering ? 'Registering…' : 'Register on-chain'}
          </button>
          {!canRegister && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-ink-muted)' }}>
              Connect a wallet first.
            </div>
          )}
        </>
      )}

      {error && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-accent)' }}>{error}</div>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  onDecrypt,
  onGetVerdict,
  onPostVerdict,
  canPost,
}: {
  claim: ClaimSlot;
  onDecrypt: () => void;
  onGetVerdict: () => void;
  onPostVerdict: () => void;
  canPost: boolean;
}) {
  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div style={{ fontWeight: 600 }}>Claim #{claim.index + 1}</div>
        {claim.plaintext ? (
          <span
            style={{
              display: 'inline-flex',
              gap: 6,
              alignItems: 'center',
              fontSize: 12,
              color: 'var(--color-success)',
            }}
          >
            <Unlock size={12} strokeWidth={1.5} /> Decrypted
          </span>
        ) : (
          <span
            style={{
              display: 'inline-flex',
              gap: 6,
              alignItems: 'center',
              fontSize: 12,
              color: 'var(--color-ink-muted)',
            }}
          >
            <Lock size={12} strokeWidth={1.5} /> Sealed
          </span>
        )}
      </div>

      {!claim.plaintext ? (
        <button className="btn btn-ghost" onClick={onDecrypt}>
          <Unlock size={14} strokeWidth={1.5} /> Decrypt
        </button>
      ) : (
        <>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginBottom: 6 }}>
            Evidence
          </div>
          <div
            style={{
              padding: 12,
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              fontSize: 14,
              lineHeight: 1.5,
              marginBottom: 16,
              whiteSpace: 'pre-wrap',
            }}
          >
            {claim.plaintext}
          </div>

          {!claim.verdict ? (
            <button className="btn btn-primary" onClick={onGetVerdict}>
              <Sparkles size={14} strokeWidth={1.5} /> Get AI verdict
            </button>
          ) : (
            <div className="card-verdict" style={{ marginBottom: 12 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 22,
                    color:
                      claim.verdict.decision === 'approved'
                        ? 'var(--color-success)'
                        : claim.verdict.decision === 'denied'
                        ? 'var(--color-accent)'
                        : 'var(--color-warning)',
                  }}
                >
                  {claim.verdict.decision.toUpperCase()}
                </span>
                <span style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
                  confidence {(claim.verdict.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.55 }}>{claim.verdict.reasoning}</p>
              {!claim.verdictHash && (
                <button
                  className="btn btn-primary"
                  onClick={onPostVerdict}
                  disabled={claim.posting || !canPost}
                  style={{ marginTop: 12 }}
                >
                  {claim.posting ? <span className="spinner" /> : <Send size={14} strokeWidth={1.5} />}
                  {claim.posting ? 'Posting…' : 'Post verdict on-chain'}
                </button>
              )}
              {claim.verdictHash && (
                <>
                  <div
                    style={{
                      display: 'flex',
                      gap: 6,
                      alignItems: 'center',
                      marginTop: 12,
                      color: 'var(--color-success)',
                      fontSize: 13,
                      fontWeight: 500,
                    }}
                  >
                    <CheckCircle2 size={14} strokeWidth={1.5} /> Verdict posted
                  </div>
                  <div className="hash" style={{ marginTop: 8 }}>
                    {claim.verdictHash}
                    <button
                      className="btn btn-ghost"
                      style={{ padding: '2px 6px', marginLeft: 8, fontSize: 11 }}
                      onClick={() => navigator.clipboard.writeText(claim.verdictHash!)}
                    >
                      <Copy size={11} strokeWidth={1.5} />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {claim.error && (
        <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-accent)' }}>
          {claim.error}
        </div>
      )}
    </div>
  );
}
