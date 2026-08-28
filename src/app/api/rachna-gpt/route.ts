import { matchAnswer } from "@/lib/rachna-gpt/mock-answers";
import { acquire, getClientIp } from "@/lib/rachna-gpt/rate-limit";
import { LIMITS } from "@/lib/rachna-gpt/constants";
import { chatRequestSchema } from "@/lib/rachna-gpt/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const WORD_DELAY_MS = 30;

const json = (status: number, error: string, headers?: HeadersInit) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store", ...headers } });

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return json(415, "unsupported_media_type");
  }
  if (Number(request.headers.get("content-length") ?? 0) > LIMITS.bodyBytes) return json(413, "payload_too_large");

  const limit = acquire(getClientIp(request.headers));
  if (!limit.ok) return json(429, "rate_limited", { "Retry-After": String(limit.retryAfter) });

  const release = limit.release;

  try {
    // Content-Length is optional (chunked bodies), so the size is checked again on the text itself.
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > LIMITS.bodyBytes) {
      release();
      return json(413, "payload_too_large");
    }
    const parsed = chatRequestSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      release();
      return json(400, "invalid_request");
    }

    const { chatId, messages } = parsed.data;
    // Splitting on a capture group keeps every space and newline as its own piece.
    const pieces = matchAnswer(messages.at(-1)!.content).split(/(\s+)/).filter(Boolean);
    const encoder = new TextEncoder();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let onAbort: () => void;
    const finish = () => {
      clearTimeout(timer);
      request.signal.removeEventListener("abort", onAbort);
      release();
    };

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        let index = 0;
        onAbort = () => {
          finish();
          try {
            controller.close();
          } catch {
            // Already closed or cancelled by the runtime.
          }
        };
        request.signal.addEventListener("abort", onAbort, { once: true });

        const next = () => {
          if (request.signal.aborted) return onAbort();
          if (index >= pieces.length) {
            finish();
            controller.close();
            return;
          }
          controller.enqueue(encoder.encode(pieces[index++]));
          timer = setTimeout(next, WORD_DELAY_MS);
        };
        next();
      },
      cancel: finish,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Chat-ID": chatId ?? crypto.randomUUID(),
        "Cache-Control": "no-store",
        // Stops nginx from buffering the stream into a single late response.
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    release();
    if (error instanceof SyntaxError) return json(400, "invalid_request");
    return json(500, "server_error");
  }
}
