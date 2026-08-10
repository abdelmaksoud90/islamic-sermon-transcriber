import openai from "@openai-ai/sdk";

let cachedClient: openai | null = null;

export function getopenaiClient(): openai {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "مفتاح OPENAI_API_KEY غير مُعرَّف في متغيرات البيئة. الرجاء إضافته إلى ملف .env أو .env.local قبل المتابعة.",
    );
  }

  cachedClient = new openai({ apiKey, timeout: 280 * 1000, maxRetries: 2 });
  return cachedClient;
}
