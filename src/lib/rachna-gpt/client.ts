import type { ChatErrorKind, ChatRequest } from "./types";

const CHAT_ENDPOINT = "/api/rachna-gpt";

export class ChatError extends Error {
  constructor(
    readonly kind: ChatErrorKind,
    readonly options: { retryAfter?: number; partial?: boolean } = {},
  ) {
    super(kind);
    this.name = "ChatError";
  }
}

interface StreamHandlers {
  signal: AbortSignal;
  onChatId: (chatId: string) => void;
  onChunk: (text: string) => void;
}

export const isAbortError = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/*
 * The only module that knows the wire protocol. text/plain cannot signal a truncated stream; moving to
 * NDJSON/SSE events (delta, done, error) only changes this file and the route.
 */
export async function streamChat(body: ChatRequest, { signal, onChatId, onChunk }: StreamHandlers): Promise<void> {
  let response: Response;
  try {
    response = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if (isAbortError(error)) throw error;
    throw new ChatError("network");
  }

  if (!response.ok || !response.body) {
    if (response.status === 429) {
      const retryAfter = Number(response.headers.get("Retry-After"));
      throw new ChatError("rate_limited", { retryAfter: Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 30 });
    }
    throw new ChatError(response.status >= 400 && response.status < 500 ? "invalid" : "server");
  }

  const chatId = response.headers.get("Chat-ID");
  if (chatId) onChatId(chatId);

  const reader = response.body.getReader();
  // stream: true carries a multi-byte character (e.g. Urdu) split across chunks into the next decode.
  const decoder = new TextDecoder("utf-8");
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      if (text) onChunk(text);
    }
    const rest = decoder.decode();
    if (rest) onChunk(rest);
  } catch (error) {
    if (signal.aborted || isAbortError(error)) throw signal.reason ?? error;
    throw new ChatError("network", { partial: true });
  }
}
