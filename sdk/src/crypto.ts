import nacl from 'tweetnacl';

/** Total envelope size matching the Compact Bytes<512> parameter. */
export const ENVELOPE_BYTES = 512;

/** Maximum plaintext evidence size before padding. */
export const MAX_EVIDENCE_BYTES = 256;

/**
 * Pads or truncates evidence to exactly MAX_EVIDENCE_BYTES.
 * Uses zero-padding on the right.
 */
export const padEvidence = (evidence: Uint8Array): Uint8Array => {
  const padded = new Uint8Array(MAX_EVIDENCE_BYTES);
  padded.set(evidence.subarray(0, MAX_EVIDENCE_BYTES));
  return padded;
};

/**
 * Encrypts evidence to the platform's public key using a single-use
 * ephemeral keypair. The sender's identity is cryptographically
 * unrecoverable: the ephemeral secret key is discarded after encryption.
 *
 * @param plaintext Raw evidence bytes (will be padded to 256)
 * @param recipientPk Platform's curve25519 public key (32 bytes)
 * @returns 512-byte sealed envelope
 */
export const sealEvidence = (
  plaintext: Uint8Array,
  recipientPk: Uint8Array,
): Uint8Array => {
  const padded = padEvidence(plaintext);
  const ephemeral = nacl.box.keyPair();
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const ciphertext = nacl.box(padded, nonce, recipientPk, ephemeral.secretKey);

  if (!ciphertext) {
    throw new Error('nacl.box encryption failed');
  }

  const envelope = new Uint8Array(ENVELOPE_BYTES);
  envelope.set(ephemeral.publicKey, 0);
  envelope.set(nonce, nacl.box.publicKeyLength);
  envelope.set(ciphertext, nacl.box.publicKeyLength + nacl.box.nonceLength);

  return envelope;
};

/**
 * Decrypts a sealed envelope using the platform's secret key.
 *
 * @param envelope 512-byte sealed envelope from the chain
 * @param recipientSk Platform's curve25519 secret key (32 bytes, browser-local)
 * @returns Padded plaintext (256 bytes) or null if decryption fails
 */
export const openEvidence = (
  envelope: Uint8Array,
  recipientSk: Uint8Array,
): Uint8Array | null => {
  const ephemeralPk = envelope.subarray(0, nacl.box.publicKeyLength);
  const nonce = envelope.subarray(
    nacl.box.publicKeyLength,
    nacl.box.publicKeyLength + nacl.box.nonceLength,
  );
  const ciphertext = envelope.subarray(
    nacl.box.publicKeyLength + nacl.box.nonceLength,
    nacl.box.publicKeyLength +
      nacl.box.nonceLength +
      MAX_EVIDENCE_BYTES +
      nacl.box.overheadLength,
  );

  return nacl.box.open(ciphertext, nonce, ephemeralPk, recipientSk);
};

/**
 * Generates a new curve25519 keypair for a platform's evidence inbox.
 * The secret key MUST be stored browser-side only (localStorage or
 * IndexedDB). It never touches the Midnight SDK or the chain.
 */
export const generatePlatformKeypair = (): nacl.BoxKeyPair => {
  return nacl.box.keyPair();
};

/**
 * Strips trailing zero bytes from decrypted padded evidence.
 * Use after openEvidence to get the original message.
 */
export const stripPadding = (padded: Uint8Array): Uint8Array => {
  let end = padded.length;
  while (end > 0 && padded[end - 1] === 0) end--;
  return padded.subarray(0, end);
};
