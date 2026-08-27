"use client";

import Image from "next/image";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { rachnaGpt } from "@/content/rachna-gpt";
import { cn } from "@/lib/cn";
import { selectHydrated, selectMessages, selectStatus } from "@/lib/rachna-gpt/store";
import { useChat } from "@/lib/rachna-gpt/use-chat";
import { ChatMessage } from "./ChatMessage";
import { FollowUps } from "./FollowUps";
import { SuggestedPrompts } from "./SuggestedPrompts";

const PIN_THRESHOLD_PX = 48;

function prefersReducedMotion() {
  return (
    document.documentElement.dataset.motion === "reduce" || window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export const GREETING_ID = "rachna-gpt-greeting";

function Welcome({ variant }: { variant: "panel" | "page" }) {
  return (
    <div className={cn("flex flex-col", variant === "page" ? "gap-8 py-4" : "gap-5")}>
      <div className="flex items-start gap-3">
        <Image src="/images/rcet-logo.png" alt="" width={40} height={40} className="size-9 shrink-0" />
        <p id={GREETING_ID} className={cn("rounded-lg rounded-es-sm bg-muted px-4 py-2.5", variant === "page" ? "text-lg" : "text-base")}>
          {rachnaGpt.greeting}
        </p>
      </div>
      <SuggestedPrompts variant={variant === "page" ? "cards" : "chips"} limit={variant === "page" ? 6 : 4} />
    </div>
  );
}

export function ChatThread({ variant }: { variant: "panel" | "page" }) {
  const messages = useChat(selectMessages);
  const hydrated = useChat(selectHydrated);
  const streaming = useChat(selectStatus) === "streaming";
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const pinnedRef = useRef(true);
  const hasMessagesRef = useRef(false);
  const [pinned, setPinned] = useState(true);
  const lastUserId = messages.findLast((message) => message.role === "user")?.id;
  const last = messages.at(-1);
  const showFollowUps = last?.role === "assistant" && last.state === "complete";

  // Layout effect so the flag is current before the ResizeObserver reacts to the same render.
  useLayoutEffect(() => {
    hasMessagesRef.current = messages.length > 0;
  }, [messages.length]);

  // Follow new content only while the reader is at the bottom; growth of the content (streamed text,
  // wrapping after a text-size change) is caught by observing its size rather than each update.
  useEffect(() => {
    const scroller = scrollRef.current;
    const content = contentRef.current;
    if (!scroller || !content) return;
    const observer = new ResizeObserver(() => {
      if (pinnedRef.current && hasMessagesRef.current) scroller.scrollTop = scroller.scrollHeight;
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!lastUserId || !scrollRef.current) return;
    pinnedRef.current = true;
    setPinned(true);
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lastUserId]);

  function onScroll() {
    const el = scrollRef.current!;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < PIN_THRESHOLD_PX;
    pinnedRef.current = atBottom;
    setPinned(atBottom);
  }

  function jumpToLatest() {
    const el = scrollRef.current!;
    pinnedRef.current = true;
    setPinned(true);
    el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }

  return (
    <div className="relative min-h-0 flex-1">
      {/* aria-busy holds announcements until a reply has finished streaming instead of reading every chunk. */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-live="polite"
        aria-busy={streaming}
        aria-label={`Conversation with ${rachnaGpt.name}`}
        // Safari does not make scroll containers keyboard-focusable, so the log needs a tab stop to scroll.
        // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className={cn("h-full overflow-y-auto overscroll-contain", variant === "page" ? "px-4 py-6 sm:px-6" : "px-4 py-5")}
      >
        <div ref={contentRef} className="flex flex-col gap-4">
          {hydrated && messages.length === 0 ? <Welcome variant={variant} /> : null}
          {messages.map((message, index) => (
            <ChatMessage key={message.id} message={message} isLast={index === messages.length - 1} />
          ))}
          {showFollowUps ? (
            <FollowUps asked={new Set(messages.filter((message) => message.role === "user").map((message) => message.text))} />
          ) : null}
        </div>
      </div>
      {!pinned && messages.length > 0 ? (
        <button
          type="button"
          onClick={jumpToLatest}
          className="rise-in absolute bottom-3 left-1/2 inline-flex min-h-11 -translate-x-1/2 items-center gap-1.5 rounded-full border-2 border-border bg-surface px-4 text-sm font-bold text-fg shadow-md hover:bg-muted"
        >
          Jump to latest
        </button>
      ) : null}
    </div>
  );
}
