export type ClaimType =
  | 'fraud'
  | 'refund'
  | 'chargeback'
  | 'kyc_exception'
  | 'account_appeal';

export type ClaimStatus =
  | 'submitted'
  | 'processing'
  | 'verdict_issued'
  | 'resolved';

export type VerdictDecision = 'approved' | 'denied' | 'escalate';

export type Verdict = {
  decision: VerdictDecision;
  confidence: number;
  reasoning: string;
  claimType: ClaimType;
  timestamp: number;
};

export type PublicState = {
  claimCount: bigint;
  platformPublicKey: Uint8Array | null;
  platformKeyVersion: bigint;
  evidenceInbox: Uint8Array[];
  latestEvidenceHash: Uint8Array;
  latestVerdictHash: Uint8Array;
  verdictCount: bigint;
};
