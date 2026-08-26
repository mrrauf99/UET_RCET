import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatError, isAbortError, streamChat } from "./client";

const body = { messages: [{ role: "user" as const, content: "hi" }] };

function streamOf(chunks: Uint8Array[], failAfter?: number) {
  let i = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (failAfter !== undefined && i === failAfter) return controller.error(new TypeError("connection reset"));
      if (i < chunks.length) controller.enqueue(chunks[i++]);
      else controller.close();
    },
  });
}

function mockFetch(response: Response | Error) {
  const fn = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

function run(signal = new AbortController().signal) {
  const chunks: string[] = [];
  const events: string[] = [];
  const promise = streamChat(body, {
    signal,
    onChatId: (id) => events.push(`id:${id}`),
    onChunk: (text) => {
      events.push("chunk");
      chunks.push(text);
    },
  });
  return { promise, chunks, events };
}

afterEach(() => vi.unstubAllGlobals());

describe("streamChat", () => {
  it("decodes a multi-byte Urdu character split across chunks", async () => {
    const bytes = new TextEncoder().encode("سلام دنیا");
    mockFetch(new Response(streamOf([bytes.slice(0, 3), bytes.slice(3, 7), bytes.slice(7)])));
    const { promise, chunks } = run();
    await promise;
    expect(chunks.join("")).toBe("سلام دنیا");
    expect(chunks.join("")).not.toContain("�");
  });

  it("reads Chat-ID before consuming the body", async () => {
    mockFetch(new Response(streamOf([new TextEncoder().encode("hello")]), { headers: { "Chat-ID": "abc" } }));
    const { promise, events } = run();
    await promise;
    expect(events).toEqual(["id:abc", "chunk"]);
  });

  it("posts JSON to the route", async () => {
    const fetchMock = mockFetch(new Response(streamOf([])));
    await run().promise;
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/rachna-gpt",
      expect.objectContaining({ method: "POST", body: JSON.stringify(body) }),
    );
  });

  it("maps 429 to rate_limited with retryAfter", async () => {
    mockFetch(new Response("{}", { status: 429, headers: { "Retry-After": "12" } }));
    await expect(run().promise).rejects.toMatchObject({ kind: "rate_limited", options: { retryAfter: 12 } });
  });

  it.each([
    [400, "invalid"],
    [500, "server"],
  ])("maps status %i to %s", async (status, kind) => {
    mockFetch(new Response("{}", { status }));
    await expect(run().promise).rejects.toMatchObject({ kind });
  });

  it("maps a failed fetch to a network error", async () => {
    mockFetch(new TypeError("Failed to fetch"));
    await expect(run().promise).rejects.toMatchObject({ kind: "network" });
  });

  it("rethrows a user abort unchanged", async () => {
    mockFetch(new DOMException("The operation was aborted.", "AbortError"));
    const error = await run().promise.catch((e: unknown) => e);
    expect(isAbortError(error)).toBe(true);
    expect(error).not.toBeInstanceOf(ChatError);
  });

  it("treats a mid-stream failure as a partial network error", async () => {
    mockFetch(new Response(streamOf([new TextEncoder().encode("partial ")], 1)));
    const { promise, chunks } = run();
    await expect(promise).rejects.toMatchObject({ kind: "network", options: { partial: true } });
    expect(chunks.join("")).toBe("partial ");
  });
});
