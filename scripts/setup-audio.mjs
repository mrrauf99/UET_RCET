import { createWriteStream } from "node:fs";
import { access, mkdir, rename, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const revision = "1939ad2a8e416c0acfeecc08a694d14ef25f2231";
const directory = join(process.cwd(), ".cache/a11y-audio/kokoro");
const files = ["config.json", "tokenizer.json", "tokenizer_config.json", "onnx/model_quantized.onnx"];

await Promise.all(files.map(async (file) => {
  const destination = join(directory, file);
  if (await access(destination).then(() => true, () => false)) return;
  await mkdir(dirname(destination), { recursive: true });
  console.log(`Preparing audio voice: ${file}`);
  const temporary = `${destination}.${process.pid}.tmp`;
  try {
    const response = await fetch(`https://huggingface.co/onnx-community/Kokoro-82M-v1.0-ONNX/resolve/${revision}/${file}`, { signal: AbortSignal.timeout(600_000) });
    if (!response.ok || !response.body) throw new Error(`Voice download failed: HTTP ${response.status}`);
    await pipeline(Readable.fromWeb(response.body), createWriteStream(temporary));
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}));
console.log("Audio voice ready.");
