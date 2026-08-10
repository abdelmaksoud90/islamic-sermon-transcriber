import OpenAI from "openai";

let cachedClient: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Ù…ÙØªØ§Ø­ OPENAI_API_KEY ØºÙŠØ± Ù…ÙØ¹Ø±ÙŽÙ‘Ù ÙÙŠ Ù…ØªØºÙŠØ±Ø§Øª Ø§Ù„Ø¨ÙŠØ¦Ø©. Ø§Ù„Ø±Ø¬Ø§Ø¡ Ø¥Ø¶Ø§ÙØªÙ‡ Ø¥Ù„Ù‰ Ù…Ù„Ù .env Ø£Ùˆ .env.local Ù‚Ø¨Ù„ Ø§Ù„Ù…ØªØ§Ø¨Ø¹Ø©.",
    );
  }

  cachedClient = new OpenAI({ baseURL: "https://api.groq.com/openai/v1",  apiKey, timeout: 280 * 1000, maxRetries: 2 });
  return cachedClient;
}

