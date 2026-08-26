import { ChatError, isAbortError, streamChat } from "./client";
import { LIMITS, STORAGE_KEY } from "./constants";
import { toRequestMessages } from "./history";
import { createId } from "./ids";
import type { ChatErrorKind, ChatStatus, Message } from "./types";

export interface ChatState {
  hydrated: boolean;
  messages: readonly Message[];
  chatId: string | null;
  panelOpen: boolean;
  rateLimitedUntil: number | null;
}

export const SERVER_SNAPSHOT: ChatState = Object.freeze({
  hydrated: false,
  messages: Object.freeze([]) as readonly Message[],
  chatId: null,
  panelOpen: false,
  rateLimitedUntil: null,
});

let state: ChatState = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

let active: { id: string; controller: AbortController } | null = null;
let pending = "";
let frame: number | null = null;
let hydrating: Promise<void> | null = null;

export const getSnapshot = () => state;

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => void listeners.delete(listener);
}

function emit(patch: Partial<ChatState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

export function selectStatus(s: ChatState): ChatStatus {
  const last = s.messages.at(-1);
  return last?.state === "streaming" ? "streaming" : last?.state === "error" ? "error" : "idle";
}
export const selectMessages = (s: ChatState) => s.messages;
export const selectHydrated = (s: ChatState) => s.hydrated;
export const selectPanelOpen = (s: ChatState) => s.panelOpen;
export const selectRateLimitedUntil = (s: ChatState) => s.rateLimitedUntil;
export const selectHasMessages = (s: ChatState) => s.messages.length > 0;

const isRateLimited = () => state.rateLimitedUntil !== null && Date.now() < state.rateLimitedUntil;

function save() {
  const messages = state.messages
    .filter((message) => !(message.state === "streaming" && message.text === ""))
    .map((message) => ({
      ...message,
      text: message.text.slice(0, LIMITS.storedTextChars),
      state: message.state === "streaming" ? ("stopped" as const) : message.state,
    }))
    .slice(-LIMITS.storedMessages);
  const write = (list: typeof messages) =>
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, chatId: state.chatId, messages: list }));
  try {
    write(messages);
  } catch {
    // QuotaExceededError (or storage disabled): retry smaller, then keep the chat in memory only.
    try {
      write(messages.slice(-20));
    } catch {}
  }
}

function clearStored() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function flush() {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  const text = pending;
  pending = "";
  if (!text || !active) return;
  const { id } = active;
  emit({ messages: state.messages.map((m) => (m.id === id ? { ...m, text: m.text + text } : m)) });
}

function queueChunk(streamId: string, text: string) {
  if (active?.id !== streamId) return;
  pending += text;
  // One render per frame instead of one per streamed word.
  frame ??= requestAnimationFrame(() => {
    frame = null;
    flush();
  });
}

type Outcome = { state: "complete" | "stopped" } | { state: "error"; errorKind: ChatErrorKind; retryAfter?: number };

function finish(id: string, outcome: Outcome) {
  // rAF does not run in background tabs, so buffered text is applied synchronously before finalising.
  flush();
  active = null;
  const message = state.messages.find((m) => m.id === id);
  if (!message) return;

  if (outcome.state === "stopped" && message.text === "") {
    emit({ messages: state.messages.filter((m) => m.id !== id) });
  } else {
    const next: Message =
      outcome.state === "error"
        ? { ...message, state: "error", errorKind: outcome.errorKind }
        : outcome.state === "complete" && message.text.trim() === ""
          ? { ...message, state: "error", errorKind: "server" }
          : { ...message, state: outcome.state };
    emit({
      messages: state.messages.map((m) => (m.id === id ? next : m)),
      ...(outcome.state === "error" && outcome.retryAfter
        ? { rateLimitedUntil: Date.now() + outcome.retryAfter * 1000 }
        : {}),
    });
  }
  save();
}

async function run(replyId: string) {
  const controller = new AbortController();
  active = { id: replyId, controller };
  const history = toRequestMessages(state.messages.filter((m) => m.id !== replyId));
  const isCurrent = () => active?.id === replyId;

  try {
    await streamChat(
      { messages: history, ...(state.chatId ? { chatId: state.chatId } : {}) },
      {
        signal: controller.signal,
        onChatId: (chatId) => {
          if (isCurrent() && chatId !== state.chatId) emit({ chatId });
        },
        onChunk: (text) => queueChunk(replyId, text),
      },
    );
    if (isCurrent()) finish(replyId, { state: "complete" });
  } catch (error) {
    // stop() and reset() finalise synchronously; their late rejection is ignored here.
    if (!isCurrent()) return;
    if (isAbortError(error)) return finish(replyId, { state: "stopped" });
    const kind = error instanceof ChatError ? error.kind : "server";
    const retryAfter = error instanceof ChatError ? error.options.retryAfter : undefined;
    finish(replyId, { state: "error", errorKind: kind, retryAfter });
  }
}

export function send(input: string) {
  const text = input.trim().slice(0, LIMITS.userChars);
  if (!text || selectStatus(state) === "streaming" || isRateLimited()) return;
  const ts = Date.now();
  const reply: Message = { id: createId(), role: "assistant", text: "", state: "streaming", ts };
  emit({ messages: [...state.messages, { id: createId(), role: "user", text, state: "complete", ts }, reply] });
  save();
  void run(reply.id);
}

export function stop() {
  if (!active) return;
  const { id, controller } = active;
  finish(id, { state: "stopped" });
  controller.abort();
}

export function retry() {
  const last = state.messages.at(-1);
  if (!last || last.role !== "assistant" || last.state !== "error" || active || isRateLimited()) return;
  const restarted: Message = { ...last, text: "", state: "streaming", errorKind: undefined };
  emit({ messages: state.messages.map((m) => (m.id === last.id ? restarted : m)) });
  void run(last.id);
}

export function reset() {
  const controller = active?.controller;
  active = null;
  controller?.abort();
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  pending = "";
  // rateLimitedUntil survives so a new chat cannot bypass the cooldown.
  emit({ messages: [], chatId: null });
  clearStored();
}

export const openPanel = () => emit({ panelOpen: true });
export const closePanel = () => emit({ panelOpen: false });

/** Reads sessionStorage once, after mount. Never replaces messages the user has already sent. */
export function hydrate(): Promise<void> {
  hydrating ??= import("./persist")
    .then(({ loadStoredChat }) => {
      const stored = state.messages.length === 0 ? loadStoredChat() : null;
      emit(stored ? { hydrated: true, messages: stored.messages, chatId: stored.chatId } : { hydrated: true });
    })
    .catch(() => emit({ hydrated: true }));
  return hydrating;
}
