import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

export class ProviderUnavailableError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
    this.name = 'ProviderUnavailableError';
  }
}

export class ProviderError extends Error {
  constructor(public readonly status: number | null, message: string) {
    super(message);
    this.name = 'ProviderError';
  }
}

const GROQ_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

export interface GenerateJsonOptions {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
}

async function generateWithGroq(options: GenerateJsonOptions): Promise<string> {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an evidence-first brand governance AI. Output valid JSON only, without conversational commentary or pleasantries.',
        },
        {
          role: 'user',
          content: options.prompt,
        },
      ],
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? 2000,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new ProviderError(res.status, `Groq API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  return content;
}

async function generateWithGemini(options: GenerateJsonOptions): Promise<string> {
  const genAI = new GoogleGenerativeAI(GEMINI_KEY);
  const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
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

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: options.prompt }] }],
    generationConfig: config,
    safetySettings: safety as any,
  });
  return result.response.text() ?? '';
}

export async function generateJson(options: GenerateJsonOptions): Promise<string> {
  if (GROQ_KEY) {
    try {
      return await generateWithGroq(options);
    } catch (err: any) {
      // If Groq fails and Gemini is available, attempt fallback
      if (GEMINI_KEY) {
        console.warn('Groq generation failed, attempting Gemini fallback:', err.message);
        return await generateWithGemini(options);
      }
      throw err;
    }
  }

  if (GEMINI_KEY) {
    try {
      return await generateWithGemini(options);
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status ?? null;
      const message = err?.message ?? String(err);
      throw new ProviderError(status, message);
    }
  }

  throw new ProviderUnavailableError('No AI provider configured (set GROQ_API_KEY or GEMINI_API_KEY)');
}

export function extractJsonBlock(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1).trim();
  return text.trim();
}

export const AI_PROVIDER = GROQ_KEY ? 'Groq' : (GEMINI_KEY ? 'Google Gemini' : 'None');
export const AI_MODEL = GROQ_KEY ? GROQ_MODEL : (GEMINI_KEY ? GEMINI_MODEL : 'none');
export const AI_AVAILABLE = Boolean(GROQ_KEY || GEMINI_KEY);
