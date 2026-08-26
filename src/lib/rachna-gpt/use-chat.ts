"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getSnapshot, selectRateLimitedUntil, SERVER_SNAPSHOT, subscribe, type ChatState } from "./store";

/**
 * Subscribes to one slice of the chat store. Selectors must return a primitive or an existing
 * reference: a new object per call makes useSyncExternalStore re-render forever.
 */
export function useChat<T>(selector: (state: ChatState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(SERVER_SNAPSHOT),
  );
}

/** Seconds left on a 429 cooldown, ticking once a second while one is active. */
export function useCooldownSeconds(): number {
  const until = useChat(selectRateLimitedUntil);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (until === null) return;
    const tick = () => {
      const time = Date.now();
      setNow(time);
      if (time >= until) clearInterval(id);
    };
    const id = setInterval(tick, 1000);
    tick();
    return () => clearInterval(id);
  }, [until]);

  return until === null ? 0 : Math.max(0, Math.ceil((until - now) / 1000));
}
