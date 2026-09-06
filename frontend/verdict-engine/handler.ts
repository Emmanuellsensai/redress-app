import type { ClaimType, Verdict } from '@redress/sdk';
import { getVerdict } from './models';

const VALID_CLAIM_TYPES: ClaimType[] = [
  'fraud',
  'refund',
  'chargeback',
  'kyc_exception',
  'account_appeal',
];

export type VerdictRequest = {
  evidence: string;
  claimType: ClaimType;
};

export type VerdictResponse = { verdict: Verdict };
export type ErrorResponse = { error: string };

export const handleVerdictRequest = async (
  body: unknown,
): Promise<{ status: number; body: VerdictResponse | ErrorResponse }> => {
  if (!body || typeof body !== 'object') {
    return { status: 400, body: { error: 'Request body must be a JSON object' } };
  }

  const { evidence, claimType } = body as Record<string, unknown>;

  if (typeof evidence !== 'string' || evidence.trim().length === 0) {
    return { status: 400, body: { error: 'evidence must be a non-empty string' } };
  }

  if (!VALID_CLAIM_TYPES.includes(claimType as ClaimType)) {
    return {
      status: 400,
      body: { error: `claimType must be one of: ${VALID_CLAIM_TYPES.join(', ')}` },
    };
  }

  try {
    const raw = await getVerdict(evidence.trim(), claimType as ClaimType);

    const verdict: Verdict = {
      decision: raw.decision,
      confidence: raw.confidence,
      reasoning: raw.reasoning,
      claimType: claimType as ClaimType,
      timestamp: Date.now(),
    };

    return { status: 200, body: { verdict } };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('Verdict generation failed:', message);
    return { status: 500, body: { error: `Verdict generation failed: ${message}` } };
  }
};
