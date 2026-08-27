"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { Icon } from "@/components/ui/Icon";
import { rachnaGpt } from "@/content/rachna-gpt";
import { closePanel, hydrate, reset, selectHasMessages } from "@/lib/rachna-gpt/store";
import { useChat } from "@/lib/rachna-gpt/use-chat";
import { ChatThread, GREETING_ID } from "./ChatThread";
import { ChatDisclaimer, Composer } from "./Composer";

const PANEL_ID = "rachna-gpt-panel";
const TITLE_ID = "rachna-gpt-panel-title";
const FULL_SCREEN_QUERY = "(max-width: 39.999rem)";
const SKIP_INERT = new Set(["SCRIPT", "NEXT-ROUTE-ANNOUNCER"]);

const headerButton =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-md text-sm font-bold whitespace-nowrap text-on-band transition-colors duration-(--dur-fast) hover:bg-on-band/10";

/**
 * Full screen on phones hides the page, so Tab must not reach it: the page is made inert there.
 * On larger screens the panel is non-modal and the page stays usable.
 */
function useInertPageWhenFullScreen(panelRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const query = window.matchMedia(FULL_SCREEN_QUERY);
    let inerted: Element[] = [];

    const release = () => {
      for (const element of inerted) element.removeAttribute("inert");
      inerted = [];
    };
    const apply = () => {
      release();
      if (!query.matches) return;
      for (const element of document.body.children) {
        // The route announcer stays live so navigation is still announced.
        if (element.contains(panel) || element.hasAttribute("inert") || SKIP_INERT.has(element.tagName)) continue;
        element.setAttribute("inert", "");
        inerted.push(element);
      }
    };

    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
      release();
    };
  }, [panelRef]);
}

export function ChatPanel() {
  const panelRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = useChat(selectHasMessages);

  useInertPageWhenFullScreen(panelRef);

  useEffect(() => {
    void hydrate();
    inputRef.current?.focus();
    // A non-modal <dialog> has no built-in Escape handling.
    const panel = panelRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.isComposing) return;
      event.stopPropagation();
      closePanel();
    };
    panel?.addEventListener("keydown", onKeyDown);
    return () => panel?.removeEventListener("keydown", onKeyDown);
  }, []);

  function startNewChat() {
    reset();
    inputRef.current?.focus();
  }

  return (
    <dialog
      ref={panelRef}
      id={PANEL_ID}
      open
      aria-labelledby={TITLE_ID}
      // Initial focus lands in the composer, so the greeting is exposed as the dialog description.
      aria-describedby={hasMessages ? undefined : GREETING_ID}
      className="surface rise-in fixed inset-0 z-50 m-0 flex size-full max-h-none max-w-none flex-col overflow-hidden border-0 p-0 sm:inset-auto sm:right-4 sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:h-[min(42rem,calc(100dvh-2rem))] sm:w-[min(27rem,calc(100vw-2rem))] sm:rounded-lg sm:border sm:border-border sm:shadow-lg"
    >
      <div className="band flex items-center gap-2 py-2 ps-4 pe-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <Image src="/images/rcet-logo.png" alt="" width={36} height={36} className="size-9 shrink-0 max-[24rem]:hidden" />
        <h2 id={TITLE_ID} className="flex-1 text-lg">
          {rachnaGpt.name}
        </h2>
        {hasMessages ? (
          <button type="button" onClick={startNewChat} className={`${headerButton} px-3`}>
            New chat
          </button>
        ) : null}
        <Link href="/rachna-gpt" onClick={closePanel} title="Open full page" className={headerButton}>
          <Icon name="expand" />
          <span className="sr-only">Open full page</span>
        </Link>
        <button type="button" onClick={closePanel} className={headerButton}>
          <Icon name="close" />
          <span className="sr-only">Close {rachnaGpt.name}</span>
        </button>
      </div>
      <ChatThread variant="panel" />
      <div className="flex flex-col gap-2 border-t border-border px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Composer ref={inputRef} />
        <ChatDisclaimer />
      </div>
    </dialog>
  );
}
