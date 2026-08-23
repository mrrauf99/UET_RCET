"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { RULER_SWATCHES } from "@/lib/a11y/prefs";
import { useA11yState } from "@/lib/a11y/store";

const KEYBOARD_STEP_EM = 1.5;
const TEXT_BLOCKS = "p, li, h1, h2, h3, h4, a, button, label, td, th, dt, dd, blockquote, figcaption";

/** Tracks the reading line from pointer, keyboard focus (through smooth scrolling) and Alt+Arrow keys. */
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
      if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return;
      // Alt+Arrow opens native selects, so leave it to them.
      if ((event.target as Element).closest?.("select")) return;
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

function ReadingRuler({ color, size }: { color: string; size: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useReadingLine((y) => {
    if (ref.current) ref.current.style.transform = `translateY(${y + 12}px)`;
  });
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ height: `${size * 3}px`, backgroundColor: color }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 opacity-85 shadow-[0_0_0_1px_white] print:hidden"
    />
  );
}

function ScreenMask({ size }: { size: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useReadingLine((y) => {
    if (ref.current) ref.current.style.transform = `translateY(${y - ref.current.offsetHeight / 2}px)`;
  });
  return (
    <div
      ref={ref}
      aria-hidden="true"
      style={{ height: `${size * 2.5}em` }}
      // A huge spread shadow dims everything outside the clear band with a single element.
      className="pointer-events-none fixed inset-x-0 top-0 z-50 shadow-[0_0_0_100vmax_rgb(0_0_0/0.6)] print:hidden"
    />
  );
}

function FocusText({ dark }: { dark: boolean }) {
  const [text, setText] = useState("");
  const barRef = useRef<HTMLDivElement>(null);
  const visible = text !== "";

  // Reserves the bar's height at the bottom so keyboard focus never scrolls under it (WCAG 2.4.11).
  useEffect(() => {
    const bar = barRef.current;
    if (!visible || !bar) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty("scroll-padding-bottom", `${bar.offsetHeight}px`));
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("scroll-padding-bottom");
    };
  }, [visible]);

  useEffect(() => {
    const show = (event: Event) => {
      const target = (event.target as Element).closest?.(TEXT_BLOCKS);
      if (!target || target.closest(".a11y-toolbar")) return;
      const value = (target as HTMLElement).innerText.trim().replace(/\s+/g, " ");
      if (value) setText(value.length > 280 ? `${value.slice(0, 280)}…` : value);
    };
    document.addEventListener("pointerover", show);
    document.addEventListener("focusin", show);
    return () => {
      document.removeEventListener("pointerover", show);
      document.removeEventListener("focusin", show);
    };
  }, []);

  if (!text) return null;
  return (
    <div
      ref={barRef}
      aria-hidden="true"
      data-dark={dark || undefined}
      className="a11y-toolbar pointer-events-none fixed inset-x-0 bottom-0 z-50 border-t-4 border-accent px-6 py-4 font-body text-2xl leading-snug shadow-lg print:hidden"
    >
      {text}
    </div>
  );
}

export function ReadingAids() {
  const { prefs } = useA11yState();
  return (
    <>
      {prefs.readingGuide ? <ReadingRuler color={RULER_SWATCHES[prefs.rulerColor]} size={prefs.rulerSize} /> : null}
      {prefs.readingMask ? <ScreenMask size={prefs.maskSize} /> : null}
      {prefs.focusText ? <FocusText dark={prefs.toolbarDark} /> : null}
    </>
  );
}
