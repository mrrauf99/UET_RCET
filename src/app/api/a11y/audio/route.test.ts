import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";
const synthesize = vi.hoisted(() => vi.fn(async (_input: unknown, _signal: AbortSignal) => new Uint8Array([0xff, 0xf3, 0x80, 0x00])));
vi.mock("@/lib/a11y/audio-server", () => ({ generateAudio: synthesize }));
function request(body: unknown, headers: HeadersInit = { "Content-Type": "application/json" }) {
  return new Request("http://localhost:3000/api/a11y/audio", { method: "POST", headers, body: JSON.stringify(body) });
}

describe("Audio download endpoint", () => {
  it("returns an English MP3 with the requested voice and speed", async () => {
    const input = { text: "Read this.", voice: "male", rate: 1.4, language: "en-GB" };
    const response = await POST(request(input));
    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(response.headers.get("Content-Disposition")).toContain("RCET-Audio.mp3");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(synthesize.mock.calls.at(-1)![0]).toEqual(input);
  });

  it("rejects empty text, huge passages, invalid voice, invalid language and invalid speed", async () => {
    for (const body of [{ text: " " }, { text: "a".repeat(12_001) }, { text: "Read", rate: 9 }, { text: "Read", voice: "unknown" }, { text: "Read", language: "../en" }]) {
      // oxlint-disable-next-line no-await-in-loop -- each request exercises a distinct validation branch
      expect((await POST(request(body))).status).toBe(400);
    }
    expect((await POST(request({ text: "Read" }, { "Content-Type": "text/plain" }))).status).toBe(415);
    expect((await POST(request({ text: "Read" }, { "Content-Type": "application/json", "Content-Length": "60001" }))).status).toBe(413);
    expect((await POST(request({ text: "Read" }, { "Content-Type": "application/json", Origin: "https://another-site.example" }))).status).toBe(403);
  });

  it("rejects non-English requests before synthesis", async () => {
    const callsBefore = synthesize.mock.calls.length;
    const response = await POST(request({ text: "Read", language: "ur" }));
    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({ error: "unsupported_language" });
    expect(synthesize.mock.calls).toHaveLength(callsBefore);
  });

  it("releases capacity after an unsupported-language worker failure", async () => {
    synthesize.mockRejectedValueOnce(new Error("unsupported_language"));
    expect((await POST(request({ text: "Read" }))).status).toBe(422);
    expect((await POST(request({ text: "Read" }))).status).toBe(200);
  });

  it("retains the busy response while a cancelled worker is shutting down", async () => {
    synthesize.mockRejectedValueOnce(new Error("busy"));
    const response = await POST(request({ text: "Read" }));
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("5");
    expect(await response.json()).toEqual({ error: "busy" });
  });
});
