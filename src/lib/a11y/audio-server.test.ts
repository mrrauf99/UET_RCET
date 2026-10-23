import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { generateAudio, prewarmAudioWorker } from "./audio-server";

const passage = "Welcome to Rachna College of Engineering and Technology. Select this passage to download an audio file.";
const input = { text: passage, language: "en", voice: "female" as const, rate: 1 };
describe("Audio synthesis worker", () => {
  it("prepares the production pipeline and preserves the existing MP3 bytes", async () => {
    await prewarmAudioWorker();
    const request = { ...input, text: "Explore undergraduate and postgraduate programs at RCET, a constituent college of UET Lahore." };
    const audio = await generateAudio(request, new AbortController().signal);
    expect(audio.length).toBe(88_992);
    expect(createHash("sha256").update(audio).digest("hex")).toBe("fbf1fc260629eb3613a0edd8ff3ee0fcf848ee89a9683ec191d45e12ae2420a6");
    expect(await generateAudio(request, new AbortController().signal)).toEqual(audio);
  }, 120_000);

  it("creates MP3 speech and applies voice and reading speed", async () => {
    const normal = await generateAudio(input, new AbortController().signal);
    const fast = await generateAudio({ ...input, rate: 2, voice: "male" }, new AbortController().signal);
    expect(normal[0]).toBe(0xff);
    expect(normal[1] & 0xe0).toBe(0xe0);
    expect(normal.length).toBeGreaterThan(10_000);
    expect(fast.length).toBeLessThan(normal.length * 0.8);
    expect(fast).not.toEqual(normal);
  }, 90_000);

  it("rejects non-English languages before acquiring a worker", async () => {
    for (const language of ["ur", "ar", "fr", "xx"]) {
      // oxlint-disable-next-line no-await-in-loop -- Assert each language is rejected before worker use.
      await expect(generateAudio({ ...input, language }, new AbortController().signal)).rejects.toThrow("unsupported_language");
    }
  }, 15_000);

  it("runs two English workers concurrently and reuses them afterward", async () => {
    const [first, second] = await Promise.all([
      generateAudio({ ...input, text: "Welcome to our college." }, new AbortController().signal),
      generateAudio({ ...input, text: "Save this audio file." }, new AbortController().signal),
    ]);
    expect(first.length).toBeGreaterThan(1000);
    expect(second.length).toBeGreaterThan(1000);
    expect(first).not.toEqual(second);
    const next = await generateAudio({ ...input, text: "The workers are ready." }, new AbortController().signal);
    expect(next[0]).toBe(0xff);
  }, 90_000);

  it("cancels a worker when its request is aborted", async () => {
    const controller = new AbortController();
    const audio = generateAudio({ ...input, text: `${passage} Cancel this request.` }, controller.signal);
    controller.abort();
    await expect(audio).rejects.toThrow("aborted");
  });
});
