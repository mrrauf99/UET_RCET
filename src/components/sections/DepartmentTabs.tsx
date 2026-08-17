"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent, type ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";

export interface DepartmentTab {
  id: string;
  label: string;
  content: ReactNode;
}

// The URL hash is the single source of truth for the active tab.
const localListeners = new Set<() => void>();

function subscribeToHash(onChange: () => void) {
  // Next's <Link> and history.pushState/replaceState change the hash without hashchange/popstate;
  // the Navigation API reports those too where it exists, and local writes notify directly.
  const navigation = (window as Window & { navigation?: EventTarget }).navigation;
  // Next writes history inside useInsertionEffect, where updates are not allowed; read the hash just after.
  const onEntryChange = () => queueMicrotask(onChange);
  window.addEventListener("hashchange", onChange);
  window.addEventListener("popstate", onChange);
  navigation?.addEventListener("currententrychange", onEntryChange);
  localListeners.add(onChange);
  return () => {
    window.removeEventListener("hashchange", onChange);
    window.removeEventListener("popstate", onChange);
    navigation?.removeEventListener("currententrychange", onEntryChange);
    localListeners.delete(onChange);
  };
}

const readHash = () => decodeURIComponent(location.hash.slice(1));
const serverHash = () => "";

/**
 * WAI-ARIA tabs. Every panel is server-rendered and only toggled with `hidden`, so all content
 * stays in the HTML for search engines and find-in-page; the URL hash makes each tab linkable.
 */
export function DepartmentTabs({ tabs, label }: { tabs: readonly DepartmentTab[]; label: string }) {
  const hash = useSyncExternalStore(subscribeToHash, readHash, serverHash);
  const active = tabs.some((tab) => tab.id === hash) ? hash : (tabs[0]?.id ?? "");
  // Panels only animate on a later change, so the first paint doesn't stack on the page transition.
  const initialActive = useRef<string | null>(null);
  const [switched, setSwitched] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef(new Map<string, HTMLButtonElement>());

  // A hash set outside Next (address bar, plain #links) leaves Next's router holding the old URL,
  // which it would later write back; re-saving the entry through Next's patched replaceState resyncs it.
  useEffect(() => {
    const resync = () => {
      if (history.state === null) history.replaceState(null, "", location.href);
    };
    window.addEventListener("hashchange", resync);
    return () => window.removeEventListener("hashchange", resync);
  }, []);

  useEffect(() => {
    initialActive.current ??= active;
    if (active !== initialActive.current) setSwitched(true);
  }, [active]);

  // Keeps the active tab visible in the sideways-scrolling strip (also after opening a #hash link on mobile).
  useEffect(() => {
    const tab = tabRefs.current.get(active);
    const list = tab?.parentElement;
    if (!tab || !list) return;
    const overflowLeft = tab.offsetLeft - list.scrollLeft;
    const overflowRight = tab.offsetLeft + tab.offsetWidth - (list.scrollLeft + list.clientWidth);
    if (overflowLeft < 0) list.scrollLeft += overflowLeft - 16;
    else if (overflowRight > 0) list.scrollLeft += overflowRight + 16;
  }, [active]);

  const select = (id: string, focus = false) => {
    if (id !== active) {
      history.replaceState(null, "", `#${id}`);
      for (const listener of localListeners) listener();
    }
    const tab = tabRefs.current.get(id);
    if (focus) tab?.focus();
    // Once the bar is stuck, a long panel left the reader mid-page; bring the new panel's start into view.
    const bar = barRef.current;
    if (bar && bar.getBoundingClientRect().top <= parseFloat(getComputedStyle(bar).top) + 1) {
      const panelTop = bar.nextElementSibling?.getBoundingClientRect().top ?? 0;
      window.scrollBy({ top: panelTop - bar.getBoundingClientRect().bottom - 16, behavior: "instant" });
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = tabs.findIndex((tab) => tab.id === active);
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % tabs.length
        : event.key === "ArrowLeft"
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? tabs.length - 1
              : -1;
    const tab = tabs[next];
    if (!tab) return;
    event.preventDefault();
    select(tab.id, true);
  };

  return (
    <>
      <div
        ref={barRef}
        className="band sticky top-[calc(var(--toolbar-offset)+var(--header-height))] z-20 border-t border-on-band/15 shadow-md"
      >
        <Container>
          <div
            role="tablist"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            // Scrolls sideways on narrow screens; snapping keeps a tab from being cut in half.
            className="relative -mx-(--space-gutter) flex snap-x overflow-x-auto px-(--space-gutter) [scrollbar-width:none] lg:justify-center"
          >
            {tabs.map((tab) => {
              const selected = tab.id === active;
              return (
                <button
                  key={tab.id}
                  ref={(element) => {
                    if (element) tabRefs.current.set(tab.id, element);
                  }}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => select(tab.id)}
                  className={cn(
                    "relative min-h-13 shrink-0 snap-start px-4 text-sm font-bold whitespace-nowrap transition-colors duration-(--dur-fast) sm:px-6 sm:text-base",
                    // The bar under the active tab carries state without relying on colour alone.
                    "after:absolute after:inset-x-3 after:bottom-0 after:h-1 after:origin-center after:rounded-t-sm after:bg-accent after:transition-transform after:duration-(--dur-base) after:ease-(--ease-emphasized)",
                    selected
                      ? "text-on-band after:scale-x-100"
                      : "text-on-band-muted after:scale-x-0 hover:text-on-band hover:after:scale-x-50",
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </Container>
      </div>

      <Container className="py-(--space-section)">
        {tabs.map((tab) => (
          <section
            key={tab.id}
            role="tabpanel"
            id={`panel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            hidden={tab.id !== active}
            // Focusable so keyboard users can move from the tab straight into short panels.
            tabIndex={0}
            className={cn("focus-visible:outline-offset-8", switched && "rise-in")}
          >
            {tab.content}
          </section>
        ))}
      </Container>
    </>
  );
}
