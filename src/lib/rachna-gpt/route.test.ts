import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/rachna-gpt/route";
import { university } from "@/content/university";
import { FALLBACK_ANSWER, matchAnswer } from "./mock-answers";
import { RATE_LIMIT, resetRateLimits } from "./rate-limit";

const URL_ = "http://localhost/api/rachna-gpt";

function post(body: unknown, init: { headers?: Record<string, string>; signal?: AbortSignal; raw?: string } = {}) {
  return POST(
    new Request(URL_, {
      method: "POST",
      headers: { "content-type": "application/json", "x-real-ip": "1.1.1.1", ...init.headers },
      body: init.raw ?? JSON.stringify(body),
      signal: init.signal,
    }),
  );
}

const ask = (content: string) => ({ messages: [{ role: "user", content }] });

async function readAll(response: Response): Promise<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const pending = reader.read();
    await vi.advanceTimersByTimeAsync(50);
    const { done, value } = await pending;
    if (done) return text + decoder.decode();
    text += decoder.decode(value, { stream: true });
  }
}

beforeEach(() => {
  resetRateLimits();
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
});
afterEach(() => vi.useRealTimers());

describe("POST /api/rachna-gpt guards", () => {
  it("rejects non-JSON content types with 415", async () => {
    const response = await post(ask("hi"), { headers: { "content-type": "text/plain" } });
    expect(response.status).toBe(415);
  });

  it("rejects oversize bodies with 413 before parsing", async () => {
    const response = await post(null, { raw: `{"x":"${"a".repeat(70 * 1024)}"}` });
    expect(response.status).toBe(413);
  });

  it.each([
    ["malformed JSON", { raw: "{nope" }],
    ["unknown keys", { body: { ...ask("hi"), extra: true } }],
    ["last message not from user", { body: { messages: [{ role: "user", content: "q" }, { role: "assistant", content: "a" }] } }],
    ["empty content", { body: ask("") }],
    ["over-limit user content", { body: ask("x".repeat(1001)) }],
    ["bad chatId", { body: { ...ask("hi"), chatId: "<script>" } }],
  ])("returns 400 for %s", async (_, input: { raw?: string; body?: unknown }) => {
    const response = await post(input.body, { raw: input.raw });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_request" });
  });
});

describe("POST /api/rachna-gpt streaming", () => {
  it("streams the matched answer with the expected headers", async () => {
    const response = await post(ask("How do I apply for admission?"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/plain; charset=utf-8");
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    expect(response.headers.get("chat-id")).toMatch(/^[0-9a-f-]{36}$/);
    const text = await readAll(response);
    expect(text).toBe(matchAnswer("admission"));
    expect(text).toContain("\n\n1. Choose");
  });

  it("echoes an existing chatId", async () => {
    const response = await post({ ...ask("hi"), chatId: "abc-123" });
    expect(response.headers.get("chat-id")).toBe("abc-123");
    await response.body!.cancel();
  });

  it("matches Urdu keywords after normalisation", async () => {
    expect(matchAnswer("داخلے کے بارے میں بتائیں")).toBe(matchAnswer("admission"));
    expect(matchAnswer("  FEES?  ")).toBe(matchAnswer("fee"));
    expect(matchAnswer("فیس کتنی ہے")).toBe(matchAnswer("fee"));
  });

  it("does not match short keywords inside other words", () => {
    expect(matchAnswer("this is something")).toBe(FALLBACK_ANSWER);
  });

  it("falls back to admissions contact details when nothing matches", async () => {
    const text = await readAll(await post(ask("What is the meaning of life?")));
    expect(text).toBe(FALLBACK_ANSWER);
    expect(text).toContain(university.phone);
  });
});

describe("POST /api/rachna-gpt rate limiting", () => {
  it("returns 429 with Retry-After once the per-minute limit is used", async () => {
    for (let i = 0; i < RATE_LIMIT.requests; i++) {
      const response = await post(ask("hi"));
      expect(response.status).toBe(200);
      await response.body!.cancel();
    }
    const limited = await post(ask("hi"));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
    const other = await post(ask("hi"), { headers: { "x-real-ip": "2.2.2.2" } });
    expect(other.status).toBe(200);
    await other.body!.cancel();
  });

  it("caps concurrent streams per IP and releases the slot when a stream ends", async () => {
    const first = await post(ask("hi"));
    const second = await post(ask("hi"));
    expect((await post(ask("hi"))).status).toBe(429);
    await readAll(first);
    const third = await post(ask("hi"));
    expect(third.status).toBe(200);
    await second.body!.cancel();
    await third.body!.cancel();
  });

  it("releases the slot for requests rejected by validation", async () => {
    for (let i = 0; i < RATE_LIMIT.concurrent + 1; i++) expect((await post(ask(""))).status).toBe(400);
  });

  it("stops queueing and releases the slot when the client aborts", async () => {
    const controllers = [new AbortController(), new AbortController()];
    const responses = await Promise.all(controllers.map((c) => post(ask("admission"), { signal: c.signal })));
    const reader = responses[0].body!.getReader();
    const firstChunk = reader.read();
    await vi.advanceTimersByTimeAsync(0);
    expect((await firstChunk).done).toBe(false);

    controllers[0].abort();
    await vi.advanceTimersByTimeAsync(100);
    const after = await reader.read().catch(() => ({ done: true }));
    expect(after.done).toBe(true);
    expect(vi.getTimerCount()).toBe(1);

    const next = await post(ask("hi"));
    expect(next.status).toBe(200);
    controllers[1].abort();
    await next.body!.cancel();
  });
});
