// Kept free of zod so the store (loaded on every page) does not pull the validator into startup JS.
export const LIMITS = {
  userChars: 1000,
  assistantChars: 4000,
  messages: 20,
  totalChars: 24_000,
  bodyBytes: 64 * 1024,
  storedMessages: 50,
  storedTextChars: 16_000,
} as const;

export const STORAGE_KEY = "rcet:rachna-gpt:v1";
