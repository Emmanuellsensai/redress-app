import { useCallback, useEffect, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { Wallet, Plug, LogOut, AlertCircle } from 'lucide-react';
import { errorText } from '../lib/errorText';
import { truncateHex } from '../lib/hex';

type EnableFn = () => Promise<{
  connect: (
    hintUsage?: unknown,
  ) => Promise<ConnectedAPI & { getUnshieldedAddresses: () => Promise<string[]> }>;
}>;

type MidnightWalletAPI = {
  enable: EnableFn;
};

type MidnightWindow = {
  midnight?: {
    mnLace?: MidnightWalletAPI;
    mn1am?: MidnightWalletAPI;
  };
};

type WalletKind = '1am' | 'lace';

type Props = {
  onConnect: (api: ConnectedAPI, accountId: string) => void;
  onDisconnect?: () => void;
};

/**
 * Wallet extensions inject `window.midnight` asynchronously, after the page
 * script has already run. A one-shot read on mount misses it whenever the
 * injection lands late (fresh page load, first visit to a new origin), so we
 * poll until the provider appears and re-check on window focus: enabling or
 * unlocking the wallet and returning to the tab then works without a manual
 * reload.
 */
const DETECT_POLL_INTERVAL_MS = 100;
const DETECT_POLL_TIMEOUT_MS = 5000;

export default function WalletConnect({ onConnect, onDisconnect }: Props) {
  const [available, setAvailable] = useState<{ oneAm: boolean; lace: boolean }>({
    oneAm: false,
    lace: false,
  });
  const [detecting, setDetecting] = useState(true);
  const [connecting, setConnecting] = useState<WalletKind | null>(null);
  const [connectedKind, setConnectedKind] = useState<WalletKind | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback((): boolean => {
    const mw = (window as unknown as MidnightWindow).midnight;
    const next = { oneAm: !!mw?.mn1am, lace: !!mw?.mnLace };
    setAvailable(next);
    return next.oneAm || next.lace;
  }, []);

  useEffect(() => {
    let pollTimer: number | undefined;

    const clearPoll = () => {
      if (pollTimer !== undefined) {
        window.clearTimeout(pollTimer);
        pollTimer = undefined;
      }
    };

    const found = () => {
      clearPoll();
      setDetecting(false);
    };

    const startedAt = Date.now();
    const poll = () => {
      if (detect()) {
        found();
        return;
      }
      if (Date.now() - startedAt >= DETECT_POLL_TIMEOUT_MS) {
        setDetecting(false);
        return;
      }
      pollTimer = window.setTimeout(poll, DETECT_POLL_INTERVAL_MS);
    };

    // Re-check when the tab regains focus: the wallet may have been enabled
    // or unlocked since the page loaded. Stays attached after polling times
    // out, so a later focus can still pick the wallet up without a reload.
    const onFocus = () => {
      if (detect()) found();
    };
    window.addEventListener('focus', onFocus);

    poll();

    return () => {
      clearPoll();
      window.removeEventListener('focus', onFocus);
    };
  }, [detect]);

  const connect = async (kind: WalletKind) => {
    setError(null);
    setConnecting(kind);
    try {
      const mw = (window as unknown as MidnightWindow).midnight;
      const provider = kind === '1am' ? mw?.mn1am : mw?.mnLace;
      if (!provider) throw new Error('Wallet no longer available');

      const initial = await provider.enable();

      // Some wallets (Lace) declare hintUsage but don't implement it. Try
      // without a hint first, fall back to a no-arg call on failure.
      let api;
      try {
        api = await initial.connect();
      } catch {
        api = await (initial.connect as () => Promise<
          ConnectedAPI & { getUnshieldedAddresses: () => Promise<string[]> }
        >)();
      }

      const addrs = await api.getUnshieldedAddresses();
      const account = addrs[0];
      if (!account) throw new Error('Wallet returned no unshielded addresses');

      setAccountId(account);
      setConnectedKind(kind);
      onConnect(api as ConnectedAPI, account);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setConnecting(null);
    }
  };

  const disconnect = () => {
    setConnectedKind(null);
    setAccountId(null);
    setError(null);
    onDisconnect?.();
  };

  if (connectedKind && accountId) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          className="dot"
          style={{ background: 'var(--color-success)' }}
          aria-label="connected"
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
            Connected via {connectedKind === '1am' ? '1am' : 'Lace'}
          </div>
          <div className="mono" style={{ marginTop: 2 }}>
            {truncateHex(accountId, 10, 8)}
          </div>
        </div>
        <button className="btn btn-ghost" onClick={disconnect}>
          <LogOut size={14} strokeWidth={1.5} />
          Disconnect
        </button>
      </div>
    );
  }

  if (detecting) {
    return (
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <span className="spinner" />
        <div>
          <div style={{ fontWeight: 500 }}>Looking for your Midnight wallet…</div>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
            Detecting the 1am or Lace extension…
          </div>
        </div>
      </div>
    );
  }

  if (!available.oneAm && !available.lace) {
    return (
      <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <AlertCircle
          size={20}
          strokeWidth={1.5}
          style={{ color: 'var(--color-warning)', flexShrink: 0, marginTop: 2 }}
        />
        <div>
          <div style={{ fontWeight: 500, marginBottom: 4 }}>No Midnight wallet detected</div>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.55 }}>
            Install the{' '}
            <a
              href="https://docs.midnight.network/develop/nodes-and-dapps/wallet/1am"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
            >
              1am wallet
            </a>{' '}
            or the Lace Midnight extension, then reload this page. The wallet injects itself
            shortly after page load, so a reload often fixes a missed detection.
          </div>
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--color-border)',
              fontSize: 12,
              color: 'var(--color-ink-muted)',
              lineHeight: 1.55,
            }}
          >
            Still stuck? Run{' '}
            <span className="mono">!!window.midnight</span> in the browser console:{' '}
            <span className="mono">false</span> means the wallet never injected on this site —
            check the extension is enabled for this origin, or run the app locally at{' '}
            <span className="mono">localhost:5173</span>, the most reliably supported origin for
            the 1am wallet.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <Wallet size={16} strokeWidth={1.5} />
        <span style={{ fontWeight: 500 }}>Connect a wallet</span>
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {available.oneAm && (
          <button
            className="btn btn-primary"
            onClick={() => connect('1am')}
            disabled={connecting !== null}
          >
            {connecting === '1am' ? <span className="spinner" /> : <Plug size={14} strokeWidth={1.5} />}
            1am
          </button>
        )}
        {available.lace && (
          <button
            className="btn btn-ghost"
            onClick={() => connect('lace')}
            disabled={connecting !== null}
          >
            {connecting === 'lace' ? <span className="spinner" /> : <Plug size={14} strokeWidth={1.5} />}
            Lace
          </button>
        )}
      </div>
      {error && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-accent)' }}>{error}</div>
      )}
    </div>
  );
}