export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;
  const { prewarmAudioWorker } = await import("./lib/a11y/audio-server");
  try {
    await prewarmAudioWorker();
  } catch {
    console.warn("Audio worker preparation failed; audio requests can retry initialization.");
  }
}
