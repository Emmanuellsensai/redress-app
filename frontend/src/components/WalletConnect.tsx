import { useEffect, useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { NETWORK_ID } from '@redress/sdk';
import { Wallet, Plug, LogOut, AlertCircle } from 'lucide-react';
import { errorText } from '../lib/errorText';
import { truncateHex } from '../lib/hex';

type Props = {
  onConnect: (api: ConnectedAPI, accountId: string) => void;
  onDisconnect?: () => void;
};

/**
 * Real Midnight wallet extensions (1am, Lace, and any connector-compliant
 * wallet) inject a *namespace* at `window.midnight`: a map whose values are
 * DApp Connector entries shaped `{ rdns, name, icon, apiVersion,
 * connect(networkId) }` (the InitialAPI type). There is no
 * `window.midnight.mn1am` / `mnLace` property and no `enable()` method —
 * code written against that imagined shape never detects a real wallet.
 * Discovery must enumerate `Object.values(window.midnight)` and offer every
 * entry with a working `connect`, exactly as the DApp Connector spec and the
 * proven Anonymous Whispers wiring do.
 *
 * Entries are injected asynchronously after page load, so we poll briefly and
 * re-check on window focus: enabling or unlocking a wallet and returning to
 * the tab then works without a manual reload.
 */
const DETECT_POLL_INTERVAL_MS = 100;
const DETECT_POLL_TIMEOUT_MS = 5000;

type DetectedWallet = {
  rdns: string;
  /** The wallet's own `name` from the injected entry, for button labels. */
  name: string;
  connect: (networkId: string) => Promise<ConnectedAPI>;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/**
 * Preference rank for ordering the detected list:
 * 0 = 1am first (sponsors tDUST out of the box, so proving Just Works on
 *     Preprod — and it is the wallet used for deploys);
 * 1 = any other non-Lace connector wallet (same connector-compliance
 *     guarantee, and avoids the locked-Lace-blocks-everything bug);
 * 2 = Lace, shown only when nothing else is injected alongside it.
 */
const preferenceRank = (wallet: Pick<DetectedWallet, 'rdns' | 'name'>): number => {
  const id = `${wallet.rdns} ${wallet.name}`.toLowerCase();
  if (id.includes('1am')) return 0;
  if (id.includes('lace')) return 2;
  return 1;
};

/**
 * Enumerates the injected connector entries and returns every connectable
 * wallet, deduplicated by rdns and ordered by preferenceRank. Any Midnight
 * DApp Connector wallet that is installed and injecting will show up here.
 */
const discoverWallets = (): DetectedWallet[] => {
  const midnight = (window as unknown as { midnight?: Record<string, unknown> }).midnight;
  const seen = new Set<string>();
  const found: DetectedWallet[] = [];
  for (const raw of Object.values(midnight ?? {})) {
    if (!isRecord(raw) || typeof raw.connect !== 'function') continue;
    const rdns = typeof raw.rdns === 'string' && raw.rdns.length > 0 ? raw.rdns : '';
    if (rdns && seen.has(rdns)) continue;
    if (rdns) seen.add(rdns);
    const connect = raw.connect as (networkId: string) => Promise<ConnectedAPI>;
    found.push({
      rdns,
      name: typeof raw.name === 'string' && raw.name.length > 0 ? raw.name : rdns || 'Midnight wallet',
      connect: connect.bind(raw),
    });
  }
  found.sort((a, b) => preferenceRank(a) - preferenceRank(b));
  return found;
};

/**
 * Method names hinted to the wallet at connect time so every permission
 * prompt appears at the natural connect moment instead of mid-submit. These
 * are every connector method the SDK touches after connecting.
 */
const USAGE_HINTS = [
  'getShieldedAddresses',
  'getProvingProvider',
  'balanceUnsealedTransaction',
  'submitTransaction',
] as const;

export default function WalletConnect({ onConnect, onDisconnect }: Props) {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [detecting, setDetecting] = useState(true);
  const [connectingKey, setConnectingKey] = useState<string | null>(null);
  const [connectedName, setConnectedName] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      const next = discoverWallets();
      setWallets(next);
      if (next.length > 0) {
        found();
        return;
      }
      if (Date.now() - startedAt >= DETECT_POLL_TIMEOUT_MS) {
        setDetecting(false);
        return;
      }
      pollTimer = window.setTimeout(poll, DETECT_POLL_INTERVAL_MS);
    };

    // Re-check when the tab regains focus: a wallet may have been enabled or
    // unlocked since the page loaded. Stays attached after polling times out,
    // so a later focus can still pick a wallet up without a reload.
    const onFocus = () => {
      const next = discoverWallets();
      setWallets(next);
      if (next.length > 0) found();
    };
    window.addEventListener('focus', onFocus);

    poll();

    return () => {
      clearPoll();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  const connect = async (wallet: DetectedWallet) => {
    const key = wallet.rdns || wallet.name;
    setError(null);
    setConnectingKey(key);
    try {
      // The injected entry itself is the connector: InitialAPI.connect
      // resolves to the ConnectedAPI everything else builds on.
      let api: ConnectedAPI;
      try {
        api = await wallet.connect(NETWORK_ID);
      } catch (err) {
        throw new Error(
          `Connection request was rejected by ${wallet.name}. ${
            err instanceof Error && err.message ? err.message : 'Approve the connection in the wallet to continue.'
          }`,
        );
      }

      // A wallet can be connected to a network other than the one hinted, so
      // the hint passed to connect() is not a guarantee. The contract only
      // exists on Preprod; calling it from any other network would fail deep
      // inside proving with a far less obvious message.
      const connectionStatus = await api.getConnectionStatus();
      if (connectionStatus.status !== 'connected') {
        throw new Error('Wallet reported a disconnected session. Unlock the wallet and try again.');
      }
      if (connectionStatus.networkId !== NETWORK_ID) {
        throw new Error(
          `Wrong network: wallet is on "${connectionStatus.networkId}". Switch ${wallet.name} to ${NETWORK_ID} and reconnect.`,
        );
      }

      // Feature-detected because wallet implementations can declare hintUsage
      // without implementing it (Lace sets it as an own property with the
      // value `undefined`), so a plain `'hintUsage' in api` check would pass
      // and then throw. Only a typeof check is safe.
      const hintUsage = (api as unknown as { hintUsage?: (names: string[]) => Promise<void> }).hintUsage;
      if (typeof hintUsage === 'function') {
        await hintUsage.call(api, [...USAGE_HINTS]);
      }

      let account: string;
      try {
        account = (await api.getUnshieldedAddress()).unshieldedAddress;
      } catch {
        // Older wallet builds exposed a plural array-returning variant.
        const plural = (api as unknown as {
          getUnshieldedAddresses?: () => Promise<string[]>;
        }).getUnshieldedAddresses;
        if (typeof plural !== 'function') throw new Error('Could not read the wallet address.');
        const addresses = await plural.call(api);
        const first = addresses[0];
        if (!first) throw new Error('Wallet returned no unshielded address.');
        account = first;
      }
      if (!account) throw new Error('Wallet returned no unshielded address.');

      setAccountId(account);
      setConnectedName(wallet.name);
      onConnect(api, account);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setConnectingKey(null);
    }
  };

  const disconnect = () => {
    setConnectedName(null);
    setAccountId(null);
    setError(null);
    onDisconnect?.();
  };

  if (connectedName && accountId) {
    return (
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          className="dot"
          style={{ background: 'var(--color-success)' }}
          aria-label="connected"
        />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: 'var(--color-ink-muted)' }}>
            Connected via {connectedName}
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
            Detecting installed Midnight wallets…
          </div>
        </div>
      </div>
    );
  }

  if (wallets.length === 0) {
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
            Install a Midnight wallet extension (e.g. the{' '}
            <a
              href="https://docs.midnight.network/develop/nodes-and-dapps/wallet/1am"
              target="_blank"
              rel="noreferrer"
              style={{ color: 'var(--color-accent)', textDecoration: 'underline' }}
            >
              1am wallet
            </a>{' '}
            or Lace), then reload this page. The wallet injects itself shortly after page load, so
            a reload often fixes a missed detection.
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
            Still stuck? Run <span className="mono">Object.keys(window.midnight)</span> in the
            browser console: if it lists connector entries (with <span className="mono">rdns</span>,{' '}
            <span className="mono">name</span>, <span className="mono">connect</span>) the wallet
            did inject and the app should detect it — reload to re-scan. An empty object means the
            extension is not injecting on this origin; try <span className="mono">localhost:5173</span>,
            the most reliably supported origin.
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
        {wallets.map((wallet, index) => {
          const key = wallet.rdns || `${wallet.name}-${index}`;
          const connecting = connectingKey === key;
          return (
            <button
              key={key}
              className={index === 0 ? 'btn btn-primary' : 'btn btn-ghost'}
              onClick={() => connect(wallet)}
              disabled={connectingKey !== null}
            >
              {connecting ? <span className="spinner" /> : <Plug size={14} strokeWidth={1.5} />}
              {wallet.name}
            </button>
          );
        })}
      </div>
      {error && (
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--color-accent)' }}>{error}</div>
      )}
    </div>
  );
}
