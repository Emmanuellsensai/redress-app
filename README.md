# Redress — Privacy-Preserving Claims Infrastructure on Midnight

Private claims. Verifiable verdicts.

Built for the [Midnight Network Buildathon](https://akindo.io) — Wave 1 (August 27 – September 16, 2026).

---

## 1. What is Redress?

RedressApp is a drop-in SDK and Compact smart contract that lets any fintech, marketplace, or platform handle user claims — fraud reports, refund requests, chargebacks, KYC exceptions, account appeals — with cryptographically private evidence and AI-issued verdicts, auditable to regulators without the app itself ever holding the sensitive data in plaintext. Built on Midnight's dual-ledger model using zero-knowledge proofs.

## 2. The Problem

Every consumer app has a "contact support" or "dispute this transaction" button. Behind it, users email screenshots of bank statements, share chat logs with strangers in support inboxes, and expose sensitive evidence to public arbitration. Companies custody that evidence forever. Regulators cannot audit without a full data dump. Nobody is happy — not the user, not the operator, not the regulator.

## 3. How Redress Solves It

Three steps:

1. **Encrypt & Submit.** The claimant encrypts evidence to the platform's curve25519 public key in-browser using a single-use ephemeral keypair. The chain stores only a hash commitment and the encrypted envelope; the plaintext never leaves the submitter's browser unencrypted.
2. **AI Adjudication.** The platform decrypts the evidence off-chain and triggers an AI verdict worker (Gemini primary, Groq fallback). The verdict reasoning stays private; only its hash goes on-chain.
3. **Verify Anywhere.** A regulator, auditor, or the claimant themselves can re-hash the plaintext evidence and verdict locally and compare against the on-chain commitments. Green check or red X. No trust required.

## 4. Architecture

| Component | Path | Purpose |
| --- | --- | --- |
| Compact contract | `contract/src/redress.compact` | Three circuits: `register_platform`, `submit_claim`, `post_verdict` |
| SDK | `sdk/src/` | Chain interaction, nacl.box envelope crypto, DApp Connector wallet bridge |
| Frontend | `frontend/src/` | React 19 / Vite 8 / Tailwind 4 UI with five routes |
| Verdict worker | `verdict-worker/src/` and `frontend/api/verdict.ts` | Gemini + Groq AI adjudication (Vercel serverless in production) |

## 5. Privacy Model

**Public ledger** (`export ledger` fields on the contract):
- `claim_count`, `verdict_count` — Counters
- `platform_public_key`, `platform_key_version` — curve25519 public key (safe to disclose by construction) and its rotation counter
- `evidence_inbox` — list of 512-byte encrypted envelopes (unreadable without the platform's secret key)
- `latest_evidence_hash`, `latest_verdict_hash` — one-way hash commitments

**Private inputs** (witnesses to the ZK circuit):
- Evidence plaintext (256-byte padded)
- Verdict text (256-byte padded serialized JSON)

`persistentHash` is computed **in-circuit** over the private witness, and only the hash is disclosed into the public ledger. The ZK proof enforces that a caller cannot post an arbitrary hash without knowing the preimage.

Envelope encryption uses a single-use ephemeral curve25519 keypair per submission, so **sender identity is cryptographically unrecoverable** — the ephemeral secret key is discarded after encryption and never touches storage or the chain.

## 6. Tech Stack

- **Compact** (smart contract language)
- **Midnight.js SDK 4.1.1** (`midnight-js-contracts`, `-indexer-public-data-provider`, `-dapp-connector-proof-provider`, `-fetch-zk-config-provider`, `-level-private-state-provider`, `-protocol`)
- **TypeScript 6**, **React 19**, **Vite 8**, **Tailwind CSS 4**
- **tweetnacl** (curve25519 nacl.box)
- **Framer Motion** for entrance animations
- **Gemini 3.6 Flash** primary, **Groq Llama 3.1 8B Instant** fallback
- **Vercel** (frontend hosting + serverless `/api/verdict`)
- **1am wallet** (bypasses Lace tDUST congestion on Preprod)

## 7. Prerequisites

- Node.js ≥ 22
- npm
- 1am wallet or Lace Midnight extension in a Chromium browser
- Gemini and/or Groq API key for the verdict worker
- Linux/macOS (or WSL on Windows) to compile the Compact contract — the Compact toolchain has no native Windows binary

## 8. Setup and Run

```bash
git clone https://github.com/Emmanuellsensai/redress-app.git
cd redress-app
npm install
```

Create a `.env` at the repository root (see `.env.example`):

```
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key
```

Start the verdict worker (Terminal 1):

```bash
env $(grep -v '^#' .env | xargs) npx tsx verdict-worker/src/dev-server.ts
```

Start the frontend (Terminal 2):

```bash
npm run --workspace=frontend dev
```

Open http://localhost:5173.

## 9. The Compact Contract

Three circuits, all binding private witnesses to public commitments via `persistentHash`:

- `register_platform(new_public_key: Bytes<32>)` — publishes the platform's curve25519 public key so claimants can encrypt evidence to it.
- `submit_claim(encrypted_evidence: Bytes<512>, evidence_plaintext: Bytes<256>)` — appends the sealed envelope to the public inbox and commits `persistentHash(evidence_plaintext)` to `latest_evidence_hash`. The plaintext witness never leaves the circuit.
- `post_verdict(verdict_text: Bytes<256>)` — commits `persistentHash(verdict_text)` to `latest_verdict_hash`. The verdict reasoning is private; only the hash is public.

Full source with inline privacy analysis: [`contract/src/redress.compact`](contract/src/redress.compact).

Compile (Linux/macOS/WSL):

```bash
npm run --workspace=contract compile
```

Compiled artifacts under `contract/managed/redress/` are committed to git so the frontend can render without a local Compact toolchain.

## 10. Testing

```bash
npm run --workspace=sdk test        # 6 crypto round-trip / rejection tests
npm run --workspace=contract test   # contract simulation placeholder
```

## 11. Deployment

- **Frontend**: Vercel. Build command `npm run --workspace=frontend build:web`, output `frontend/dist`.
- **Contract**: Deploy via the browser `/deploy` route with the 1am wallet connected (avoids Lace tDUST designation delays on Preprod).
- **Verdict worker**: served as a Vercel serverless function at `/api/verdict`. Set `GEMINI_API_KEY` and `GROQ_API_KEY` as Vercel environment variables.

After deploying the contract, paste the returned address into `sdk/src/chain.ts`:

```typescript
export const CONTRACT_ADDRESS = 'paste_your_address_here';
```

Then rebuild the frontend and redeploy.

## 12. Live Demo

<!-- Fill in with the actual Vercel URL after deploy -->
`https://redress-app.vercel.app` (replace with your Vercel URL)

## 13. Wave 1 Scope and Roadmap

- **Wave 1 (this submission)** — single-party claim reporting, in-browser encryption, AI verdicts, on-chain hash commitments, regulator verification.
- **Wave 2 (planned)** — two-party disputes, encrypted file evidence beyond text, multi-model verdict panel.
- **Wave 3 (planned)** — human reviewer marketplace with reputation, pilot integration with a Midnight-native app.

## 14. License

Apache 2.0 — see [LICENSE](LICENSE).

## 15. Team

Redress Labs. Solo builder: Emmanuel — [@Emmanuellsensai](https://github.com/Emmanuellsensai).
