import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export class ProviderUnavailableError extends Error {
  constructor(public readonly reason: string) { super(reason); this.name = 'ProviderUnavailableError'; }
}

export class ProviderError extends Error {
  constructor(public readonly status: number | null, message: string) { super(message); this.name = 'ProviderError'; }
}

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

function getGenAI(): GoogleGenerativeAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ProviderUnavailableError('GEMINI_API_KEY is not configured on the server');
  return new GoogleGenerativeAI(key);
}

export interface GenerateJsonOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

export async function generateJson(options: GenerateJsonOptions): Promise<string> {
  const genAI = getGenAI();
  const model = genAI.getGenerativeModel({ model: MODEL_NAME });
  const config: GenerationConfig = {
    temperature: options.temperature ?? 0.2,
    maxOutputTokens: options.maxTokens ?? 2000,
  };
  const safety = [
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT as any, threshold: HarmBlockThreshold.BLOCK_NONE as any },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT as any, threshold: HarmBlockThreshold.BLOCK_NONE as any },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH as any, threshold: HarmBlockThreshold.BLOCK_NONE as any },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT as any, threshold: HarmBlockThreshold.BLOCK_NONE as any },
  ];
  try {
    const result = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: options.prompt }] }], generationConfig: config, safetySettings: safety as any });
    const text = result.response.text() ?? '';
    return text;
  } catch (err: any) {
    const status = err?.status ?? err?.response?.status ?? null;
    const message = err?.message ?? String(err);
    throw new ProviderError(status, message);
  }
}

export function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1).trim();
  return text.trim();
}

export const AI_PROVIDER = 'Google Gemini';
export const AI_MODEL = MODEL_NAME;
export const AI_AVAILABLE = Boolean(process.env.GEMINI_API_KEY);
