/* oxlint-disable require-post-message-target-origin -- Node MessagePort has no targetOrigin parameter. */
/* oxlint-disable no-await-in-loop -- Serialize CPU inference to preserve order and bound memory. */
import { parentPort } from "node:worker_threads";
import { join } from "node:path";
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

async function synthesizeAudio(input, timings) {
  if (!/^en(?:-|$)/i.test(input.language)) throw new Error("unsupported_language");
  return englishAudio(input, timings);
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
