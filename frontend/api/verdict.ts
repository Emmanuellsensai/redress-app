import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';

/**
 * Self-contained Vercel serverless function for the AI verdict engine.
 *
 * Everything the handler needs — prompts, model attempts, response parsing
 * — lives in this file so Vercel's serverless-function bundler has no
 * relative imports to trace. Earlier attempts split the engine across
 * `frontend/verdict-engine/*.ts` and Vercel could not resolve them at
 * cold start, producing `FUNCTION_INVOCATION_FAILED`. This flat layout
 * eliminates that class of bug.
 */

type ClaimType =
  | 'fraud'
  | 'refund'
  | 'chargeback'
  | 'kyc_exception'
  | 'account_appeal';

type Decision = 'approved' | 'denied' | 'escalate';

type Verdict = {
  decision: Decision;
  confidence: number;
  reasoning: string;
  claimType: ClaimType;
  timestamp: number;
};

const VALID_CLAIM_TYPES: ClaimType[] = [
  'fraud',
  'refund',
  'chargeback',
  'kyc_exception',
  'account_appeal',
];

const SYSTEM_PROMPT = `You are a claims adjudicator for a financial platform. You evaluate evidence submitted by users and issue structured verdicts.

Rules:
- Be objective and evidence-based
- If evidence is vague, insufficient, or clearly fabricated, deny the claim
- If evidence is specific, detailed, and internally consistent, approve
- If you cannot determine either way, escalate to human review
- Never reveal personal information from the evidence in your reasoning
- Keep reasoning to 2-3 sentences maximum

Respond with ONLY valid JSON in this exact format, no preamble, no markdown:
{"decision":"approved|denied|escalate","confidence":0.0-1.0,"reasoning":"your reasoning here"}`;

const CLAIM_CONTEXT: Record<ClaimType, string> = {
  fraud: 'This is a fraud report. The user claims they were a victim of fraudulent activity. Evaluate whether the evidence describes a specific, credible incident with identifiable details (dates, amounts, parties involved).',
  refund: 'This is a refund request. The user is requesting a refund for a product or service. Evaluate whether the evidence justifies a refund (defective product, service not rendered, billing error).',
  chargeback: 'This is a chargeback dispute. The user disputes a charge on their account. Evaluate whether the evidence supports that the charge was unauthorized or the goods/services were not as described.',
  kyc_exception: 'This is a KYC exception request. The user is requesting an exception to standard identity verification requirements. Evaluate whether the stated reason is legitimate and documented.',
  account_appeal: 'This is an account appeal. The user is appealing an account restriction or suspension. Evaluate whether the evidence shows the restriction was applied in error or circumstances have changed.',
};

const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
const GROQ_MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'openai/gpt-oss-20b'];

const buildPrompt = (evidence: string, claimType: ClaimType) => ({
  system: SYSTEM_PROMPT,
  user: `${CLAIM_CONTEXT[claimType]}\n\nEvidence submitted by the claimant:\n\n${evidence}`,
});

const parseVerdict = (text: string) => {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned) as Record<string, unknown>;
  } catch {
    throw new Error(`AI returned invalid JSON: ${cleaned.substring(0, 200)}`);
  }
  const decision = parsed.decision;
  if (decision !== 'approved' && decision !== 'denied' && decision !== 'escalate') {
    throw new Error(`Invalid decision: ${String(decision)}`);
  }
  const confidence = Number(parsed.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(`Invalid confidence: ${String(parsed.confidence)}`);
  }
  const reasoning = String(parsed.reasoning || '');
  if (!reasoning) throw new Error('Empty reasoning');
  return { decision: decision as Decision, confidence, reasoning };
};

const callGemini = async (evidence: string, claimType: ClaimType) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');
  const genAI = new GoogleGenerativeAI(apiKey);
  const { system, user } = buildPrompt(evidence, claimType);
  const attempts: string[] = [];
  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: user }] }],
        systemInstruction: { role: 'system', parts: [{ text: system }] },
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 },
      });
      return parseVerdict(result.response.text());
    } catch (err) {
      attempts.push(`${modelId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`Gemini failed for every model.\n${attempts.join('\n')}`);
};

const callGroq = async (evidence: string, claimType: ClaimType) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');
  const groq = new Groq({ apiKey });
  const { system, user } = buildPrompt(evidence, claimType);
  const attempts: string[] = [];
  for (const modelId of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model: modelId,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
      const text = completion.choices[0]?.message?.content;
      if (!text) throw new Error('Groq returned empty response');
      return parseVerdict(text);
    } catch (err) {
      attempts.push(`${modelId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`Groq failed for every model.\n${attempts.join('\n')}`);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = req.body as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Request body must be a JSON object' });
  }

  const { evidence, claimType } = body;
  if (typeof evidence !== 'string' || evidence.trim().length === 0) {
    return res.status(400).json({ error: 'evidence must be a non-empty string' });
  }
  if (!VALID_CLAIM_TYPES.includes(claimType as ClaimType)) {
    return res.status(400).json({
      error: `claimType must be one of: ${VALID_CLAIM_TYPES.join(', ')}`,
    });
  }

  const providerErrors: string[] = [];
  let raw: { decision: Decision; confidence: number; reasoning: string } | null = null;

  try {
    raw = await callGemini(evidence.trim(), claimType as ClaimType);
  } catch (err) {
    providerErrors.push(`Gemini: ${err instanceof Error ? err.message : String(err)}`);
    try {
      raw = await callGroq(evidence.trim(), claimType as ClaimType);
    } catch (err2) {
      providerErrors.push(`Groq: ${err2 instanceof Error ? err2.message : String(err2)}`);
    }
  }

  if (!raw) {
    return res.status(500).json({
      error: `All providers failed.\n${providerErrors.join('\n---\n')}`,
    });
  }

  const verdict: Verdict = {
    decision: raw.decision,
    confidence: raw.confidence,
    reasoning: raw.reasoning,
    claimType: claimType as ClaimType,
    timestamp: Date.now(),
  };
  return res.status(200).json({ verdict });
}
