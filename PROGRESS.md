# Wave 1 Progress

## What was built

Everything in this repository was built from scratch during Wave 1 (August 27 – September 16, 2026). No code was carried over verbatim from any prior project. The SDK's chain-layer and wallet-provider patterns are ports of the corresponding files from Anonymous Whispers (a prior public dApp by the same builder), rewritten for the Redress contract's circuit surface. Every domain type, every ledger field, every circuit call was written for this project.

### Compact Contract (`contract/`)

- `contract/src/redress.compact`: three circuits:
  - `register_platform(new_public_key: Bytes<32>)`: discloses the platform's curve25519 public key; increments a rotation counter.
  - `submit_claim(encrypted_evidence: Bytes<512>, evidence_plaintext: Bytes<256>)`: plaintext is a private witness; the circuit computes `persistentHash(plaintext)` in-circuit and discloses only the hash into `latest_evidence_hash`. The sealed envelope is pushed onto the public `evidence_inbox`.
  - `post_verdict(verdict_text: Bytes<256>)`: verdict text is a private witness; only its `persistentHash` reaches `latest_verdict_hash`.
- All three circuits use in-circuit `persistentHash` to bind private witnesses to public commitments. No private input is declared without a constraint (the mistake that got Anonymous Whispers' initial submission rejected: deliberately avoided here).
- Compiles cleanly with `compact compile` (verified: `register_platform` k=9 rows=303, `submit_claim` k=14 rows=16129, `post_verdict` k=14 rows=11832).
- Compiled artifacts (`contract/managed/redress/`) committed to git so the frontend renders without a local Compact toolchain.

### SDK (`sdk/`)

- `sdk/src/chain.ts`: browser provider wiring for all three circuits. `setNetworkId('preprod')` at module scope; `window.fetch.bind(window)` explicitly passed to `FetchZkConfigProvider`; native `WebSocket` explicitly passed to `indexerPublicDataProvider`. Exports `readPublicState`, `connectToContract`, `deployRedressContract`, `redressCallTx`, `isUnregisteredKey`.
- `sdk/src/crypto.ts`: nacl.box sealed envelope: single-use ephemeral keypair per submission, 24-byte nonce, ciphertext for 256-byte padded plaintext, 512-byte fixed envelope layout to prevent length leaks.
- `sdk/src/wallet-provider.ts`: DApp Connector bridge: `serialize()` → hex → connector → hex → `Transaction.deserialize(...)` round-trip; `identifiers()[0]` used for the transaction id (per Midnight docs, `transactionHash()` is not safe because merging can change it).
- `sdk/src/types.ts`: `ClaimType`, `ClaimStatus`, `Verdict`, `PublicState` domain types.
- `sdk/test/crypto.test.ts`: six passing unit tests: round-trip, wrong-key rejection, padding (pad + truncate), padding removal, ephemeral uniqueness.

### Frontend (`frontend/`)

Five routes, all wired through the SDK:

- **`/` Landing**: product pitch, three-step how-it-works, Midnight explainer, Framer Motion entrance animations.
- **`/submit` Submit Claim**: reads platform key from chain, encrypts evidence in-browser, calls `submit_claim(envelope, paddedPlaintext)`, displays tx id and the new `latest_evidence_hash`.
- **`/dashboard` Dashboard**: two modes:
  - *Not registered:* generate keypair, warn about `localStorage`, call `register_platform`.
  - *Registered:* verify browser-stored SK derives to the on-chain PK; decrypt each envelope; per-claim `claimType` selector; call `fetchVerdict` (real AI, with spinner + retry on error); post the padded verdict JSON via `post_verdict`.
- **`/verify` Verify**: no wallet; SHA-256 of padded plaintext vs on-chain hash; caveat about `persistentHash` domain separator surfaced in the UI.
- **`/deploy` Deploy**: admin route calling `deployRedressContract`; reminds admin to update `CONTRACT_ADDRESS` in `sdk/src/chain.ts`.

Design system: warm palette (burnt sienna `#B8432F`, parchment `#F5F0E8`, forest green `#2D6A4F`); Fraunces + Inter + IBM Plex Mono; lucide-react icons stroke 1.5; no purple, no gradients, no glow effects. All colors resolve through CSS custom properties in `frontend/src/styles/tokens.css` (no raw Tailwind color classes in JSX).

### Verdict Worker (`verdict-worker/` + `frontend/api/verdict.ts`)

- **Gemini 3.6 Flash primary, Groq Llama 3.1 8B Instant fallback.** Both providers receive the same structured system prompt constraining output to a strict JSON schema.
- **Per-claim-type context.** Fraud, refund, chargeback, KYC exception, and account appeal each get a claim-context paragraph appended to the user prompt.
- **JSON validation.** Response is parsed with markdown-fence stripping, then validated (decision enum, confidence range, non-empty reasoning).
- **Two runtime shapes from one handler.** `handleVerdictRequest` in `verdict-worker/src/handler.ts` is shared between `frontend/api/verdict.ts` (Vercel serverless) and `verdict-worker/src/dev-server.ts` (plain Node HTTP, CORS-enabled for `localhost:5173`).
- **Frontend URL switching.** `frontend/src/lib/verdict-client.ts` points at `http://localhost:3001/api/verdict` in dev, `/api/verdict` in production.

### Infrastructure

- Monorepo with npm workspaces (`contract`, `sdk`, `frontend`, `verdict-worker`).
- Root `overrides` pinning `@midnight-ntwrk/wallet-sdk 1.2.0`, `ledger-v8 8.1.0`, `onchain-runtime-v3 3.0.0`: prevents the duplicate-package `instanceof` failures that hit Anonymous Whispers.
- GitHub Actions CI: three-job pipeline (contract test, SDK test, frontend build) on push and PR to `main`.
- Vite 8 with `optimizeDeps.exclude` for the three WASM Midnight packages. No `vite-plugin-wasm` (SIGBUS on Vite 8).
- `Buffer` polyfill as the first import in `main.tsx` (ES import hoisting requirement).
- Vercel `rewrites` explicitly routing `/api/verdict` to the serverless function before the SPA fallback.
- Apache 2.0 license.
- `midnightntwrk` topic on the GitHub repo (required for buildathon submission).

## What is NOT in Wave 1

Deliberate scope cuts, called out honestly rather than glossed over:

- **Two-party disputes.** Wave 1 is single-party: a claimant submits, the platform adjudicates. Two-sided disputes (both parties encrypt to a shared arbiter public key, both witnesses hashed in-circuit) are proposed for Wave 2.
- **File evidence beyond text.** The `Bytes<256>` witness limit is a hackathon simplification. Wave 2 would chunk encrypted uploads with per-chunk hashes.
- **Multi-model verdict panel.** One model at a time, with a fallback. Wave 2 would run three providers in parallel and use majority voting.
- **Human reviewer marketplace.** Wave 3.
- **Access control on `register_platform`.** Anyone can register a platform key. In production a permissioned registry or on-chain reputation gate would be required.
- **Production-grade secret key management.** The platform's decryption key lives in the browser's `localStorage`. Fine for a hackathon demo; a KMS or hardware-key-backed flow would be required for real deployment.
- **Persistent claim state.** The contract stores only counters, hashes, and the append-only inbox. Per-claim status (submitted → verdict_issued → resolved) is not tracked on-chain; the platform maintains that off-chain.
