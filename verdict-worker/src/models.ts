import type { ClaimType } from '@redress/sdk';
import { buildPrompt } from './prompts';

type RawVerdict = {
  decision: 'approved' | 'denied' | 'escalate';
  confidence: number;
  reasoning: string;
};

/**
 * Call Gemini (Google Generative AI).
 * Requires GEMINI_API_KEY environment variable.
 */
export const callGemini = async (
  evidence: string,
  claimType: ClaimType,
): Promise<RawVerdict> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not set');

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });

  const { system, user } = buildPrompt(evidence, claimType);

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
};

/**
 * Call Groq (fallback).
 * Requires GROQ_API_KEY environment variable.
 */
export const callGroq = async (
  evidence: string,
  claimType: ClaimType,
): Promise<RawVerdict> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not set');

  const Groq = (await import('groq-sdk')).default;
  const groq = new Groq({ apiKey });

  const { system, user } = buildPrompt(evidence, claimType);

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
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
  if (reasoning.length === 0) {
    throw new Error('Empty reasoning');
  }

  return { decision, confidence, reasoning };
};

/** Try Gemini first, fall back to Groq. */
export const getVerdict = async (
  evidence: string,
  claimType: ClaimType,
): Promise<RawVerdict> => {
  try {
    return await callGemini(evidence, claimType);
  } catch (geminiError) {
    console.error('Gemini failed, falling back to Groq:', geminiError);
    try {
      return await callGroq(evidence, claimType);
    } catch (groqError) {
      console.error('Groq also failed:', groqError);
      throw new Error(
        `Both AI providers failed. Gemini: ${String(geminiError)}. Groq: ${String(groqError)}`,
      );
    }
  }
};
