// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatError } from "./client";
import { STORAGE_KEY } from "./constants";
import type { ChatRequest, Message } from "./types";

interface Call {
  body: ChatRequest;
  signal: AbortSignal;
  chunk: (text: string) => void;
  chatId: (id: string) => void;
  done: () => void;
  fail: (error: unknown) => void;
}

const calls = vi.hoisted(() => [] as Call[]);

vi.mock("./client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./client")>()),
  streamChat: (body: ChatRequest, handlers: { signal: AbortSignal; onChunk: (t: string) => void; onChatId: (id: string) => void }) =>
    new Promise<void>((resolve, reject) => {
      handlers.signal.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
      calls.push({
        body,
        signal: handlers.signal,
        chunk: handlers.onChunk,
        chatId: handlers.onChatId,
        done: resolve,
        fail: reject,
      });
    }),
}));

type Store = typeof import("./store");
let store: Store;
const frames = new Map<number, FrameRequestCallback>();
let frameId = 0;

function runFrames() {
  const pending = [...frames.values()];
  frames.clear();
  for (const callback of pending) callback(0);
}
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const messages = () => store.getSnapshot().messages;
const last = () => messages().at(-1)!;
const status = () => store.selectStatus(store.getSnapshot());

async function freshStore() {
  vi.resetModules();
  store = await import("./store");
}

const storedMessage = (overrides: Partial<Message>): Message => ({
  id: Math.random().toString(36).slice(2),
  role: "user",
  text: "hello",
  state: "complete",
  ts: 1,
  ...overrides,
});
const stored = () => JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as { messages: Message[] } | null;

beforeEach(async () => {
  calls.length = 0;
  frames.clear();
  sessionStorage.clear();
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.resetModules();
  store = await import("./store");
  await store.hydrate();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("send", () => {
  it("ignores empty input and sends while streaming", () => {
    store.send("   ");
    expect(messages()).toHaveLength(0);
    store.send("first");
    store.send("second");
    expect(messages()).toHaveLength(2);
    expect(calls).toHaveLength(1);
    expect(status()).toBe("streaming");
  });

  it("batches streamed chunks into one update per frame", () => {
    store.send("hi");
    const listener = vi.fn();
    store.subscribe(listener);
    calls[0].chunk("Hel");
    calls[0].chunk("lo ");
    calls[0].chunk("there");
    expect(last().text).toBe("");
    runFrames();
    expect(last().text).toBe("Hello there");
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("completes, saves on send and completion but never per chunk", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    store.send("hi");
    expect(stored()?.messages.map((m) => m.text)).toEqual(["hi"]);
    calls[0].chunk("a");
    runFrames();
    calls[0].chunk("b");
    runFrames();
    calls[0].done();
    await settle();
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(last()).toMatchObject({ text: "ab", state: "complete" });
    expect(status()).toBe("idle");
  });

  it("flushes buffered text on completion even when frames never run (background tab)", async () => {
    store.send("hi");
    calls[0].chunk("unflushed");
    calls[0].done();
    await settle();
    expect(last()).toMatchObject({ text: "unflushed", state: "complete" });
    expect(stored()!.messages.at(-1)!.text).toBe("unflushed");
  });

  it("treats an empty completed reply as a server error", async () => {
    store.send("hi");
    calls[0].done();
    await settle();
    expect(last()).toMatchObject({ state: "error", errorKind: "server" });
  });

  it("captures the chat id and sends it with the next request", async () => {
    store.send("one");
    calls[0].chatId("chat-1");
    calls[0].chunk("answer");
    calls[0].done();
    await settle();
    store.send("two");
    expect(calls[1].body).toEqual({
      chatId: "chat-1",
      messages: [
        { role: "user", content: "one" },
        { role: "assistant", content: "answer" },
        { role: "user", content: "two" },
      ],
    });
  });
});

describe("stop", () => {
  it("keeps partial text and marks the reply stopped", async () => {
    store.send("hi");
    calls[0].chunk("partial");
    store.stop();
    expect(calls[0].signal.aborted).toBe(true);
    expect(last()).toMatchObject({ text: "partial", state: "stopped" });
    expect(status()).toBe("idle");
    await settle();
    expect(last().state).toBe("stopped");
  });

  it("removes the reply bubble when nothing was received", () => {
    store.send("hi");
    store.stop();
    expect(messages().map((m) => m.role)).toEqual(["user"]);
    expect(status()).toBe("idle");
  });

  it("ignores chunks that arrive from the stopped stream", () => {
    store.send("hi");
    calls[0].chunk("kept");
    store.stop();
    calls[0].chunk(" stale");
    runFrames();
    expect(last().text).toBe("kept");
  });
});

describe("errors and retry", () => {
  it("keeps partial text from a mid-stream failure and allows retry", async () => {
    store.send("hi");
    calls[0].chunk("half");
    calls[0].fail(new ChatError("network", { partial: true }));
    await settle();
    expect(last()).toMatchObject({ text: "half", state: "error", errorKind: "network" });
    expect(status()).toBe("error");

    store.retry();
    expect(calls).toHaveLength(2);
    expect(messages().filter((m) => m.role === "user")).toHaveLength(1);
    expect(last()).toMatchObject({ text: "", state: "streaming" });
    expect(last().errorKind).toBeUndefined();
    expect(calls[1].body.messages).toEqual([{ role: "user", content: "hi" }]);
  });

  it("only retries when the last message is a failed reply", async () => {
    store.send("hi");
    calls[0].chunk("ok");
    calls[0].done();
    await settle();
    store.retry();
    expect(calls).toHaveLength(1);
  });

  it("leaves a failed pair out of history when sending after an error", async () => {
    store.send("q1");
    calls[0].chunk("a1");
    calls[0].done();
    await settle();
    store.send("q2");
    calls[1].fail(new ChatError("server"));
    await settle();
    store.send("q3");
    expect(calls[2].body.messages.map((m) => m.content)).toEqual(["q1", "a1", "q3"]);
    expect(messages().map((m) => m.text)).toEqual(["q1", "a1", "q2", "", "q3", ""]);
  });

  it("blocks send and retry until a 429 cooldown ends", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(1_000_000);
    store.send("hi");
    calls[0].fail(new ChatError("rate_limited", { retryAfter: 10 }));
    await settle();
    expect(last().state).toBe("error");
    expect(store.getSnapshot().rateLimitedUntil).toBe(Date.now() + 10_000);

    store.retry();
    store.send("again");
    expect(calls).toHaveLength(1);

    vi.setSystemTime(Date.now() + 10_001);
    store.retry();
    expect(calls).toHaveLength(2);
  });
});

describe("reset", () => {
  it("aborts the stream, clears state and storage, and ignores late events", async () => {
    store.send("hi");
    calls[0].chunk("partial");
    store.reset();
    expect(calls[0].signal.aborted).toBe(true);
    expect(messages()).toHaveLength(0);
    expect(store.getSnapshot().chatId).toBeNull();
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();

    calls[0].chunk("late");
    runFrames();
    await settle();
    expect(messages()).toHaveLength(0);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});

describe("persistence", () => {
  it("restores a saved conversation and turns an interrupted reply into stopped", async () => {
    sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        v: 1,
        chatId: "c1",
        messages: [
          storedMessage({ text: "q" }),
          storedMessage({ role: "assistant", text: "half", state: "streaming" }),
          storedMessage({ text: "q2" }),
          storedMessage({ role: "assistant", text: "", state: "stopped" }),
        ],
      }),
    );
    await freshStore();
    expect(store.getSnapshot().hydrated).toBe(false);
    await store.hydrate();
    expect(store.getSnapshot()).toMatchObject({ hydrated: true, chatId: "c1" });
    expect(messages().map((m) => [m.text, m.state])).toEqual([
      ["q", "complete"],
      ["half", "stopped"],
      ["q2", "complete"],
    ]);
  });

  it.each([
    ["an unknown state", JSON.stringify({ v: 1, chatId: null, messages: [{ id: "1", role: "user", text: "x", ts: 1, state: "weird" }] })],
    ["malformed JSON", "{not json"],
    ["a wrong version", JSON.stringify({ v: 2, chatId: null, messages: [] })],
  ])("discards stored data with %s", async (_, raw) => {
    sessionStorage.setItem(STORAGE_KEY, raw);
    await freshStore();
    await store.hydrate();
    expect(store.getSnapshot().hydrated).toBe(true);
    expect(messages()).toHaveLength(0);
    expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("never overwrites a message sent before hydration finishes", async () => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ v: 1, chatId: null, messages: [storedMessage({ text: "old" })] }));
    await freshStore();
    const hydrating = store.hydrate();
    store.send("new");
    await hydrating;
    expect(messages().map((m) => m.text)).toEqual(["new", ""]);
    expect(store.getSnapshot().hydrated).toBe(true);
  });

  it("falls back to a smaller save when storage is full", () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem").mockImplementationOnce(() => {
      throw new DOMException("full", "QuotaExceededError");
    });
    store.send("hi");
    expect(setItem).toHaveBeenCalledTimes(2);
    expect(stored()?.messages.map((m) => m.text)).toEqual(["hi"]);
  });

  it("keeps working in memory when storage is unavailable", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("denied", "SecurityError");
    });
    expect(() => store.send("hi")).not.toThrow();
    expect(messages()).toHaveLength(2);
  });

  it("caps saved history at the last 50 messages", async () => {
    for (let i = 0; i < 30; i++) {
      store.send(`q${i}`);
      calls[i].chunk(`a${i}`);
      calls[i].done();
      // oxlint-disable-next-line no-await-in-loop -- finish the current reply before sending the next question
      await settle();
    }
    expect(stored()!.messages).toHaveLength(50);
    expect(stored()!.messages.at(-1)!.text).toBe("a29");
  });
});

describe("snapshots", () => {
  it("returns the same reference until state changes", () => {
    const first = store.getSnapshot();
    expect(store.getSnapshot()).toBe(first);
    store.openPanel();
    expect(store.getSnapshot()).not.toBe(first);
    expect(store.getSnapshot().panelOpen).toBe(true);
  });

  it("keeps the server snapshot frozen and empty", () => {
    expect(Object.isFrozen(store.SERVER_SNAPSHOT)).toBe(true);
    expect(store.SERVER_SNAPSHOT.messages).toHaveLength(0);
    store.send("hi");
    expect(store.SERVER_SNAPSHOT.messages).toHaveLength(0);
  });
});
