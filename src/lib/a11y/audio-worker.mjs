/* oxlint-disable require-post-message-target-origin -- Node MessagePort has no targetOrigin parameter. */
/* oxlint-disable no-await-in-loop -- Serialize CPU inference to preserve order and bound memory. */
import { parentPort } from "node:worker_threads";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import text2wav from "text2wav";
import { Mp3Encoder } from "@breezystack/lamejs";
import { speechChunks } from "./audio-text.mjs";

function encodeMp3(samples, sampleRate) {
  const encoder = new Mp3Encoder(1, sampleRate, 96);
  const chunks = [];
  for (const segment of samples) {
    for (let offset = 0; offset < segment.length; offset += 1152) chunks.push(Buffer.from(encoder.encodeBuffer(segment.subarray(offset, offset + 1152))));
  }
  chunks.push(Buffer.from(encoder.flush()));
  return Buffer.concat(chunks);
}

let englishEngine;
async function loadEnglishEngine() {
  const { KokoroTTS, TextSplitterStream } = await import("kokoro-js");
  const { env, StyleTextToSpeech2Model, AutoTokenizer } = await import("@huggingface/transformers");
  env.allowRemoteModels = false;
  env.localModelPath = join(process.cwd(), ".cache/a11y-audio").replaceAll("\\", "/");
  const [model, tokenizer] = await Promise.all([
    StyleTextToSpeech2Model.from_pretrained("kokoro", { dtype: "q8", device: "cpu", session_options: { intraOpNumThreads: 2, interOpNumThreads: 1 } }),
    AutoTokenizer.from_pretrained("kokoro"),
  ]);
  return { tts: new KokoroTTS(model, tokenizer), tokenizer, TextSplitterStream };
}

async function englishAudio(input, timings) {
  const initialization = performance.now();
  englishEngine ??= loadEnglishEngine();
  const { tts, tokenizer, TextSplitterStream } = await englishEngine;
  timings.modelInitMs = performance.now() - initialization;
  const voice = input.voice === "male" ? "bm_george" : "bf_emma";
  const segments = [];
  async function synthesize(text) {
    const splitter = new TextSplitterStream();
    splitter.push(text);
    splitter.close();
    const stream = tts.stream(splitter, { voice, speed: input.rate });
    while (true) {
      const started = performance.now();
      const result = await stream.next();
      timings.inferenceMs += performance.now() - started;
      if (result.done) break;
      const { text: sentence, phonemes, audio } = result.value;
      // Numbers can expand beyond the model's context even in a short sentence.
      if (tokenizer(phonemes, { truncation: false }).input_ids.dims.at(-1) > 512) {
        for (const part of speechChunks(sentence, Math.max(1, Math.floor(sentence.length / 2)))) await synthesize(part);
        continue;
      }
      const samples = Int16Array.from(audio.audio, (sample) => Math.round(Math.max(-1, Math.min(1, sample)) * 32767));
      if (segments.length) segments.push(new Int16Array(Math.round(audio.sampling_rate * 0.15 / input.rate)));
      segments.push(samples);
    }
  }
  const text = input.text.replace(/\b(?:RCET|UET)\b/g, (acronym) => acronym.split("").join(" "));
  for (const part of speechChunks(text)) await synthesize(part);
  const encoding = performance.now();
  const audio = encodeMp3(segments, 24_000);
  timings.encodingMs = performance.now() - encoding;
  return audio;
}

const directory = join(process.cwd(), "node_modules/text2wav/espeak-ng-data/lang");
function languages(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const file = join(path, entry.name);
    return entry.isDirectory() ? languages(file) : [...readFileSync(file, "utf8").matchAll(/^language\s+(\S+)/gm)].map((match) => match[1].toLowerCase());
  });
}
const supported = new Set(languages(directory));
const aliases = { "zh-cn": "cmn", "zh-tw": "cmn", zh: "cmn", "zh-yue": "yue", fil: "tl", iw: "he", jw: "jv" };
async function synthesizeAudio(input, timings) {
  const requested = input.language.toLowerCase();
  const language = aliases[requested] || requested;
  const voice = supported.has(language) ? language : language.split("-")[0];
  if (!supported.has(voice)) throw new Error("unsupported_language");
  if (voice === "en" || voice.startsWith("en-")) return englishAudio(input, timings);
  // This Emscripten build predates Node's fetch; load its local WASM through the filesystem.
  const nativeFetch = globalThis.fetch;
  globalThis.fetch = undefined;
  let wav;
  const inference = performance.now();
  try {
    // The CLI bridge requires strings; numeric options silently revert to its defaults.
    wav = await text2wav(` ${input.text}`, { voice: `${voice}+${input.voice === "male" ? "m3" : "f3"}`, speed: String(Math.round(175 * input.rate)), encoding: "1" });
  } finally { globalThis.fetch = nativeFetch; }
  timings.inferenceMs = performance.now() - inference;
  const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
  if (view.getUint16(20, true) !== 1 || view.getUint16(22, true) !== 1 || view.getUint16(34, true) !== 16) throw new Error("Invalid speech audio");
  const samples = new Int16Array(wav.buffer.slice(wav.byteOffset + 44, wav.byteOffset + wav.byteLength));
  const encoding = performance.now();
  const audio = encodeMp3([samples], view.getUint32(24, true));
  timings.encodingMs = performance.now() - encoding;
  return audio;
}

let prepared = false;
parentPort.on("message", async (input) => {
  const timings = { modelInitMs: 0, inferenceMs: 0, encodingMs: 0 };
  try {
    if (input.type === "warmup") {
      await synthesizeAudio({ text: "Welcome to Rachna College of Engineering and Technology, where selected text can be saved as a spoken audio file.", language: "en", voice: "female", rate: 1 }, timings);
      prepared = true;
      parentPort.postMessage({ ready: true, prepared, timings });
      return;
    }
    const audio = Uint8Array.from(await synthesizeAudio(input, timings));
    if (/^en(?:-|$)/i.test(input.language)) prepared = true;
    parentPort.postMessage({ audio, prepared, timings }, [audio.buffer]);
  } catch (error) {
    parentPort.postMessage({ error: error instanceof Error ? error.message : "audio_failed", prepared, timings });
  }
});
