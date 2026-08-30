# API Contract

Frozen interface between the SDK, frontend, and verdict worker. Do not modify without approval.

## Verdict Worker HTTP API

### `POST /api/verdict`

**Request body**

```json
{
  "evidence": "string",
  "claimType": "fraud | refund | chargeback | kyc_exception | account_appeal"
}
```

- `evidence` — decrypted plaintext evidence. Non-empty string.
- `claimType` — one of the five enum values above.

**Success — HTTP 200**

```json
{
  "verdict": {
    "decision": "approved | denied | escalate",
    "confidence": 0.0,
    "reasoning": "string",
    "claimType": "string",
    "timestamp": 0
  }
}
```

- `decision` — verdict outcome.
- `confidence` — number in `[0.0, 1.0]`.
- `reasoning` — 2–3 sentences from the AI (kept short to fit the 256-byte on-chain witness after JSON serialization).
- `claimType` — echoed back from the request.
- `timestamp` — unix milliseconds when the verdict was issued.

**Error — HTTP 400 / 500**

```json
{
  "error": "string"
}
```

- `400` — validation error (missing/bad `evidence` or `claimType`, unparseable AI JSON).
- `500` — both providers (Gemini primary, Groq fallback) failed.

## On-Chain Verdict Serialization

The verdict blob passed as the `verdict_text` witness to `post_verdict(verdict_text: Bytes<256>)` is a **compact JSON encoding** of the verdict, padded with trailing zero bytes to exactly 256 bytes:

```json
{
  "d": "approved | denied | escalate",
  "c": 0.0,
  "r": "string",
  "t": "fraud | refund | chargeback | kyc_exception | account_appeal",
  "ts": 0
}
```

Field mapping (short keys keep the blob under 256 bytes):

| Short key | HTTP field |
| --- | --- |
| `d` | `decision` |
| `c` | `confidence` |
| `r` | `reasoning` |
| `t` | `claimType` |
| `ts` | `timestamp` |

The `/verify` page **must** accept this exact JSON format (short keys, this key order-independence, UTF-8 encoding, right-padded with `0x00` to 256 bytes) to reproduce the same `persistentHash` that `post_verdict` committed.

## Envelope Format

The `encrypted_evidence` argument to `submit_claim` is a fixed **512-byte** buffer (`Bytes<512>` in Compact). Layout:

| Offset | Length | Contents |
| --- | --- | --- |
| 0 | 32 | ephemeral sender curve25519 public key |
| 32 | 24 | XSalsa20 nonce |
| 56 | 272 | nacl.box ciphertext (256 padded plaintext + 16-byte Poly1305 tag) |
| 328 | 184 | zero padding to 512 |

The plaintext witness `evidence_plaintext: Bytes<256>` passed alongside is the **same 256-byte padded plaintext** that was encrypted (right-padded with `0x00`). The circuit computes `persistentHash(evidence_plaintext)` and discloses it into `latest_evidence_hash`. The ZK proof enforces that a caller cannot post an arbitrary hash without knowing the preimage that was also placed inside the envelope.

## Ledger Field Names

The generated TypeScript ledger projector uses the Compact source's snake_case field names verbatim. The SDK's `readPublicState` maps them to a camelCase `PublicState` for consumption by the frontend:

| Compact ledger field | `PublicState` field |
| --- | --- |
| `claim_count` | `claimCount` |
| `platform_public_key` | `platformPublicKey` (or `null` if all zeros — see `isUnregisteredKey`) |
| `platform_key_version` | `platformKeyVersion` |
| `evidence_inbox` | `evidenceInbox` (iterated into a `Uint8Array[]`, newest first) |
| `latest_evidence_hash` | `latestEvidenceHash` |
| `latest_verdict_hash` | `latestVerdictHash` |
| `verdict_count` | `verdictCount` |
