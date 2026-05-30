import { env } from '../../../env';

export type AiMessage = { role: 'user' | 'system'; content: string };

export class AiNotConfiguredError extends Error {
  constructor() {
    super('GEMINI_API_KEY no está configurada. Agrégala en apps/api/.env.local.');
    this.name = 'AiNotConfiguredError';
  }
}

export function isAiConfigured(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

/**
 * Llama a Gemini (Google AI Studio) vía REST y devuelve texto plano.
 * Pluggable: para cambiar a Groq/Claude solo se reescribe esta función.
 */
export async function generateText({
  system,
  prompt,
  temperature = 0.7,
  maxOutputTokens = 4096,
}: {
  system?: string;
  prompt: string;
  temperature?: number;
  maxOutputTokens?: number;
}): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new AiNotConfiguredError();

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': env.GEMINI_API_KEY,
    },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: {
        temperature,
        maxOutputTokens,
        // Desactiva el "thinking" de 2.5-flash: para generación directa no aporta
        // y consumía presupuesto de tokens, cortando la respuesta final.
        thinkingConfig: { thinkingBudget: 0 },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Gemini API ${res.status}: ${detail.slice(0, 300)}`);
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text.trim()) throw new Error('Gemini devolvió una respuesta vacía.');
  return text.trim();
}
