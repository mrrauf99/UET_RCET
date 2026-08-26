import * as z from "zod";
import { LIMITS } from "./constants";

const chatId = z.string().max(64).regex(/^[A-Za-z0-9-]+$/);

const requestMessage = z.discriminatedUnion("role", [
  z.strictObject({ role: z.literal("user"), content: z.string().min(1).max(LIMITS.userChars) }),
  z.strictObject({ role: z.literal("assistant"), content: z.string().min(1).max(LIMITS.assistantChars) }),
]);

export const chatRequestSchema = z.strictObject({
  chatId: chatId.optional(),
  messages: z
    .array(requestMessage)
    .min(1)
    .max(LIMITS.messages)
    .refine((messages) => messages.at(-1)?.role === "user", "The last message must be from the user")
    .refine(
      (messages) => messages.reduce((total, message) => total + message.content.length, 0) <= LIMITS.totalChars,
      "Conversation is too long",
    ),
});

const storedMessage = z.strictObject({
  id: z.string().min(1).max(64),
  role: z.enum(["user", "assistant"]),
  text: z.string().max(LIMITS.storedTextChars),
  state: z.enum(["complete", "streaming", "stopped", "error"]),
  errorKind: z.enum(["network", "rate_limited", "invalid", "server"]).optional(),
  ts: z.number(),
});

export const storedChatSchema = z.strictObject({
  v: z.literal(1),
  chatId: chatId.nullable(),
  messages: z.array(storedMessage).max(LIMITS.storedMessages),
});

