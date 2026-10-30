import "server-only";
import { generateAudio as synthesize, type AudioRequest } from "accessibility-toolbar/server";
export { prewarmAudioWorker } from "accessibility-toolbar/server";

export function generateAudio(input: AudioRequest, signal: AbortSignal, receivedAt?: number) {
  const text = input.text.replace(/\b(?:RCET|UET)\b/g, (acronym) => acronym.split("").join(" "));
  return synthesize({ ...input, text }, signal, receivedAt);
}
