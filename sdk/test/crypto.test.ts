import { describe, it, expect } from 'vitest';
import {
  sealEvidence,
  openEvidence,
  generatePlatformKeypair,
  padEvidence,
  stripPadding,
  ENVELOPE_BYTES,
  MAX_EVIDENCE_BYTES,
} from '../src/crypto';

describe('envelope crypto', () => {
  it('round-trips: seal then open recovers the original evidence', () => {
    const platform = generatePlatformKeypair();
    const message = new TextEncoder().encode('Unauthorized charge of $49.99 on 2026-08-15');
    const envelope = sealEvidence(message, platform.publicKey);

    expect(envelope.length).toBe(ENVELOPE_BYTES);

    const decrypted = openEvidence(envelope, platform.secretKey);
    expect(decrypted).not.toBeNull();

    const recovered = stripPadding(decrypted!);
    expect(new TextDecoder().decode(recovered)).toBe(
      'Unauthorized charge of $49.99 on 2026-08-15',
    );
  });

  it('wrong secret key cannot decrypt', () => {
    const platform = generatePlatformKeypair();
    const attacker = generatePlatformKeypair();
    const message = new TextEncoder().encode('Sensitive evidence');
    const envelope = sealEvidence(message, platform.publicKey);

    const result = openEvidence(envelope, attacker.secretKey);
    expect(result).toBeNull();
  });

  it('padEvidence pads short input to MAX_EVIDENCE_BYTES', () => {
    const short = new Uint8Array([1, 2, 3]);
    const padded = padEvidence(short);
    expect(padded.length).toBe(MAX_EVIDENCE_BYTES);
    expect(padded[0]).toBe(1);
    expect(padded[3]).toBe(0);
  });

  it('padEvidence truncates input longer than MAX_EVIDENCE_BYTES', () => {
    const long = new Uint8Array(300).fill(0xff);
    const padded = padEvidence(long);
    expect(padded.length).toBe(MAX_EVIDENCE_BYTES);
  });

  it('stripPadding removes trailing zeros', () => {
    const padded = new Uint8Array(MAX_EVIDENCE_BYTES);
    padded.set([72, 101, 108, 108, 111]); // "Hello"
    const stripped = stripPadding(padded);
    expect(stripped.length).toBe(5);
    expect(new TextDecoder().decode(stripped)).toBe('Hello');
  });

  it('each seal produces a different envelope (ephemeral keypair)', () => {
    const platform = generatePlatformKeypair();
    const message = new TextEncoder().encode('Same message');
    const envelope1 = sealEvidence(message, platform.publicKey);
    const envelope2 = sealEvidence(message, platform.publicKey);

    const epk1 = envelope1.subarray(0, 32);
    const epk2 = envelope2.subarray(0, 32);
    expect(epk1).not.toEqual(epk2);

    const d1 = stripPadding(openEvidence(envelope1, platform.secretKey)!);
    const d2 = stripPadding(openEvidence(envelope2, platform.secretKey)!);
    expect(d1).toEqual(d2);
  });
});
