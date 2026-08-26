import { describe, expect, it } from "vitest";
import { toRequestMessages } from "./history";
import { LIMITS } from "./constants";
import { chatRequestSchema } from "./schema";
import type { Message, MessageState } from "./types";

let seq = 0;
const user = (text: string): Message => ({ id: `u${seq++}`, role: "user", text, state: "complete", ts: 0 });
const bot = (text: string, state: MessageState = "complete"): Message => ({
  id: `a${seq++}`,
  role: "assistant",
  text,
  state,
  ts: 0,
});

describe("toRequestMessages", () => {
  it("returns nothing unless the last message is a pending user message", () => {
    expect(toRequestMessages([])).toEqual([]);
    expect(toRequestMessages([user("hi"), bot("hello")])).toEqual([]);
  });

  it("sends completed pairs followed by the pending question", () => {
    expect(toRequestMessages([user("q1"), bot("a1"), user("q2")])).toEqual([
      { role: "user", content: "q1" },
      { role: "assistant", content: "a1" },
      { role: "user", content: "q2" },
    ]);
  });

  it.each<MessageState>(["error", "stopped", "streaming"])("drops %s replies together with their question", (state) => {
    const result = toRequestMessages([user("q1"), bot("partial", state), user("q2")]);
    expect(result).toEqual([{ role: "user", content: "q2" }]);
  });

  it("drops empty replies and unanswered questions", () => {
    const result = toRequestMessages([user("q1"), bot("   "), user("unanswered"), user("q3")]);
    expect(result).toEqual([{ role: "user", content: "q3" }]);
  });

  it("keeps the failed pair out of history when sending after an error", () => {
    const result = toRequestMessages([user("q1"), bot("a1"), user("q2"), bot("", "error"), user("q3")]);
    expect(result.map((m) => m.content)).toEqual(["q1", "a1", "q3"]);
  });

  it("caps at the message limit without starting on an assistant turn", () => {
    const messages: Message[] = [];
    for (let i = 0; i < 30; i++) messages.push(user(`q${i}`), bot(`a${i}`));
    messages.push(user("latest"));
    const result = toRequestMessages(messages);
    expect(result.length).toBeLessThanOrEqual(LIMITS.messages);
    expect(result[0].role).toBe("user");
    expect(result.at(-1)).toEqual({ role: "user", content: "latest" });
    expect(result.at(-2)).toEqual({ role: "assistant", content: "a29" });
  });

  it("drops the oldest pairs to stay under the total character cap", () => {
    const long = "x".repeat(LIMITS.assistantChars);
    const messages: Message[] = [];
    for (let i = 0; i < 8; i++) messages.push(user(`q${i}`), bot(long));
    messages.push(user("latest"));
    const result = toRequestMessages(messages);
    const total = result.reduce((sum, m) => sum + m.content.length, 0);
    expect(total).toBeLessThanOrEqual(LIMITS.totalChars);
    expect(result[0].role).toBe("user");
    expect(chatRequestSchema.safeParse({ messages: result }).success).toBe(true);
  });

  it("always produces a body the route accepts", () => {
    const long = "y".repeat(LIMITS.assistantChars + 500);
    const result = toRequestMessages([user("q"), bot(long), user("z".repeat(LIMITS.userChars + 10))]);
    expect(chatRequestSchema.safeParse({ messages: result }).success).toBe(true);
  });
});
