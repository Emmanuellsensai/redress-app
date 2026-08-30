import { useState } from 'react';
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { deployRedressContract } from '@redress/sdk';
import { Rocket, AlertCircle } from 'lucide-react';
import WalletConnect from '../components/WalletConnect';
import { errorText } from '../lib/errorText';

export default function DeployContract() {
  const [api, setApi] = useState<ConnectedAPI | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [deploying, setDeploying] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deploy = async () => {
    if (!api || !accountId) return;
    setDeploying(true);
    setError(null);
    try {
      const deployed = await deployRedressContract(api, accountId);
      // The deployed contract exposes its address on `.deployTxData.public.contractAddress`
      // per Midnight.js conventions; fall back to any obvious address field.
      const anyDeployed = deployed as unknown as {
        deployTxData?: { public?: { contractAddress?: string } };
        contractAddress?: string;
      };
      const addr =
        anyDeployed.deployTxData?.public?.contractAddress ??
        anyDeployed.contractAddress ??
        JSON.stringify(deployed);
      setAddress(addr);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setDeploying(false);
    }
  };

  return (
    <main className="container" style={{ padding: '48px 0', maxWidth: 720 }}>
      <h1 style={{ fontSize: 32, marginBottom: 12 }}>Deploy Contract</h1>
      <p style={{ color: 'var(--color-ink-muted)', marginBottom: 24 }}>
        Admin route. Deploys a new Redress contract instance to Midnight Preprod. Expect this to
        take 1–2 minutes.
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

      {api && accountId && !address && (
        <button
          className="btn btn-primary"
          onClick={deploy}
          disabled={deploying}
          style={{ marginBottom: 16 }}
        >
          {deploying ? <span className="spinner" /> : <Rocket size={14} strokeWidth={1.5} />}
          {deploying ? 'Deploying to Preprod…' : 'Deploy Contract'}
        </button>
      )}

      {address && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Deployed contract address</div>
          <div className="hash">{address}</div>
          <div className="notice" style={{ marginTop: 16, marginBottom: 0 }}>
            Update <span className="mono">CONTRACT_ADDRESS</span> in{' '}
            <span className="mono">sdk/src/chain.ts</span> with this value, then rebuild and
            redeploy the frontend.
          </div>
        </div>
      )}

      {error && (
        <div
          className="card"
          style={{ display: 'flex', gap: 12, alignItems: 'flex-start', borderColor: 'var(--color-accent)' }}
        >
          <AlertCircle
            size={20}
            strokeWidth={1.5}
            style={{ color: 'var(--color-accent)', flexShrink: 0, marginTop: 2 }}
          />
          <div style={{ fontSize: 14, color: 'var(--color-ink)' }}>{error}</div>
        </div>
      )}
    </main>
  );
}
