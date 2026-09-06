import { useEffect, useMemo, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import nacl from 'tweetnacl';
import {
  connectToContract,
  generatePlatformKeypair,
  openEvidence,
  readPublicState,
  redressCallTx,
  stripPadding,
  type PublicState,
} from '@redress/sdk';
import {
  KeyRound,
  Send,
  AlertCircle,
  Unlock,
  Lock,
  Inbox,
} from 'lucide-react';
import WalletConnect from '../components/WalletConnect';
import { errorText } from '../lib/errorText';
import { fromHex, toHex, truncateHex } from '../lib/hex';

const SK_STORAGE_KEY = 'redress_platform_sk';

/**
 * The platform-side view.
 *
 * With the reporter-centric flow, adjudication happens on the claimant's
 * device: they see the AI verdict, decide, and post the verdict on-chain
 * themselves. The platform is a **passive receiver** of those decisions.
 *
 * This page shows:
 *   - Registration (first time): generate keypair, publish public key.
 *   - Inbox: every sealed envelope on-chain, plus counts of claims and
 *     verdicts. Ops can decrypt any envelope locally to inspect the
 *     underlying evidence for auditing, but they don't need to post any
 *     transactions — the reporters do that.
 */
export default function Dashboard() {
  const [state, setState] = useState<PublicState | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);

  const [storedSkHex, setStoredSkHex] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [pendingKeypair, setPendingKeypair] = useState<nacl.BoxKeyPair | null>(null);

  const [decrypted, setDecrypted] = useState<Record<number, string>>({});

  const refresh = async () => {
    try {
      const s = await readPublicState();
      setState(s);
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

  const generateKeys = () => setPendingKeypair(generatePlatformKeypair());

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

  const decrypt = (idx: number, envelope: Uint8Array) => {
    if (!storedSkHex) return;
    try {
      const opened = openEvidence(envelope, fromHex(storedSkHex));
      if (!opened) {
        setDecrypted((d) => ({ ...d, [idx]: '(decryption failed)' }));
        return;
      }
      const text = new TextDecoder().decode(stripPadding(opened));
      setDecrypted((d) => ({ ...d, [idx]: text }));
    } catch (err) {
      setDecrypted((d) => ({ ...d, [idx]: errorText(err) }));
    }
  };

  return (
    <main className="container" style={{ padding: '48px 0 80px', maxWidth: 900 }}>
      <h1 style={{ fontSize: 34, marginBottom: 12 }}>Platform Dashboard</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: 24 }}>
        Register your platform, then watch claims resolve. Reporters drive the adjudication and
        commit verdicts themselves; you receive them and act on the decisions.
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
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <Metric label="Claims received" value={String(state.claimCount)} />
            <Metric label="Verdicts posted" value={String(state.verdictCount)} />
            <Metric
              label="Platform key"
              mono
              value={truncateHex(toHex(state.platformPublicKey), 8, 6)}
            />
          </div>

          {isRegisteredPlatform ? (
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="dot" style={{ background: 'var(--color-success)' }} />
                <div style={{ fontWeight: 600 }}>You are the registered platform.</div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', marginTop: 6 }}>
                Your platform secret key is stored in this browser. Claims are encrypted to it and
                can be decrypted below for auditing.
              </div>
            </div>
          ) : (
            <div className="card" style={{ marginBottom: 20 }}>
              <AlertCircle size={16} strokeWidth={1.5} style={{ color: 'var(--color-warning)', marginRight: 6, verticalAlign: 'middle' }} />
              A different platform is registered on-chain, or you have no secret key in this
              browser. You can still see the on-chain metadata below, but envelopes cannot be
              decrypted here.
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 12px' }}>
            <Inbox size={18} strokeWidth={1.6} />
            <h2 style={{ fontSize: 20, margin: 0 }}>
              Inbox ({state.evidenceInbox.length} sealed envelope{state.evidenceInbox.length === 1 ? '' : 's'})
            </h2>
          </div>

          {state.evidenceInbox.length === 0 ? (
            <div className="card">No claims yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {state.evidenceInbox.map((envelope, index) => (
                <EnvelopeRow
                  key={index}
                  index={index}
                  envelope={envelope}
                  decryptedText={decrypted[index]}
                  canDecrypt={isRegisteredPlatform}
                  onDecrypt={() => decrypt(index, envelope)}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  );
}

function Metric({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        padding: '18px 4px 18px 18px',
        borderLeft: '2px solid var(--color-border)',
      }}
    >
      <div
        style={{
          fontFamily: mono ? 'var(--font-mono)' : 'var(--font-display)',
          fontSize: mono ? 15 : 32,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          lineHeight: 1,
          marginBottom: 8,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--color-ink-muted)' }}>{label}</div>
    </div>
  );
}

function EnvelopeRow({
  index,
  envelope,
  decryptedText,
  canDecrypt,
  onDecrypt,
}: {
  index: number;
  envelope: Uint8Array;
  decryptedText?: string;
  canDecrypt: boolean;
  onDecrypt: () => void;
}) {
  return (
    <div className="card">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <div style={{ fontWeight: 600 }}>Envelope #{index + 1}</div>
        {decryptedText ? (
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

      {decryptedText ? (
        <div
          style={{
            padding: 12,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            fontSize: 14,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {decryptedText}
        </div>
      ) : (
        <button className="btn btn-ghost" onClick={onDecrypt} disabled={!canDecrypt}>
          <Unlock size={14} strokeWidth={1.5} /> Decrypt for audit
        </button>
      )}

      <div style={{ marginTop: 10, fontSize: 11, color: 'var(--color-ink-muted)' }}>
        Ciphertext {envelope.byteLength} bytes
      </div>
    </div>
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
      <h2 style={{ fontSize: 22, marginBottom: 8 }}>Register your platform</h2>
      <p style={{ fontSize: 14, color: 'var(--color-ink-muted)', marginBottom: 16 }}>
        Generate a curve25519 keypair. The public key is published on-chain so claimants can encrypt
        evidence to you; the secret key stays in this browser only.
      </p>

      {!pendingKeypair ? (
        <button className="btn btn-ghost" onClick={onGenerate}>
          <KeyRound size={14} strokeWidth={1.5} /> Generate keypair
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
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-warning)' }}>{error}</div>
      )}
    </div>
  );
}
