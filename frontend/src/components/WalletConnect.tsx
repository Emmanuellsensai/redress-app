import { useEffect, useState } from 'react';
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

export default function WalletConnect({ onConnect, onDisconnect }: Props) {
  const [available, setAvailable] = useState<{ oneAm: boolean; lace: boolean }>({
    oneAm: false,
    lace: false,
  });
  const [connecting, setConnecting] = useState<WalletKind | null>(null);
  const [connectedKind, setConnectedKind] = useState<WalletKind | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mw = (window as unknown as MidnightWindow).midnight;
    setAvailable({ oneAm: !!mw?.mn1am, lace: !!mw?.mnLace });
  }, []);

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
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
            Install the{' '}
            <a
              href="https://docs.midnight.network/develop/nodes-and-dapps/wallet/1am"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
            >
              1am wallet
            </a>{' '}
            or the Lace Midnight extension, then reload this page.
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
