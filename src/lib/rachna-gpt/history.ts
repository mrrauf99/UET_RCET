import { LIMITS } from "./constants";
import type { Message, RequestMessage } from "./types";

/**
 * The only place request history is shaped. Sends completed question/answer pairs plus the
 * pending question; failed, stopped and empty replies are dropped together with their question.
 */
export function toRequestMessages(messages: readonly Message[]): RequestMessage[] {
  const last = messages.at(-1);
  if (!last || last.role !== "user") return [];

  const pairs: [RequestMessage, RequestMessage][] = [];
  for (let i = 0; i < messages.length - 1; i++) {
    const question = messages[i];
    const answer = messages[i + 1];
    if (question.role !== "user" || answer.role !== "assistant") continue;
    if (answer.state !== "complete" || !answer.text.trim()) continue;
    pairs.push([
      { role: "user", content: question.text.slice(0, LIMITS.userChars) },
      { role: "assistant", content: answer.text.slice(0, LIMITS.assistantChars) },
    ]);
    i++;
  }

  const pending: RequestMessage = { role: "user", content: last.text.slice(0, LIMITS.userChars) };
  const maxPairs = Math.floor((LIMITS.messages - 1) / 2);
  const kept = pairs.slice(-maxPairs);
  let total = pending.content.length + kept.reduce((sum, [q, a]) => sum + q.content.length + a.content.length, 0);
  while (kept.length > 0 && total > LIMITS.totalChars) {
    const [q, a] = kept.shift()!;
    total -= q.content.length + a.content.length;
  }

  return [...kept.flat(), pending];
}
