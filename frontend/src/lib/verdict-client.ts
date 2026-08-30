import type { Verdict, ClaimType } from '@redress/sdk';

const VERDICT_API_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api/verdict'
  : '/api/verdict';

export const fetchVerdict = async (
  evidence: string,
  claimType: ClaimType,
): Promise<Verdict> => {
  const res = await fetch(VERDICT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evidence, claimType }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error || `HTTP ${res.status}`);
  }

  const data = (await res.json()) as { verdict: Verdict };
  return data.verdict;
};
