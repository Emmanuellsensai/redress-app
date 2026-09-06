/**
 * Browser-side wiring for the deployed Redress contract.
 *
 * Ported from Anonymous Whispers `sdk/src/chain.ts` for the Redress circuit
 * surface: register_platform, submit_claim, post_verdict. The Node-side
 * equivalent lives in contract/scripts/deploy.ts.
 *
 *   Node                              Browser
 *   ─────────────────────────────    ─────────────────────────────────────
 *   NodeZkConfigProvider (fs)     →  FetchZkConfigProvider (HTTP, public/zk)
 *   httpClientProofProvider       →  dappConnectorProofProvider (wallet proves)
 *   wallet-sdk wallet object      →  createDAppConnectorWalletProvider
 *   levelPrivateStateProvider     →  same, but IndexedDB-backed
 */
import type { ConnectedAPI } from '@midnight-ntwrk/dapp-connector-api';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { dappConnectorProofProvider } from '@midnight-ntwrk/midnight-js-dapp-connector-proof-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { setNetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';
import { CostModel } from '@midnight-ntwrk/midnight-js-protocol/ledger';

import { Contract, ledger } from '@contract/redress/contract/index.js';
import { createDAppConnectorWalletProvider } from './wallet-provider';

/** Preprod. Sponsors DUST via 1am wallet to bypass Lace tDUST congestion. */
export const NETWORK_ID = 'preprod';

// The ledger WASM reads a process-global network id when serializing
// transactions; nothing in the browser path sets it. Without this, submit
// fails with "Network ID has not been configured"; the read path survives
// only because indexer GraphQL queries never touch that global. Module scope
// so it runs once, before any wallet or contract operation.
setNetworkId(NETWORK_ID);

/** Set after first deploy to Preprod (populated via /deploy admin route). */
export const CONTRACT_ADDRESS = '3bc1d9206114424bf47b621dfc8f3c67ba481de4ccb90b8b912d22343bb3c68c';

const INDEXER_URI = 'https://indexer.preprod.midnight.network/api/v4/graphql';
const INDEXER_WS_URI = 'wss://indexer.preprod.midnight.network/api/v4/graphql/ws';

/** Matches PRIVATE_STATE_ID used by Node deploy/cli scripts. */
const PRIVATE_STATE_ID = 'redressPrivateState';

/**
 * The SDK's circuit surface. Narrow compile-time typing; at runtime the
 * provider fetches whatever circuit id it is asked for.
 */
export type CircuitId = 'register_platform' | 'submit_claim' | 'post_verdict';

/** Both `submit_claim`'s `encrypted_evidence` and its envelope size. */
export const ENVELOPE_BYTES = 512;

/**
 * FetchZkConfigProvider runs `new URL(baseURL)` in its constructor and rejects
 * anything that isn't http(s), so a root-relative '/zk/...' throws on
 * construction. It must be absolute.
 */
const ZK_CONFIG_BASE_URL = `${window.location.origin}/zk/redress`;

/**
 * Placeholder that satisfies the private-state store's password policy (16+
 * chars, 3 of 4 character classes, no runs, no sequential patterns).
 *
 * This contract declares no witnesses, so its private state is permanently
 * `{}`: there is nothing secret in this store to protect. A real secret
 * would be required the moment a witness is added. The platform's curve25519
 * secret key is deliberately NOT in this store; it never touches the
 * Midnight SDK at all (see this package's crypto.ts).
 */
const PRIVATE_STATE_PASSWORD = 'Frontend-Devnet-Development-Placeholder-1';

const compiledContract = CompiledContract.make('redress', Contract).pipe(
  CompiledContract.withVacantWitnesses,
  // Resolved relative to the ZK config provider's base, so this is the path
  // segment under public/zk, not a filesystem path as it is in deploy.ts.
  CompiledContract.withCompiledFileAssets('redress'),
);

/**
 * The third argument is not optional in practice, despite its type.
 *
 * The provider defaults `webSocketImpl` to `ws.WebSocket` from `isomorphic-ws`,
 * whose browser build exports no such named binding, so the default resolves
 * to `undefined` and every subscription fails. The browser's native WebSocket
 * is the correct implementation here; the Node paths solve the same problem
 * by assigning `globalThis.WebSocket` from the `ws` package instead.
 */
export const publicDataProvider = indexerPublicDataProvider(
  INDEXER_URI,
  INDEXER_WS_URI,
  WebSocket as unknown as NonNullable<Parameters<typeof indexerPublicDataProvider>[2]>,
);

/** Public ledger state of the Redress contract. */
export type PublicState = {
  claimCount: bigint;
  platformPublicKey: Uint8Array | null;
  platformKeyVersion: bigint;
  /** Newest first (the contract pushes to the front of the list). */
  evidenceInbox: Uint8Array[];
  latestEvidenceHash: Uint8Array;
  latestVerdictHash: Uint8Array;
  verdictCount: bigint;
};

/** True for a missing or all-zero key, i.e. "no platform registered". */
export const isUnregisteredKey = (key: Uint8Array | null): boolean =>
  key === null || key.every((byte) => byte === 0);

/**
 * Reads the contract's public state straight from the indexer. Needs no
 * wallet, so everything (counters, platform key, inbox) renders before
 * connecting.
 */
export const readPublicState = async (): Promise<PublicState | null> => {
  if (!CONTRACT_ADDRESS) return null;
  const contractState = await publicDataProvider.queryContractState(CONTRACT_ADDRESS);
  if (!contractState) return null;
  const ledgerState = ledger(contractState.data);

  const evidenceInbox: Uint8Array[] = [];
  const rawList = ledgerState.evidence_inbox;
  if (rawList && typeof rawList[Symbol.iterator] === 'function') {
    for (const entry of rawList) evidenceInbox.push(entry);
  }

  const platformPublicKey = ledgerState.platform_public_key ?? null;
  return {
    claimCount: ledgerState.claim_count,
    platformPublicKey: isUnregisteredKey(platformPublicKey) ? null : platformPublicKey,
    platformKeyVersion: ledgerState.platform_key_version ?? 0n,
    evidenceInbox,
    latestEvidenceHash: ledgerState.latest_evidence_hash,
    latestVerdictHash: ledgerState.latest_verdict_hash,
    verdictCount: ledgerState.verdict_count,
  };
};

/**
 * Assembles the browser provider set shared by connectToContract and
 * deployRedressContract. Both need the same wallet-backed proving, indexer,
 * and private-state wiring; only what they hand to Midnight.js afterwards
 * differs.
 *
 * @param api The connected wallet: the object `InitialAPI.connect()` returned.
 * @param accountId The wallet's unshielded address, used to scope private-state
 *                  storage so two wallets in one browser stay isolated.
 */
const buildBrowserProviders = async (api: ConnectedAPI, accountId: string) => {
  // The constructor's default fetchFunc is cross-fetch's re-export of
  // window.fetch, a detached reference the provider invokes as
  // `this.fetchFunc(...)`, which throws "Illegal invocation" in browsers.
  // Passing an explicitly window-bound fetch keeps the required this-binding.
  const zkConfigProvider = new FetchZkConfigProvider<CircuitId>(
    ZK_CONFIG_BASE_URL,
    window.fetch.bind(window),
  );
  const walletProvider = await createDAppConnectorWalletProvider(api);

  return {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'redress-state',
      accountId,
      privateStoragePasswordProvider: () => PRIVATE_STATE_PASSWORD,
    }),
    publicDataProvider,
    zkConfigProvider,
    // Proving happens inside the wallet, so the prover key and ZKIR are
    // handed to it rather than to a local proof server. This is the
    // browser's whole reason for not needing docker compose running.
    proofProvider: await dappConnectorProofProvider(
      api,
      zkConfigProvider,
      CostModel.initialCostModel(),
    ),
    walletProvider,
    midnightProvider: walletProvider,
  };
};

/** Resolves the deployed contract at CONTRACT_ADDRESS. */
export const connectToContract = async (api: ConnectedAPI, accountId: string) => {
  const providers = await buildBrowserProviders(api, accountId);

  return findDeployedContract(providers, {
    compiledContract,
    contractAddress: CONTRACT_ADDRESS,
    privateStateId: PRIVATE_STATE_ID,
    // No witnesses on this contract, so there is no private state to seed.
    initialPrivateState: {},
  });
};

export type DeployedRedressContract = Awaited<ReturnType<typeof connectToContract>>;

/**
 * Deploys a brand new Redress instance on Preprod from the browser. Used by
 * the /deploy admin route; ordinary claimants and platforms never call this
 * — they use connectToContract against the already-deployed CONTRACT_ADDRESS.
 */
export const deployRedressContract = async (api: ConnectedAPI, accountId: string) => {
  const providers = await buildBrowserProviders(api, accountId);

  return deployContract(providers, {
    compiledContract,
    privateStateId: PRIVATE_STATE_ID,
    initialPrivateState: {},
  });
};

/** The slice of a callTx result the UI consumes. */
type CallTxOutcome = { public: { txId: string } };

/**
 * Redress circuit calls, typed structurally against the generated
 * `impureCircuits` shape. The parameter names mirror the Compact source.
 */
export const redressCallTx = (contract: DeployedRedressContract) =>
  contract.callTx as unknown as {
    register_platform(newPublicKey: Uint8Array): Promise<CallTxOutcome>;
    // (ciphertext, plaintext) — plaintext is the padded 256-byte evidence
    // passed through the circuit as a PRIVATE witness. The circuit computes
    // persistentHash of it in-circuit and discloses only the hash into
    // latest_evidence_hash; the plaintext bytes never touch the ledger.
    submit_claim(
      encryptedEvidence: Uint8Array,
      evidencePlaintext: Uint8Array,
    ): Promise<CallTxOutcome>;
    // Verdict text is a PRIVATE witness; only its persistentHash is
    // disclosed into latest_verdict_hash.
    post_verdict(verdictText: Uint8Array): Promise<CallTxOutcome>;
  };
