# Redress: Slide Deck Outline (Wave 1)

Build in Canva or Google Slides from this outline. Palette: warm paper (`#FAFAF8`), burnt sienna accent (`#B8432F`), parchment card fills (`#F5F0E8`). Fonts: Fraunces for titles, Inter for body, IBM Plex Mono for hashes.

---

## Slide 1: Title

**Redress: Private Claims. Verifiable Verdicts.**
Built on Midnight Network.
Wave 1 · Midnight Buildathon 2026
Redress Labs · [@Emmanuellsensai](https://github.com/Emmanuellsensai)

## Slide 2: The Problem

Every app has a dispute button. Behind it:

- Users email bank statements to strangers
- Companies custody sensitive evidence forever
- Regulators cannot audit without full data dumps

*Nobody is happy.*

**Visual:** stylized screenshot of a generic "email your bank statement here" support flow, with the plaintext evidence highlighted.

## Slide 3: The Solution

Redress makes claims **private, AI-adjudicated, and auditable**.

- Evidence encrypted in-browser (curve25519, ephemeral keypairs)
- AI verdict engine evaluates off-chain
- On-chain hash commitments for auditability
- Regulators verify without seeing private data

**Visual:** three-panel horizontal flow. Claimant → platform (AI) → regulator, with a padlock over each edge.

## Slide 4: How It Works

1. **Encrypt & Submit.** Evidence sealed to platform's public key. Chain stores only a hash and the sealed envelope.
2. **AI Adjudication.** Verdict issued off-chain (Gemini primary, Groq fallback). Verdict hash posted on-chain; reasoning stays private.
3. **Verify Anywhere.** Regulator re-hashes plaintext, compares to on-chain commitment. Green check or red X.

## Slide 5: Midnight Integration

- Compact contract, three circuits: `register_platform`, `submit_claim`, `post_verdict`
- Dual-ledger model: evidence private, commitments public
- `persistentHash` binds private witnesses inside the ZK circuit
- 1am wallet for Preprod deployment (bypasses Lace tDUST congestion)

**Visual:** dual-ledger diagram. Private column (plaintext, verdict reasoning, ephemeral sender identity) vs public column (counters, hashes, ciphertexts, platform PK), with `persistentHash` as the bridge.

## Slide 6: Architecture

Four components:

- **Compact Contract**: 3 circuits, deployed on Preprod
- **SDK**: chain interaction, nacl.box crypto, wallet bridge
- **Frontend**: React 19 / Vite 8 / Tailwind 4, five routes
- **Verdict Worker**: Gemini + Groq, Vercel serverless

**Visual:** four-box block diagram with arrows: Frontend ↔ SDK ↔ Contract; Frontend → Verdict Worker → Gemini/Groq.

## Slide 7: Demo

Three screenshots (or a short GIF loop):

1. Submit view. Evidence being encrypted, privacy notice visible
2. Dashboard. Decrypted claim + AI verdict card
3. Verify. Green check comparing on-chain hash to freshly computed hash

*"See full demo video for the end-to-end walkthrough."*

## Slide 8: Privacy Model

**Public:** claim count, verdict hashes, platform key, encrypted envelopes
**Private:** evidence plaintext, verdict reasoning, sender identity

The ZK proof enforces that committed hashes match real evidence the submitter knew.

Ephemeral keypair per envelope → sender identity is cryptographically unrecoverable.

## Slide 9: Roadmap

- **Wave 1 (now)**: single-party claim reporting, AI verdicts, browser verification
- **Wave 2**: two-party disputes, encrypted file evidence, multi-model verdict panel
- **Wave 3**: human reviewer marketplace with staked reputation, Midnight-native pilot

## Slide 10: Team

**Emmanuel** · [@Emmanuellsensai](https://github.com/Emmanuellsensai)

- Midnight Aliit Fellowship Builder
- Nightforce Charlie (community leadership)
- Eclipse Content Bounty: Tier 2 winner
- Anonymous Whispers dApp: privacy-preserving whistleblowing on Midnight

GitHub: [github.com/Emmanuellsensai](https://github.com/Emmanuellsensai)

## Slide 11: Ask

Looking for:

- Feedback on the claims model
- Wave 2 collaborators (two-party disputes)
- Pilot integrations with Midnight-native apps

**redress-app.vercel.app** · **@Emmanuellsensai**
