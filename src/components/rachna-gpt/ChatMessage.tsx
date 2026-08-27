"use client";

import { Fragment, memo } from "react";
import { rachnaGpt } from "@/content/rachna-gpt";
import { cn } from "@/lib/cn";
import { retry } from "@/lib/rachna-gpt/store";
import type { Message } from "@/lib/rachna-gpt/types";
import { useCooldownSeconds } from "@/lib/rachna-gpt/use-chat";

const LINKS = /(https?:\/\/[^\s]*[^\s.,;:!?)]|[\w.+-]+@[\w-]+\.[\w.-]*\w|\b0\d{2,3}-\d{6,8}\b)/g;
const linkClass = "text-link underline underline-offset-2";

// Answers are plain text; contacts and URLs become links. Built as elements, never as HTML.
function Linkified({ text }: { text: string }) {
  return text.split(LINKS).map((part, index) => {
    if (index % 2 === 0) return <Fragment key={index}>{part}</Fragment>;
    if (part.startsWith("http")) {
      return (
        <a key={index} href={part} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {part}
        </a>
      );
    }
    const href = part.includes("@") ? `mailto:${part}` : `tel:${part}`;
    return (
      <a key={index} href={href} className={linkClass}>
        {part}
      </a>
    );
  });
}

function TypingIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className="typing-dot size-1.5 rounded-full bg-current opacity-60"
          style={{ "--i": i } as React.CSSProperties}
        />
      ))}
      <span className="typing-label ms-1 text-sm text-fg-muted">Thinking…</span>
    </span>
  );
}

function RetryButton() {
  const cooldown = useCooldownSeconds();
  return (
    <button
      type="button"
      onClick={retry}
      aria-disabled={cooldown > 0}
      className="min-h-11 rounded-md px-2 font-bold text-link underline underline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:text-fg-muted aria-disabled:no-underline"
    >
      {cooldown > 0 ? `Retry in ${cooldown} s` : "Retry"}
    </button>
  );
}

interface ChatMessageProps {
  message: Message;
  isLast: boolean;
}

export const ChatMessage = memo(function ChatMessage({ message, isLast }: ChatMessageProps) {
  const isUser = message.role === "user";
  const waiting = message.state === "streaming" && message.text === "";
  const failedEmpty = message.state === "error" && message.text === "";

  return (
    <div className={cn("flex flex-col gap-1", isUser ? "items-end" : "items-start")}>
      {failedEmpty ? null : (
        <p
          className={cn(
            "max-w-[85%] rounded-lg px-4 py-2.5 break-words whitespace-pre-wrap",
            isUser ? "rounded-ee-sm bg-band text-on-band ring-1 ring-on-band/25" : "rounded-es-sm bg-muted text-fg",
          )}
        >
          {/* Kept outside the dir="auto" span so an English label can't force Urdu text left-to-right. */}
          <span className="sr-only">{isUser ? "You said: " : `${rachnaGpt.name} said: `}</span>
          {waiting ? <TypingIndicator /> : <span dir="auto">{isUser ? message.text : <Linkified text={message.text} />}</span>}
        </p>
      )}
      {message.state === "stopped" ? <p className="px-1 text-xs text-fg-muted">Stopped</p> : null}
      {message.state === "error" ? (
        <div className="flex max-w-[85%] flex-wrap items-center gap-x-2 rounded-md bg-danger-bg px-3 py-1 text-sm text-danger">
          <span>{rachnaGpt.errors[message.errorKind ?? "server"]}</span>
          {isLast ? <RetryButton /> : null}
          <span>
            Or call{" "}
            <a href={`tel:${rachnaGpt.phone}`} className={linkClass}>
              {rachnaGpt.phone}
            </a>
          </span>
        </div>
      ) : null}
    </div>
  );
});
