import type { ClaimType } from '@redress/sdk';
import { buildPrompt } from './prompts';

type RawVerdict = {
  decision: 'approved' | 'denied' | 'escalate';
  confidence: number;
  reasoning: string;
};

/** Gemini model IDs to try in order. When Google renames or deprecates a
 *  model, we walk to the next one before failing over to Groq. */
const GEMINI_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
];

/** Groq model IDs to try in order. Groq's catalog moves faster than
 *  Gemini's; keep this list in sync with https://console.groq.com/models. */
const GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant',
  'openai/gpt-oss-20b',
];

export const callGemini = async (
  evidence: string,
  claimType: ClaimType,
): Promise<RawVerdict> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const { system, user } = buildPrompt(evidence, claimType);

  const attempts: string[] = [];
  for (const modelId of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: user }] }],
        systemInstruction: { role: 'system', parts: [{ text: system }] },
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });
      const text = result.response.text();
      return parseVerdictResponse(text);
    } catch (err) {
      attempts.push(`${modelId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`Gemini failed for every model. Attempts:\n${attempts.join('\n')}`);
};

export const callGroq = async (
  evidence: string,
  claimType: ClaimType,
): Promise<RawVerdict> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const Groq = (await import('groq-sdk')).default;
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
      return parseVerdictResponse(text);
    } catch (err) {
      attempts.push(`${modelId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  throw new Error(`Groq failed for every model. Attempts:\n${attempts.join('\n')}`);
};

const parseVerdictResponse = (text: string): RawVerdict => {
  const cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI returned invalid JSON: ${cleaned.substring(0, 200)}`);
  }

  const obj = parsed as Record<string, unknown>;

  const decision = obj.decision;
  if (decision !== 'approved' && decision !== 'denied' && decision !== 'escalate') {
    throw new Error(`Invalid decision: ${String(decision)}`);
  }

  const confidence = Number(obj.confidence);
  if (isNaN(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(`Invalid confidence: ${String(obj.confidence)}`);
  }

  const reasoning = String(obj.reasoning || '');
  if (reasoning.length === 0) throw new Error('Empty reasoning');

  return { decision, confidence, reasoning };
};

export const getVerdict = async (
  evidence: string,
  claimType: ClaimType,
): Promise<RawVerdict> => {
  const errors: string[] = [];
  try {
    return await callGemini(evidence, claimType);
  } catch (err) {
    errors.push(`Gemini: ${err instanceof Error ? err.message : String(err)}`);
  }
  try {
    return await callGroq(evidence, claimType);
  } catch (err) {
    errors.push(`Groq: ${err instanceof Error ? err.message : String(err)}`);
  }
  throw new Error(`All providers failed.\n${errors.join('\n---\n')}`);
};
