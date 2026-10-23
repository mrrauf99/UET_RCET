import "server-only";
import { createHash } from "node:crypto";
import { Worker } from "node:worker_threads";
import { join } from "node:path";

export interface AudioRequest { text: string; language: string; voice: "male" | "female"; rate: number; }

interface WorkerSlot { worker: Worker; busy: boolean; closed: boolean; prepared: boolean; idleTimer?: ReturnType<typeof setTimeout>; }
interface AudioTimings { modelInitMs: number; inferenceMs: number; encodingMs: number; }
interface AudioResult { error?: string; audio?: Uint8Array<ArrayBuffer>; ready?: boolean; prepared?: boolean; timings?: AudioTimings; }
interface AudioService {
  workers: Set<WorkerSlot>;
  cache: Map<string, { audio: Uint8Array<ArrayBuffer>; expires: number }>;
  cacheBytes: number;
  keepWarm: boolean;
  preparation?: Promise<void>;
  retryTimer?: ReturnType<typeof setTimeout>;
}
// Startup instrumentation and route bundles must share the same pool, including during hot reload.
const shared = globalThis as typeof globalThis & { rcetAudioService?: AudioService };
const service: AudioService = shared.rcetAudioService ??= { workers: new Set(), cache: new Map(), cacheBytes: 0, keepWarm: false };
const { workers, cache } = service;
const CACHE_BYTES = 32 * 1024 * 1024;
const CACHE_TTL = 10 * 60_000;
const MAX_WORKERS = 2;
const GENERATION_TIMEOUT = 180_000;

function removeCached(key: string) {
  const entry = cache.get(key);
  if (entry) { service.cacheBytes -= entry.audio.byteLength; cache.delete(key); }
}

function cachedAudio(key: string) {
  const entry = cache.get(key);
  if (!entry) return;
  if (entry.expires <= Date.now()) { removeCached(key); return; }
  cache.delete(key);
  cache.set(key, entry);
  return entry.audio.slice();
}

function rememberAudio(key: string, audio: Uint8Array<ArrayBuffer>) {
  if (audio.byteLength > CACHE_BYTES) return;
  for (const [oldKey, entry] of cache) if (entry.expires <= Date.now()) removeCached(oldKey);
  removeCached(key);
  while (cache.size >= 32 || service.cacheBytes + audio.byteLength > CACHE_BYTES) removeCached(cache.keys().next().value!);
  cache.set(key, { audio: audio.slice(), expires: Date.now() + CACHE_TTL });
  service.cacheBytes += audio.byteLength;
}

function schedulePreparation() {
  if (!service.keepWarm || service.preparation || service.retryTimer || [...workers].some((slot) => slot.prepared && !slot.closed)) return;
  service.retryTimer = setTimeout(() => {
    service.retryTimer = undefined;
    void prewarmAudioWorker().catch(() => console.warn("Audio worker preparation failed."));
  }, 30_000);
  service.retryTimer.unref();
}

function retire(slot: WorkerSlot) {
  if (slot.closed) return;
  slot.closed = true;
  clearTimeout(slot.idleTimer);
  void slot.worker.terminate();
}

function acquireWorker() {
  const available = [...workers].filter((candidate) => !candidate.busy && !candidate.closed);
  let slot = available.find((candidate) => candidate.prepared) ?? available[0];
  if (!slot) {
    if (workers.size >= MAX_WORKERS) throw new Error("busy");
    // Reuse the loaded speech model while keeping CPU work off the server's event loop.
    const worker = new Worker(join(process.cwd(), "src/lib/a11y/audio-worker.mjs"));
    slot = { worker, busy: false, closed: false, prepared: false };
    const created = slot;
    workers.add(created);
    worker.on("error", () => retire(created));
    worker.once("exit", () => { created.closed = true; clearTimeout(created.idleTimer); workers.delete(created); schedulePreparation(); });
  }
  clearTimeout(slot.idleTimer);
  slot.busy = true;
  slot.worker.ref();
  return slot;
}

function runWorker(slot: WorkerSlot, input: AudioRequest | { type: "warmup" }, signal: AbortSignal, timeoutMs = GENERATION_TIMEOUT): Promise<AudioResult> {
  return new Promise((resolve, reject) => {
    const { worker } = slot;
    let settled = false;
    const finish = (error?: Error, result?: AudioResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      signal.removeEventListener("abort", abort);
      worker.off("message", message);
      worker.off("error", failed);
      worker.off("exit", stopped);
      if (error && error.message !== "unsupported_language") retire(slot);
      else {
        slot.busy = false;
        slot.idleTimer = setTimeout(() => {
          // Retain one loaded model; the second worker still expires after two idle minutes.
          if (slot.prepared && ![...workers].some((other) => other !== slot && other.prepared && !other.closed)) return;
          retire(slot);
        }, 120_000);
        slot.idleTimer.unref();
        worker.unref();
      }
      if (error) reject(error);
      else resolve(result!);
    };
    const abort = () => finish(new Error("aborted"));
    const message = (result: AudioResult) => {
      slot.prepared ||= result.prepared === true;
      if (result.error || ("type" in input ? !result.ready : !result.audio?.length)) finish(new Error(result.error || "empty_audio"));
      else finish(undefined, result);
    };
    const failed = (error: Error) => finish(error);
    const stopped = () => finish(new Error("audio_worker_stopped"));
    const timeout = setTimeout(() => finish(new Error("timeout")), timeoutMs);
    signal.addEventListener("abort", abort, { once: true });
    worker.once("message", message);
    worker.once("error", failed);
    worker.once("exit", stopped);
    if (signal.aborted) abort();
    else {
      // oxlint-disable-next-line require-post-message-target-origin -- Node Workers do not use browser origins.
      try { worker.postMessage(input); } catch (error) { finish(error instanceof Error ? error : new Error("audio_failed")); }
    }
  });
}

function logTiming(values: Record<string, string | number>) {
  console.info("Audio Generation Timing:", JSON.stringify(Object.fromEntries(Object.entries(values).map(([name, value]) => [name, typeof value === "number" ? Math.round(value * 100) / 100 : value]))));
}

export function prewarmAudioWorker(): Promise<void> {
  service.keepWarm = true;
  if (service.preparation) return service.preparation;
  if ([...workers].some((slot) => slot.prepared && !slot.closed)) return Promise.resolve();
  clearTimeout(service.retryTimer);
  service.retryTimer = undefined;
  const started = performance.now();
  try {
    const slot = acquireWorker();
    service.preparation = runWorker(slot, { type: "warmup" }, new AbortController().signal).then((result) => {
      logTiming({ operation: "warmup", worker: "READY", ...result.timings, totalMs: performance.now() - started });
    }).finally(() => { service.preparation = undefined; schedulePreparation(); });
    return service.preparation;
  } catch (error) {
    schedulePreparation();
    return Promise.reject(error);
  }
}

function waitForPreparation(preparation: Promise<void>, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const abort = () => { signal.removeEventListener("abort", abort); reject(new Error("aborted")); };
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    // A cancelled download must not terminate preparation shared by other requests.
    void preparation.then(() => resolve(), () => resolve()).finally(() => signal.removeEventListener("abort", abort));
  });
}

export async function generateAudio(input: AudioRequest, signal: AbortSignal, receivedAt = Date.now()): Promise<Uint8Array<ArrayBuffer>> {
  const started = performance.now();
  const timing = { receivedAt: new Date(receivedAt).toISOString(), cache: "MISS", worker: "NONE", cacheLookupMs: 0, workerAcquireMs: 0, preparationWaitMs: 0, modelInitMs: 0, inferenceMs: 0, encodingMs: 0 };
  let outcome = "ERROR";
  try {
    if (!/^en(?:-|$)/i.test(input.language)) throw new Error("unsupported_language");
    if (signal.aborted) throw new Error("aborted");
    const lookup = performance.now();
    const key = createHash("sha256").update(JSON.stringify([input.text, input.language, input.voice, input.rate])).digest("hex");
    const cached = cachedAudio(key);
    timing.cacheLookupMs = performance.now() - lookup;
    if (cached) { timing.cache = "HIT"; outcome = "OK"; return cached; }
    if (service.preparation) {
      const waiting = performance.now();
      await waitForPreparation(service.preparation, signal);
      timing.preparationWaitMs = performance.now() - waiting;
    }
    if (signal.aborted) throw new Error("aborted");
    const remaining = GENERATION_TIMEOUT - (performance.now() - started);
    if (remaining <= 0) throw new Error("timeout");
    const acquiring = performance.now();
    const slot = acquireWorker();
    timing.workerAcquireMs = performance.now() - acquiring;
    timing.worker = slot.prepared ? "WARM" : "COLD";
    const result = await runWorker(slot, input, signal, remaining);
    Object.assign(timing, result.timings);
    rememberAudio(key, result.audio!);
    outcome = "OK";
    return result.audio!;
  } finally { logTiming({ ...timing, outcome, totalMs: performance.now() - started }); }
}
