# Demo Video Script. Redress (under 5 minutes)

Target length: 4:30. Record in OBS at 1080p 30fps. Edit in CapCut: speed up transaction-confirmation waits to 4×, keep narration at 1×. Add lower-third text with each section title.

---

## 0:00. 0:30 · Intro

**On screen:** the Landing page (`/`) with the hero visible.

> "This is Redress. Privacy-preserving claims infrastructure built on Midnight. Every consumer app has a dispute button. Today, users email screenshots of bank statements to strangers. Redress changes that: evidence stays encrypted, an AI adjudicates, and regulators can audit without seeing your private data."

## 0:30. 1:15 · Platform Setup

**On screen:** `/dashboard`.

1. Connect 1am wallet. Show the connected-address chip.
2. Click **Generate Keypair**.
3. Highlight the warning: *"Your secret key is stored in this browser only."*
4. Click **Register On-Chain**.
5. Cut to the confirmation state with the on-chain public key displayed.

> "The platform just published its public key on-chain. Now claimants can encrypt evidence to it. And only the platform's secret key, which never left the browser, can decrypt."

## 1:15. 2:15 · Submit a Claim

**On screen:** `/submit` in a fresh tab.

1. Connect wallet.
2. Select **Fraud** in the dropdown.
3. Type the evidence:
   > "On August 20, 2026, an unauthorized charge of $49.99 appeared on my account from merchant ID 88213. I did not authorize this transaction."
4. Point at the privacy notice above the form.
5. Click **Submit Claim**.
6. Speed through the transaction wait.
7. Cut to the success card showing the transaction ID and the new evidence hash.

> "The chain now stores the encrypted envelope and a one-way hash of my evidence. The plaintext never touched the ledger. The zero-knowledge proof binds the hash to a real preimage that only I knew when I signed."

## 2:15. 3:15 · AI Verdict

**On screen:** back to `/dashboard`.

1. Show the claim appearing in the inbox.
2. Click **Decrypt**. The plaintext evidence appears.
3. Select claim type (fraud).
4. Click **Get AI Verdict**.
5. Cut to the verdict card: decision (`APPROVED`), confidence, reasoning.
6. Click **Post Verdict On-Chain**.
7. Speed through the transaction wait.
8. Cut to the verdict-hash confirmation.

> "The AI evaluated the evidence off-chain. Only the verdict hash goes on-chain. The reasoning stays private. The platform sees it, the claimant sees it, nobody else does."

## 3:15. 4:00 · Regulator Verification

**On screen:** `/verify`. No wallet required.

1. Show the on-chain evidence and verdict hashes at the top.
2. Paste the original evidence plaintext into the first textarea.
3. Paste the verdict JSON blob into the second textarea.
4. Click **Verify**.
5. Cut to both green checkmarks confirming the hashes match.

> "A regulator, given the plaintext out-of-band, can verify that the on-chain commitments match. Without ever holding the private data on-chain, and without connecting a wallet. This entire check runs in the browser."

## 4:00. 4:30 · Architecture Recap + Close

**On screen:** the architecture diagram from the slide deck.

> "Under the hood: a Compact contract with three circuits using `persistentHash` for in-circuit commitments. An SDK with nacl.box envelope encryption using single-use ephemeral keypairs, so sender identity is cryptographically unrecoverable. And a verdict worker with Gemini as primary and Groq as fallback."
>
> "Redress: private claims, verifiable verdicts, built on Midnight. Wave 1 of the Midnight Buildathon."
>
> "github.com/Emmanuellsensai/redress-app"

**End card:** `redress-app.vercel.app` + `@Emmanuellsensai`

---

## Recording tips

- Have both wallets funded from tDUST faucet before recording. The demo dies if a tx never confirms.
- Two browser windows side-by-side (claimant + platform) sells the "two parties" story instantly.
- Do the whole flow once end-to-end as rehearsal *before* hitting record: mistakes on camera cost more than a rehearsal.
- Use a 30-second silence at the end of each transaction as your cut point; CapCut can trim + speed those without cutting narration.
