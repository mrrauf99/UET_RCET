type Role = "user" | "assistant";
export type MessageState = "complete" | "streaming" | "stopped" | "error";
export type ChatStatus = "idle" | "streaming" | "error";
export type ChatErrorKind = "network" | "rate_limited" | "invalid" | "server";

export interface Message {
  id: string;
  role: Role;
  text: string;
  state: MessageState;
  errorKind?: ChatErrorKind;
  ts: number;
}

export interface RequestMessage {
  role: Role;
  content: string;
}

export interface ChatRequest {
  chatId?: string;
  messages: RequestMessage[];
}
