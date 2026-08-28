"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { getSnapshot, selectRateLimitedUntil, SERVER_SNAPSHOT, subscribe, type ChatState } from "./store";

/**
 * Selectors must return primitives or stable references to avoid an infinite render loop.
 */
export function useChat<T>(selector: (state: ChatState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(getSnapshot()),
    () => selector(SERVER_SNAPSHOT),
  );
}

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
