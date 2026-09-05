import type { EventEmitter } from "node:events";
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from "vitest";
import type { AudioRequest } from "./audio-server";

type FakeWorker = EventEmitter & { postMessage: Mock<(input: AudioRequest) => void>; terminate: Mock<() => Promise<number>>; unref: Mock<() => void>; };
const { instances } = vi.hoisted(() => ({ instances: [] as FakeWorker[] }));
vi.mock("node:worker_threads", async () => {
  const { EventEmitter } = await import("node:events");
  return { Worker: class extends EventEmitter {
    constructor() { super(); instances.push(this); }
    postMessage = vi.fn<(input: AudioRequest) => void>();
    ref = vi.fn();
    unref = vi.fn<() => void>();
    terminate = vi.fn(async () => { await Promise.resolve(); this.emit("exit", 0); return 0; });
  } };
});

let generateAudio: typeof import("./audio-server").generateAudio;
let prewarmAudioWorker: typeof import("./audio-server").prewarmAudioWorker;
const input: AudioRequest = { text: "Read this passage.", language: "en", voice: "female", rate: 1 };
const signal = () => new AbortController().signal;
const mp3 = () => new Uint8Array([0xff, 0xf3, 0x80, 0x00]);
const complete = (worker: FakeWorker, audio = mp3()) => worker.emit("message", { audio, prepared: true, timings: { modelInitMs: 0, inferenceMs: 12, encodingMs: 1 } });
const prepared = (worker: FakeWorker) => worker.emit("message", { ready: true, prepared: true, timings: { modelInitMs: 5, inferenceMs: 12, encodingMs: 1 } });
beforeEach(async () => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.stubGlobal("rcetAudioService", undefined);
  vi.spyOn(console, "info").mockImplementation(() => {});
  instances.length = 0;
  ({ generateAudio, prewarmAudioWorker } = await import("./audio-server"));
});
afterEach(async () => {
  await Promise.all(instances.map((worker) => worker.terminate()));
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Audio worker reuse and cache", () => {
  it("reuses a worker for new text and returns independent copies of cached MP3s", async () => {
    const first = generateAudio(input, signal());
    complete(instances[0]);
    const original = await first;
    original[0] = 0;
    const cached = await generateAudio(input, signal());
    expect(cached).toEqual(mp3());
    cached[0] = 0;
    expect(await generateAudio(input, signal())).toEqual(mp3());
    expect(instances[0].postMessage).toHaveBeenCalledTimes(1);
    const next = generateAudio({ ...input, text: "Another passage." }, signal());
    expect(instances).toHaveLength(1);
    complete(instances[0]);
    await next;
    expect(instances[0].postMessage).toHaveBeenCalledTimes(2);
    expect(instances[0].unref).toHaveBeenCalled();
    expect(instances[0].listenerCount("message")).toBe(0);
  });

  it("separates cache entries by text, language, voice and speed", async () => {
    for (const variant of [input, { ...input, text: "Different." }, { ...input, language: "ur" }, { ...input, voice: "male" as const }, { ...input, rate: 1.5 }]) {
      const result = generateAudio(variant, signal());
      complete(instances[0]);
      // oxlint-disable-next-line no-await-in-loop -- complete this request before issuing the next.
      await result;
    }
    expect(instances).toHaveLength(1);
    expect(instances[0].postMessage).toHaveBeenCalledTimes(5);
  });

  it("expires results while retaining the only prepared worker", async () => {
    const first = generateAudio(input, signal());
    complete(instances[0]); await first;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(instances[0].terminate).not.toHaveBeenCalled();
    expect(await generateAudio(input, signal())).toEqual(mp3());
    expect(instances).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(480_000);
    const expired = generateAudio(input, signal());
    expect(instances).toHaveLength(1);
    complete(instances[0]); await expired;
    expect(instances[0].postMessage).toHaveBeenCalledTimes(2);
  });

  it("releases surplus idle workers and retains one prepared model", async () => {
    const first = generateAudio(input, signal());
    const second = generateAudio({ ...input, text: "Another." }, signal());
    complete(instances[0]); complete(instances[1]);
    await Promise.all([first, second]);
    await vi.advanceTimersByTimeAsync(120_000);
    expect(instances.filter((worker) => worker.terminate.mock.calls.length)).toHaveLength(1);
    const retained = instances.find((worker) => !worker.terminate.mock.calls.length)!;
    const next = generateAudio({ ...input, text: "After idle." }, signal());
    expect(instances).toHaveLength(2);
    complete(retained); await next;
  });

  it("releases an idle worker that has not prepared the English model", async () => {
    const first = generateAudio({ ...input, language: "ur" }, signal());
    instances[0].emit("message", { audio: mp3(), prepared: false });
    await first;
    await vi.advanceTimersByTimeAsync(120_000);
    expect(instances[0].terminate).toHaveBeenCalledOnce();
  });

  it("evicts old results when the byte budget is reached", async () => {
    const audio = new Uint8Array(4 * 1024 * 1024);
    for (let index = 0; index < 9; index++) {
      const result = generateAudio({ ...input, text: `Passage ${index}` }, signal());
      complete(instances[0], audio);
      // oxlint-disable-next-line no-await-in-loop -- exercise sequential cache insertions.
      await result;
    }
    const evicted = generateAudio({ ...input, text: "Passage 0" }, signal());
    expect(instances[0].postMessage).toHaveBeenCalledTimes(10);
    complete(instances[0]); await evicted;
  });

  it("bounds live workers and cancels only the aborted job", async () => {
    const controller = new AbortController();
    const first = generateAudio(input, controller.signal);
    const other = generateAudio({ ...input, text: "Other." }, signal());
    await expect(generateAudio({ ...input, text: "Third." }, signal())).rejects.toThrow("busy");
    controller.abort();
    await expect(first).rejects.toThrow("aborted");
    expect(instances[1].terminate).not.toHaveBeenCalled();
    complete(instances[1]); await other;
    const retry = generateAudio(input, signal());
    complete(instances[1]); await retry;
    expect(instances[1].postMessage).toHaveBeenCalledTimes(2);
  });

  it("rejects a pre-aborted request even when the result is cached", async () => {
    const first = generateAudio(input, signal());
    complete(instances[0]); await first;
    await expect(generateAudio(input, AbortSignal.abort())).rejects.toThrow("aborted");
    expect(instances[0].postMessage).toHaveBeenCalledTimes(1);
  });

  it("times out, discards failed workers, and permits retry", async () => {
    const first = generateAudio(input, signal());
    const failed = expect(first).rejects.toThrow("timeout");
    await vi.advanceTimersByTimeAsync(180_000);
    await failed;
    const retry = generateAudio(input, signal());
    expect(instances).toHaveLength(2);
    complete(instances[1]); await retry;
  });

  it("does not cache unsupported languages", async () => {
    const first = generateAudio(input, signal());
    instances[0].emit("message", { error: "unsupported_language" });
    await expect(first).rejects.toThrow("unsupported_language");
    const retry = generateAudio(input, signal());
    complete(instances[0]); await retry;
    expect(instances[0].postMessage).toHaveBeenCalledTimes(2);
  });

  it("rejects empty audio and recreates the failed worker on retry", async () => {
    const first = generateAudio(input, signal());
    complete(instances[0], new Uint8Array());
    await expect(first).rejects.toThrow("empty_audio");
    const retry = generateAudio(input, signal());
    expect(instances).toHaveLength(2);
    complete(instances[1]); await retry;
  });

  it.each(["error", "exit"])("recovers after a worker %s", async (event) => {
    const first = generateAudio(input, signal());
    instances[0].emit(event, event === "error" ? new Error("synthesis_failed") : 1);
    await expect(first).rejects.toThrow(event === "error" ? "synthesis_failed" : "audio_worker_stopped");
    const retry = generateAudio(input, signal());
    complete(instances[1]); await retry;
  });
});

describe("Audio startup preparation", () => {
  it("prepares one shared worker without caching its sample or repeating startup", async () => {
    const first = prewarmAudioWorker();
    expect(prewarmAudioWorker()).toBe(first);
    expect(instances).toHaveLength(1);
    expect(instances[0].postMessage).toHaveBeenCalledWith({ type: "warmup" });
    prepared(instances[0]); await first;
    await prewarmAudioWorker();
    expect(instances[0].postMessage).toHaveBeenCalledTimes(1);
    vi.resetModules();
    const reloaded = await import("./audio-server");
    await reloaded.prewarmAudioWorker();
    const download = reloaded.generateAudio(input, signal());
    expect(instances).toHaveLength(1);
    complete(instances[0]); await download;
    expect(await reloaded.generateAudio(input, signal())).toEqual(mp3());
    expect(instances[0].postMessage).toHaveBeenCalledTimes(2);
    const log = JSON.parse(vi.mocked(console.info).mock.calls.at(-2)![1]);
    expect(log).toMatchObject({ cache: "MISS", worker: "WARM", modelInitMs: 0, inferenceMs: 12, encodingMs: 1 });
    expect(JSON.stringify(log)).not.toContain(input.text);
  });

  it("waits for shared preparation and cancels a waiting request without stopping it", async () => {
    const startup = prewarmAudioWorker();
    const controller = new AbortController();
    const cancelled = generateAudio(input, controller.signal);
    const other = generateAudio({ ...input, text: "Other." }, signal());
    controller.abort();
    await expect(cancelled).rejects.toThrow("aborted");
    expect(instances[0].terminate).not.toHaveBeenCalled();
    expect(instances).toHaveLength(1);
    prepared(instances[0]); await startup;
    await vi.advanceTimersByTimeAsync(0);
    expect(instances[0].postMessage).toHaveBeenCalledTimes(2);
    complete(instances[0]); await other;
  });

  it("recovers from preparation failure without caching a failure", async () => {
    const startup = prewarmAudioWorker();
    const failed = expect(startup).rejects.toThrow("audio_failed");
    instances[0].emit("message", { error: "audio_failed" });
    await failed;
    await vi.advanceTimersByTimeAsync(30_000);
    expect(instances).toHaveLength(2);
    prepared(instances[1]);
    await vi.advanceTimersByTimeAsync(0);
    const retry = generateAudio(input, signal());
    complete(instances[1]); await retry;
  });

  it("replaces the only prepared worker after a cancelled synthesis", async () => {
    const startup = prewarmAudioWorker();
    prepared(instances[0]); await startup;
    const controller = new AbortController();
    const download = generateAudio(input, controller.signal);
    controller.abort();
    await expect(download).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(30_000);
    expect(instances).toHaveLength(2);
    prepared(instances[1]);
    await vi.advanceTimersByTimeAsync(0);
    const next = generateAudio(input, signal());
    complete(instances[1]); await next;
  });
});
