"use client";

import { useEffect, useRef } from "react";
import { hydrate, reset, selectHasMessages } from "@/lib/rachna-gpt/store";
import { useChat } from "@/lib/rachna-gpt/use-chat";
import { ChatThread } from "./ChatThread";
import { ChatDisclaimer, Composer } from "./Composer";

export function ChatPage() {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = useChat(selectHasMessages);

  useEffect(() => {
    void hydrate();
  }, []);

  function startNewChat() {
    reset();
    inputRef.current?.focus();
  }

  return (
    <div className="mx-auto flex h-[clamp(28rem,calc(100dvh-18.5rem),48rem)] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm">
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-border py-1.5 ps-4 pe-2 sm:ps-6">
        <h2 className="text-base">Conversation</h2>
        {hasMessages ? (
          <button
            type="button"
            onClick={startNewChat}
            className="inline-flex min-h-11 items-center rounded-md px-3 text-sm font-bold text-fg transition-colors duration-(--dur-fast) hover:bg-muted"
          >
            New chat
          </button>
        ) : null}
      </div>
      <ChatThread variant="page" />
      <div className="flex flex-col gap-2 border-t border-border p-3 sm:p-4">
        <Composer ref={inputRef} />
        <ChatDisclaimer />
      </div>
    </div>
  );
}
