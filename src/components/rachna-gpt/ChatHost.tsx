"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { closePanel, consumePanelReturnFocus, hydrate, openPanel, selectPanelOpen } from "@/lib/rachna-gpt/store";
import { useChat } from "@/lib/rachna-gpt/use-chat";
import { scheduleIdle } from "@/lib/schedule-idle";
import { ChatLauncher } from "./ChatLauncher";

const loadPanel = () => import("./ChatPanel").then((mod) => mod.ChatPanel);

// The panel (thread, composer, streaming client) stays out of every page's startup JavaScript.
const ChatPanel = dynamic(loadPanel, { ssr: false });

const warmPanel = () => void loadPanel();

export function ChatHost() {
  const onFullPage = usePathname() === "/rachna-gpt";
  const panelOpen = useChat(selectPanelOpen);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    // Restore the conversation and warm the panel chunk once the page is idle.
    return scheduleIdle(() => {
      void hydrate();
      warmPanel();
    });
  }, []);

  useEffect(() => {
    if (onFullPage && panelOpen) closePanel();
  }, [onFullPage, panelOpen]);

  // The launcher is unmounted while the panel is open, so focus returns once it is back.
  useEffect(() => {
    if (panelOpen) wasOpen.current = true;
    else if (wasOpen.current) {
      wasOpen.current = false;
      const trigger = consumePanelReturnFocus();
      (trigger?.isConnected && !trigger.closest("[inert]") ? trigger : launcherRef.current)?.focus();
    }
  }, [panelOpen]);

  if (onFullPage) return null;
  return panelOpen ? <ChatPanel /> : <ChatLauncher ref={launcherRef} onOpen={() => openPanel(launcherRef.current)} onWarm={warmPanel} />;
}
