import OpenAI from 'openai';
import Anthropic from "@anthropic-ai/sdk";

let cachedClient: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "مفتاح ANTHROPIC_API_KEY غير مُعرَّف في متغيرات البيئة. الرجاء إضافته إلى ملف .env أو .env.local قبل المتابعة.",
    );
  }

  cachedClient = new OpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey: process.env.OPENAI_API_KEY });
  return cachedClient;
}
