# Redress: Privacy-Preserving Claims Infrastructure for Consumer Apps

Midnight Buildathon 2026 — Wave 1 submission
Team: Redress Labs — [@Emmanuellsensai](https://github.com/Emmanuellsensai)

## 1. Abstract

Every consumer application that touches money, identity, or reputation has a dispute button. Behind that button is the same broken pattern: users email screenshots of bank statements to strangers, companies custody sensitive evidence forever, and regulators cannot audit the process without a full data dump. The evidence — the exact thing the user is trying to prove — is exposed at every step to parties who have no need to see it in plaintext.

Redress is a drop-in SDK and Compact smart contract that lets any fintech, marketplace, or platform accept claims (fraud reports, refund requests, chargebacks, KYC exceptions, account appeals) with cryptographically private evidence, AI-issued verdicts, and on-chain hash commitments. The claim's plaintext never touches the ledger; only its `persistentHash` is disclosed. Regulators verify by re-hashing the plaintext they were given and matching it against the on-chain commitment — no trust, no data dump.

## 2. Motivation

Consumer-app disputes are handled today by exposing the private thing to whoever might be able to help. That model made sense when the only tools available were email and a support queue. It stopped making sense the moment we had zero-knowledge cryptography.

Midnight's dual-ledger model — a public commitment side and a shielded execution side — is a direct fit for this problem. Evidence can live on the shielded side (as a hash commitment bound to a private witness) while everything a regulator, auditor, or downstream integrator would want to see stays on the public side. Selective disclosure means the same commitment can be verified by different parties given only the plaintext relevant to them.

The alternative — status-quo dispute resolution over centralized custody — leaves three parties unhappy:

- **Users** ship private data to strangers and lose control of it forever.
- **Operators** carry compliance liability for evidence they never wanted to store.
- **Regulators** must trust the operator's data dump when auditing the fairness of the process.

Redress replaces this with a system where the operator adjudicates over decrypted evidence they alone can read, and everyone else — auditor, regulator, claimant — can verify the process without seeing what was said.

## 3. Design

### 3.1 Compact contract

Three circuits, all binding private witnesses to public commitments via in-circuit `persistentHash`:

- `register_platform(new_public_key: Bytes<32>)` — publishes the platform's curve25519 public key on the public ledger. Increments a version counter for rotation detection.
- `submit_claim(encrypted_evidence: Bytes<512>, evidence_plaintext: Bytes<256>)` — the plaintext is a **private witness**. The circuit computes `persistentHash(evidence_plaintext)`, discloses only the hash into `latest_evidence_hash`, and appends the sealed envelope to `evidence_inbox`. The proof enforces that the caller knew the plaintext behind the disclosed hash.
- `post_verdict(verdict_text: Bytes<256>)` — the verdict text is a private witness. The circuit discloses only `persistentHash(verdict_text)` into `latest_verdict_hash`.

Full source with inline privacy analysis: [`contract/src/redress.compact`](contract/src/redress.compact).

### 3.2 Envelope encryption

Evidence is sealed to the platform's public key using `nacl.box`, a Curve25519 + XSalsa20-Poly1305 authenticated construction. Each envelope uses a **single-use ephemeral keypair**. The ephemeral secret key is discarded immediately after encryption, so the sender's cryptographic identity is unrecoverable even to an adversary who later compromises the sender's device.

Envelope layout (`Bytes<512>` on-chain):

```
Offset 0..31    ephemeral public key (32)
Offset 32..55   nonce (24)
Offset 56..327  nacl.box ciphertext (272 = 256 + 16 Poly1305 tag)
Offset 328..511 zero padding (184)
```

The plaintext is padded to a fixed 256 bytes before encryption so the ciphertext length cannot reveal message length.

### 3.3 Verdict worker

An off-chain AI adjudicator. Runs as a Vercel serverless function in production and a plain Node HTTP server for local development, sharing the same handler. Gemini 3.6 Flash is the primary provider; on any Gemini error (rate limit, model deprecation, quota) it falls back to Groq (Llama 3.1 8B Instant). Each provider is given a structured system prompt that constrains the response to JSON with a fixed schema (`decision` ∈ `{approved, denied, escalate}`, `confidence` ∈ [0, 1], `reasoning` ≤ 3 sentences).

The verdict text is serialized to a compact JSON blob (`{d, c, r, t, ts}`), padded to 256 bytes, and passed to `post_verdict` as a private witness. Only `persistentHash` of that blob reaches the ledger.

### 3.4 Verify flow

The `/verify` page requires no wallet. Given the plaintext evidence and the plaintext verdict (both delivered out-of-band, e.g. by the platform to the auditor), the browser pads each to 256 bytes and re-hashes locally, then compares against `latest_evidence_hash` and `latest_verdict_hash` read from the indexer. Green check if they match, red X if they don't.

## 4. Privacy Analysis

**Shielded (private witnesses to the ZK circuit):**

- Evidence plaintext — never disclosed. Only its `persistentHash` reaches the ledger. The ZK proof enforces that the caller knew a real plaintext behind the disclosed hash.
- Verdict reasoning — same treatment.
- Sender identity — the ephemeral keypair used to seal each envelope is discarded immediately. Only the platform's secret key can decrypt, and no on-chain data ties an envelope back to any specific claimant.

**Public (safe to disclose by construction):**

- `claim_count`, `verdict_count` — plain counters. No information about individual claims.
- `platform_public_key` — a public key. Safe to publish by the definition of public-key cryptography.
- `platform_key_version` — rotation counter. Reveals only how many times the platform rotated.
- `evidence_inbox` — 512-byte ciphertexts. Unreadable without the platform's secret key. Length is fixed, so message length cannot leak.
- `latest_evidence_hash`, `latest_verdict_hash` — one-way hashes. Preimage-resistant.

## 5. Wave Plan

- **Wave 1 (this submission):** single-party claim submission, in-browser envelope encryption, AI verdict, on-chain verdict commitment, browser-side regulator verification.
- **Wave 2 (proposed):** two-party disputes (both sides encrypt to a shared arbiter public key), file evidence beyond text (chunked encrypted uploads with per-chunk hashes), multi-model verdict panel (Gemini + Groq + Anthropic voting).
- **Wave 3 (proposed):** human-reviewer marketplace with on-chain reputation (staked reviewers earn or slash based on downstream regulator audits), pilot integration with at least one Midnight-native application.

## 6. Competitive Landscape

Existing on-chain dispute resolution — Kleros is the canonical example — makes evidence public to jurors and the world. That is a deliberate design choice for adversarial arbitration on open blockchains; it is also the reason those systems cannot be used for anything a user considers sensitive (bank statements, medical records, KYC documents). Redress inverts the tradeoff: evidence stays private end-to-end, verifiability is provided by hash commitments and selective disclosure rather than by public jurors.

Honest scope: this is Wave 1. It is not yet production-ready. The platform's decryption key lives in browser `localStorage`; the verdict engine is a hackathon prompt, not a hardened adjudication service; there is no access control on `register_platform`. These are Wave 2/3 concerns, called out explicitly in [PROGRESS.md](PROGRESS.md).

## 7. Team and Background

Solo builder for Wave 1: **Emmanuel** — [@Emmanuellsensai](https://github.com/Emmanuellsensai).

Prior Midnight work:

- **Aliit Fellowship Builder**
- **Nightforce Charlie** (community leadership)
- **Eclipse Content Bounty — Tier 2 winner**
- **Anonymous Whispers** — privacy-preserving whistleblowing dApp on Midnight (the SDK/frontend patterns in this project are direct evolutions of that codebase's proven wiring)

Repository: https://github.com/Emmanuellsensai/redress-app
