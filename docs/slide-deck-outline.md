# Redress: Slide Deck Outline (Wave 1)

Build in Canva or Google Slides from this outline. Palette adopted from Midnight Network brand hub: Midnight Black `#0A0A0A`, White `#FFFFFF`, Midnight Blue `#0000FE`. Font: Plus Jakarta Sans (700 or 800 for headlines, 500 for body).

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
- Regulators cannot audit without a full data dump
- Reporters have no proof of what they filed

*Nobody is happy.*

**Visual:** stylized screenshot of a generic "email your bank statement" support flow, plaintext highlighted.

## Slide 3: The Solution

Redress makes claims **private, AI-adjudicated, and reporter-driven**.

- Evidence encrypted in-browser (curve25519, single-use ephemeral keypairs)
- AI panel adjudicates off-chain
- Reporter accepts, rejects, or escalates
- On-chain hash commitments for auditability
- Regulators verify without seeing private data

**Visual:** three-panel horizontal flow. Reporter → AI panel → on-chain commitment, with a padlock over each edge.

## Slide 4: The Flow

1. **Submit.** Reporter encrypts evidence to platform key, transaction commits envelope + hash on-chain.
2. **Adjudicate.** AI verdict engine returns approved, denied, or escalate with reasoning.
3. **Decide.** Reporter approves the AI, rejects it, or escalates to a human, then commits the verdict hash on-chain.
4. **Verify.** Anyone with the plaintext out-of-band can re-hash locally and confirm the on-chain commitments match.

**Visual:** four numbered steps in a horizontal row with icons.

## Slide 5: Midnight Integration

- Compact contract, three circuits: `register_platform`, `submit_claim`, `post_verdict`
- Dual-ledger model: evidence private, commitments public
- `persistentHash` binds private witnesses inside the ZK circuit
- Any Midnight connector wallet (1am, Lace) supported
- Contract deployed on Preprod: `3bc1d920…3c68c`

**Visual:** dual-ledger diagram. Private column (plaintext, verdict reasoning, ephemeral sender identity) vs public column (counters, hashes, ciphertexts, platform key). `persistentHash` as the bridge.

## Slide 6: Architecture

Four components:

- **Compact Contract**: 3 circuits, deployed on Preprod
- **SDK**: chain interaction, nacl.box crypto, wallet bridge
- **Frontend**: React 19 / Vite 8 / Plus Jakarta Sans, four routes
- **Verdict Engine**: Gemini 2.5 Flash + Groq Llama, Vercel serverless

**Visual:** four-box block diagram. Frontend ↔ SDK ↔ Contract. Frontend → Verdict Engine → Gemini and Groq.

## Slide 7: Demo Highlights

Three screenshots or a short GIF loop:

1. Submit view. AI verdict card with Approve / Reject / Escalate.
2. Done card. Both on-chain hashes, download receipt button.
3. Verify. Green match on evidence and verdict hashes.

*"See full demo video for the end-to-end walkthrough."*

## Slide 8: Privacy Model

**Public on chain:** claim count, verdict count, platform public key, encrypted envelopes, evidence hashes, verdict hashes.
**Private off chain:** evidence plaintext, verdict reasoning, sender identity.

The ZK proof enforces that committed hashes match real preimages the reporter knew.

Ephemeral keypair per envelope → sender identity is cryptographically unrecoverable.

Reporter downloads a JSON receipt → can prove authenticity months later without depending on the platform.

## Slide 9: Roadmap

- **Wave 1 (now)**: single-party claim reporting, AI adjudication, reporter-driven decision, downloadable receipt, browser verification
- **Wave 2**: two-party disputes, encrypted file evidence, multi-model verdict panel, automated platform-side resolution webhooks
- **Wave 3**: human reviewer marketplace with staked reputation, Midnight-native pilot integration

## Slide 10: Team

**Emmanuel** · [@Emmanuellsensai](https://github.com/Emmanuellsensai)

- Midnight Aliit Fellowship Builder
- Nightforce Charlie (community leadership)
- Eclipse Content Bounty: Tier 2 winner
- Anonymous Whispers dApp: privacy-preserving whistleblowing on Midnight

GitHub: [github.com/Emmanuellsensai](https://github.com/Emmanuellsensai)

## Slide 11: Ask

Looking for:

- Feedback on the reporter-centric claims model
- Wave 2 collaborators (two-party disputes)
- Pilot integrations with Midnight-native apps

**redress-app-two.vercel.app** · **@Emmanuellsensai**
