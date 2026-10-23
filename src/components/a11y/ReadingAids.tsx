"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { RULER_SWATCHES } from "@/lib/a11y/prefs";
import { observeImageDescriptions, pausePageMedia } from "@/lib/a11y/page-effects";
import { resolvedAttribute, useA11yState } from "@/lib/a11y/store";

const KEYBOARD_STEP_EM = 1.5;
const FOCUS_TEXT_SKIP = "script, style, noscript, template, textarea, input, select, option, [contenteditable='true'], [aria-hidden='true'], .a11y-toolbar, [data-a11y-trigger], [data-screen-mask], [data-reading-ruler]";

function focusTextChunk(text: string) {
  const chunk = document.createElement("span");
  chunk.dataset.a11yFocusTextChunk = "";
  const parts = text.match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*|[^\p{L}\p{N}]+/gu) ?? [text];

  for (const part of parts) {
    if (!/[\p{L}\p{N}]/u.test(part)) {
      chunk.append(document.createTextNode(part));
      continue;
    }

    const word = document.createElement("span");
    word.className = "a11y-focus-text-word";
    word.setAttribute("aria-label", part);
    const characters = Array.from(part);
    const emphasizedLength = /^(?=.*\p{Lu})[\p{Lu}\p{N}]+$/u.test(part) || characters.length <= 3
      ? 1
      : Math.ceil(characters.length / 2);
    const emphasized = document.createElement("span");
    emphasized.className = "a11y-focus-text-bold";
    emphasized.textContent = characters.slice(0, emphasizedLength).join("");
    const remainder = document.createElement("span");
    remainder.className = "a11y-focus-text-normal";
    remainder.textContent = characters.slice(emphasizedLength).join("");
    word.append(emphasized, remainder);
    chunk.append(word);
  }

  return chunk;
}

function applyFocusText(root: Node) {
  if (root instanceof Text) {
    if (root.data.trim() && !root.parentElement?.closest(`${FOCUS_TEXT_SKIP}, [data-a11y-focus-text-chunk]`)) {
      root.replaceWith(focusTextChunk(root.data));
    }
    return;
  }
  if (!(root instanceof Element) || root.closest(FOCUS_TEXT_SKIP)) return;

  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    if (node.textContent?.trim() && !node.parentElement?.closest(`${FOCUS_TEXT_SKIP}, [data-a11y-focus-text-chunk]`)) {
      textNodes.push(node as Text);
    }
  }

  for (const textNode of new Set(textNodes)) textNode.replaceWith(focusTextChunk(textNode.data));
}

function useReadingLine(onMove: (y: number) => void) {
  const move = useEffectEvent(onMove);

  useEffect(() => {
    let y = window.innerHeight / 2;
    let frame = 0;
    let focusTarget: Element | null = null;

    // One write per animation frame keeps pointer tracking off the layout path.
    const render = () => {
      frame = 0;
      if (focusTarget) {
        const rect = focusTarget.getBoundingClientRect();
        y = rect.top + rect.height / 2;
      }
      move(y);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(render);
    };
    const onPointerMove = (event: PointerEvent) => {
      focusTarget = null;
      y = event.clientY;
      schedule();
    };
    const onFocusIn = (event: FocusEvent) => {
      if ((event.target as Element).closest(".a11y-toolbar")) return;
      focusTarget = event.target as Element;
      schedule();
    };
    const onScroll = () => {
      if (focusTarget) schedule();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if ((!event.altKey && !event.shiftKey) || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
      if ((event.target as Element).closest?.("input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable=true]")) return;
      event.preventDefault();
      focusTarget = null;
      const step = parseFloat(getComputedStyle(document.documentElement).fontSize) * KEYBOARD_STEP_EM;
      y = Math.min(Math.max(y + (event.key === "ArrowUp" ? -step : step), 0), window.innerHeight);
      schedule();
    };

    render();
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}

function ReadingRuler({ color, size, markings, opacity }: { color: string; size: number; markings: boolean; opacity: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useReadingLine((y) => {
    if (ref.current) ref.current.style.transform = `translateY(${y + 12}px)`;
  });
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-reading-ruler
      style={{ height: `${size * 40}px`, backgroundColor: color, opacity: opacity / 100 }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 print:hidden"
    >
      {markings ? <div className="a11y-ruler-markings" /> : null}
    </div>
  );
}

function ScreenMask({ horizontal, vertical, size, color, edge, opacity }: { horizontal: boolean; vertical: boolean; size: number; color: string; edge: boolean; opacity: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let frame = 0;
    const render = () => {
      frame = 0;
      if (!ref.current) return;
      const width = vertical ? size * 160 : window.innerWidth;
      const height = horizontal ? size * 160 : window.innerHeight;
      ref.current.style.width = `${width}px`;
      ref.current.style.height = `${height}px`;
      ref.current.style.transform = `translate(${vertical ? x - width / 2 : 0}px, ${horizontal ? y - height / 2 : 0}px)`;
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(render); };
    const pointer = (event: PointerEvent) => {
      if ((event.target as Element).closest?.(".a11y-toolbar")) return;
      x = event.clientX; y = event.clientY; schedule();
    };
    const focus = (event: FocusEvent) => {
      const target = event.target as Element;
      if (target.closest(".a11y-toolbar")) return;
      const rect = target.getBoundingClientRect();
      x = rect.left + rect.width / 2; y = rect.top + rect.height / 2; schedule();
    };
    const keyboard = (event: KeyboardEvent) => {
      if (!event.shiftKey || (event.target as Element).closest?.("input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable=true]")) return;
      if (horizontal && ["ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault(); y = Math.max(0, Math.min(innerHeight, y + (event.key === "ArrowUp" ? -24 : 24))); schedule();
      }
      if (vertical && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault(); x = Math.max(0, Math.min(innerWidth, x + (event.key === "ArrowLeft" ? -24 : 24))); schedule();
      }
    };
    render();
    window.addEventListener("pointermove", pointer, { passive: true });
    window.addEventListener("resize", schedule);
    document.addEventListener("focusin", focus);
    document.addEventListener("keydown", keyboard);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", pointer);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("focusin", focus);
      document.removeEventListener("keydown", keyboard);
    };
  }, [horizontal, vertical, size]);
  return <div ref={ref} data-screen-mask aria-hidden="true" style={{
    boxShadow: `0 0 0 100vmax ${color}`,
    opacity: opacity / 100,
    borderTop: edge && horizontal ? "8px solid #F4B739" : undefined,
    borderBottom: edge && horizontal ? "8px solid #9C47E6" : undefined,
    borderLeft: edge && vertical ? "8px solid #9C47E6" : undefined,
    borderRight: edge && vertical ? "8px solid #F4B739" : undefined,
  }} className="pointer-events-none fixed left-0 top-0 z-50 print:hidden" />;
}

function FocusText() {
  useEffect(() => {
    applyFocusText(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) for (const node of record.addedNodes) applyFocusText(node);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.querySelectorAll<HTMLElement>("[data-a11y-focus-text-chunk]").forEach((chunk) => {
        chunk.replaceWith(document.createTextNode(chunk.textContent ?? ""));
      });
    };
  }, []);
  return null;
}

function PageFeatures({ descriptions, paused }: { descriptions: boolean; paused: boolean }) {
  useEffect(() => {
    if (!descriptions) return;
    return observeImageDescriptions();
  }, [descriptions]);

  useEffect(() => {
    if (!paused) return;
    return pausePageMedia();
  }, [paused]);
  return null;
}

export function ReadingAids() {
  const { prefs } = useA11yState();
  return (
    <>
      <PageFeatures descriptions={prefs.imageDescriptions && !prefs.plainText} paused={resolvedAttribute("data-motion") === "reduce"} />
      {prefs.readingGuide ? <ReadingRuler color={RULER_SWATCHES[prefs.rulerColor]} size={prefs.rulerSize} markings={prefs.rulerMarkings} opacity={prefs.rulerOpacity} /> : null}
      {prefs.readingMask || prefs.maskVertical ? <ScreenMask horizontal={prefs.readingMask} vertical={prefs.maskVertical} size={prefs.maskSize} color={RULER_SWATCHES[prefs.maskColor]} edge={prefs.maskEdge} opacity={prefs.maskOpacity} /> : null}
      {prefs.focusText ? <FocusText /> : null}
    </>
  );
}
