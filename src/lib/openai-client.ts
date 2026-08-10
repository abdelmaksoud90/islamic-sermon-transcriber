import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "مفتاح OPENAI_API_KEY غير مُعرَّف في متغيرات البيئة. الرجاء إضافته إلى ملف .env أو .env.local قبل المتابعة.",
    );
  }

  cachedClient = new OpenAI({ baseURL: "https://api.groq.com/openai/v1",  apiKey, timeout: 280 * 1000, maxRetries: 2 });
  return cachedClient;
}
