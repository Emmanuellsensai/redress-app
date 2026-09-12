# Demo Video Script: Redress (under 5 minutes)

Target length: 4:00. Record in OBS at 1080p 30fps. Edit in CapCut: speed up transaction-confirmation waits to 4x, keep narration at 1x. Add lower-third text with each section title.

---

## 0:00 to 0:30 · Intro

**On screen:** the Landing page (`/`) with the hero visible. Panel of AI-judge avatars floating around the headline.

> "This is Redress. Privacy-preserving claims infrastructure built on Midnight. Every consumer app has a dispute button. Today, users email screenshots of bank statements to strangers, companies custody sensitive evidence forever, and regulators cannot audit without a full data dump. Redress fixes that. Evidence stays encrypted, an AI panel adjudicates, and the reporter decides what happens next."

## 0:30 to 1:00 · Platform Setup

**On screen:** `/dashboard`.

1. Connect 1am wallet. Show the connected chip.
2. Click **Generate Keypair**.
3. Highlight the warning: *"Your secret key is stored in this browser only."*
4. Click **Register On-Chain**. Speed through the transaction wait.
5. Cut to "You are the registered platform" confirmation.

> "The platform publishes its curve25519 public key on-chain. Now claimants can encrypt evidence to it, and only the platform's secret key, which never left the browser, can decrypt."

## 1:00 to 2:30 · Reporter files a claim end-to-end

**On screen:** `/submit` in a fresh tab (or incognito to sell the "different party" story).

1. Connect wallet.
2. Select **Fraud** in the dropdown.
3. Type the evidence:
   > "On 2026-09-05 an unauthorized $79.99 charge from merchant 44821 appeared on my card. I did not authorize this transaction."
4. Point at the privacy notice above the form.
5. Click **Submit for AI verdict**. Sign the transaction in 1am.
6. Speed through the transaction wait, land on "Asking the AI judge..."
7. Cut to the **AI verdict card**: APPROVED, 90% confidence, reasoning visible.
8. Explain the three options briefly, then click **Approve**.
9. Sign the second transaction. Speed through.
10. Cut to the **Done card** with both hashes.
11. Click **Download claim receipt**. Show the JSON file appearing in the downloads bar.

> "In one flow: the evidence was encrypted, submitted, adjudicated by the AI, and committed on-chain, with the reporter deciding whether to accept, reject, or escalate. Only the hashes hit the ledger. The reporter walks away with a receipt they can prove months later, without the platform's cooperation."

## 2:30 to 3:15 · Regulator verifies without wallet

**On screen:** `/verify`. No wallet required.

1. Show the on-chain claim count and both latest hashes at the top.
2. Open the downloaded receipt file. Copy `evidencePlaintext`.
3. Paste into Evidence plaintext box.
4. From the receipt, copy the inner `verdictJson` object (one line).
5. Paste into Verdict plaintext box.
6. Click **Verify hashes**.
7. Cut to both green matches.

> "A regulator, given the receipt out-of-band, verifies both hashes match the on-chain commitments. Nothing sensitive was ever published. The check runs entirely in the browser. No wallet, no trust in the platform, no data dump."

## 3:15 to 3:45 · Architecture Recap

**On screen:** the architecture diagram from the slide deck or the landing page's Built-on-Midnight section.

> "Under the hood: a Compact contract with three circuits, using persistentHash to bind private witnesses to public commitments. nacl.box envelope encryption with single-use ephemeral keypairs, so sender identity is cryptographically unrecoverable. A serverless verdict engine with Gemini 2.5 Flash primary and Groq Llama fallback. Nothing esoteric, all documented, all auditable."

## 3:45 to 4:00 · Close

**On screen:** end card.

> "Redress. Private claims. Verifiable verdicts. Built on Midnight. Wave 1 of the Midnight Buildathon."

> "github.com/Emmanuellsensai/redress-app. redress-app-two.vercel.app."

---

## Recording tips

- Fund the 1am wallet from the Preprod faucet before recording. Two claims worth of DUST minimum.
- Two browser windows side-by-side (claimant left, regulator right) sells the multi-party story instantly.
- Do the full flow once as rehearsal before hitting record. Mistakes on camera cost more than a rehearsal.
- Use the 30-second silence at the end of each transaction as your cut point. CapCut can trim and speed those without cutting narration.
- Show the receipt JSON on screen for 2 to 3 seconds. It reinforces that the reporter owns the proof.
