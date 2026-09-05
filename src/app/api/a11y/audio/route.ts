import { z } from "zod";
import { generateAudio } from "@/lib/a11y/audio-server";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 60_000;
let activeDownloads = 0;
const schema = z.object({
  text: z.string().trim().min(1).max(12_000),
  language: z.string().regex(/^[a-z]{2,3}(?:-[a-z0-9]{2,8})*$/i).max(40).default("en"),
  voice: z.enum(["male", "female"]).default("female"),
  rate: z.number().min(0.5).max(2).default(1),
});
const json = (status: number, error: string, headers?: HeadersInit) => Response.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: Request) {
  const receivedAt = Date.now();
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json(403, "invalid_origin");
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json(415, "unsupported_media_type");
  if (Number(request.headers.get("content-length") || 0) > MAX_BODY_BYTES) return json(413, "payload_too_large");
  let input;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) return json(413, "payload_too_large");
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return json(400, "invalid_request");
    input = parsed.data;
  } catch { return json(400, "invalid_request"); }
  if (activeDownloads >= 2) return json(429, "busy", { "Retry-After": "5" });
  activeDownloads++;
  try {
    const audio = await generateAudio(input, request.signal, receivedAt);
    return new Response(audio, { headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": 'attachment; filename="RCET-Audio.mp3"',
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "audio_failed";
    if (message === "busy") return json(429, "busy", { "Retry-After": "5" });
    if (message !== "unsupported_language" && message !== "aborted") console.error("Audio download failed:", error);
    return json(message === "unsupported_language" ? 422 : message === "timeout" ? 504 : 503, message === "unsupported_language" ? message : "audio_failed");
  } finally { activeDownloads--; }
}
