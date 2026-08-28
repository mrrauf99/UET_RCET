import { STORAGE_KEY } from "./constants";
import { storedChatSchema } from "./schema";
import type { Message } from "./types";

// Loaded lazily by the store's hydrate(), so zod stays out of the startup bundle.
export function loadStoredChat(): { chatId: string | null; messages: Message[] } | null {
  let raw: string | null;
  try {
    raw = sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  let parsed: ReturnType<typeof storedChatSchema.safeParse> | undefined;
  try {
    parsed = storedChatSchema.safeParse(JSON.parse(raw));
  } catch {}
  if (!parsed?.success) {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
    }
    return null;
  }

  // A reload mid-reply leaves a "streaming" message that will never finish.
  const messages = parsed.data.messages
    .map((message): Message => (message.state === "streaming" ? { ...message, state: "stopped" } : message))
    .filter((message) => message.role === "user" || message.state === "error" || message.text.trim() !== "");
  return { chatId: parsed.data.chatId, messages };
}
