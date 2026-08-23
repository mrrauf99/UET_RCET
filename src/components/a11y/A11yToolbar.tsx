"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FocusSound, type FocusSoundMode } from "@/lib/a11y/focus-sound";
import { TEXT_SCALES } from "@/lib/a11y/prefs";
import { isSpeechSupported, useTextToSpeech } from "@/lib/a11y/speech";
import { closeToolbar, resetPrefs, updatePrefs, useA11yState } from "@/lib/a11y/store";
import { isVoiceControlSupported, startVoiceControl } from "@/lib/a11y/voice-control";
import { ToolbarIcon, type ToolbarIconName } from "./ToolbarIcon";
import {
  ColourPanel,
  CursorPanel,
  FocusAudioPanel,
  FontPanel,
  HelpPanel,
  MaskPanel,
  PageOptionsPanel,
  PageStructurePanel,
  RulerPanel,
  TranslationPanel,
  VoiceControlPanel,
} from "./toolbar-panels";

type PanelId =
  | "audio"
  | "voice"
  | "font"
  | "translate"
  | "colour"
  | "ruler"
  | "cursor"
  | "mask"
  | "page"
  | "structure"
  | "help";

const PANEL_TITLES: Record<PanelId, string> = {
  audio: "Focus audio",
  voice: "Voice control",
  font: "Font options",
  translate: "Translation",
  colour: "Colour theme",
  ruler: "Ruler options",
  cursor: "Cursor options",
  mask: "Screen mask",
  page: "Page options",
  structure: "Page structure",
  help: "Help",
};

interface ToolButtonProps {
  label: string;
  color: string;
  icon?: ToolbarIconName;
  text?: string;
  pressed?: boolean;
  /** Visual on-state for panel tools, which are disclosures and so cannot also be toggle buttons. */
  active?: boolean;
  expanded?: boolean;
  controls?: string;
  disabled?: boolean;
  onClick: () => void;
  onFocus: () => void;
  tabIndex: number;
  buttonRef?: (element: HTMLButtonElement | null) => void;
}

function ToolButton({ label, color, icon, text, pressed, active, expanded, controls, disabled, onClick, onFocus, tabIndex, buttonRef }: ToolButtonProps) {
  const highlighted = pressed || active || expanded;
  return (
    <button
      ref={buttonRef}
      type="button"
      data-tool
      data-label={label}
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
      onClick={onClick}
      onFocus={onFocus}
      style={{ backgroundColor: `var(${color})` }}
      className={cn(
        "relative grid size-11 shrink-0 place-items-center rounded-md text-(--tool-icon) transition-transform duration-(--dur-fast) hover:-translate-y-0.5 aria-disabled:opacity-55 lg:size-14",
        // Active tools carry an underline bar, so state is visible without relying on colour alone.
        highlighted && "after:absolute after:inset-x-1 after:-bottom-1.5 after:h-1 lg:after:-bottom-2 after:rounded-full after:bg-(--tb-accent)",
      )}
    >
      {icon ? <ToolbarIcon name={icon} className="size-6 lg:size-8" /> : null}
      {text ? <span className="font-display text-lg leading-none font-semibold lg:text-2xl">{text}</span> : null}
    </button>
  );
}

function PlayerButton({ label, icon, onClick }: { label: string; icon: ToolbarIconName; onClick: () => void }) {
  return (
    <button
      type="button"
      data-label={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-11 place-items-center rounded-full hover:bg-(--tb-hover)"
    >
      <ToolbarIcon name={icon} />
    </button>
  );
}

export function A11yToolbar() {
  const { prefs } = useA11yState();
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const [focusIndex, setFocusIndex] = useState(0);
  const [message, setMessage] = useState("");
  const [ttsOn, setTtsOn] = useState(false);
  const [focusSound, setFocusSound] = useState<{ playing: boolean; mode: FocusSoundMode; volume: number }>({
    playing: false,
    mode: "focus",
    volume: 0.4,
  });
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [tip, setTip] = useState<{ label: string; x: number; y: number; above: boolean } | null>(null);
  const [playerOffset, setPlayerOffset] = useState({ x: 0, y: 0 });
  const playerRef = useRef<HTMLFieldSetElement>(null);
  const playerDrag = useRef<{ pointerX: number; pointerY: number; offset: { x: number; y: number }; rect: DOMRect } | null>(null);
  const playerDragged = useRef(false);

  const barRef = useRef<HTMLElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const panelButtons = useRef(new Map<PanelId, HTMLButtonElement>());
  const sound = useRef<FocusSound | null>(null);
  const stopVoice = useRef<(() => void) | null>(null);
  const pointerInput = useRef(false);
  const panelId = useId();
  const tts = useTextToSpeech();

  // The toolbar only renders in the browser (it is closed during server rendering), so capabilities can be read directly.
  const support = { speech: isSpeechSupported(), voice: isVoiceControlSupported() };

  // Opening the toolbar moves focus to the first tool; browsers may still flag that as :focus-visible
  // after a mouse or touch open, so focus labels follow the last real input instead.
  useEffect(() => {
    const onPointer = () => (pointerInput.current = true);
    const onKey = () => (pointerInput.current = false);
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, []);

  useEffect(() => {
    toolbarRef.current?.querySelector<HTMLButtonElement>("[data-tool]")?.focus();
  }, []);

  // Tools wrap onto more rows on narrow screens, so the page offset follows the bar's real height.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => root.style.setProperty("--toolbar-offset", `${bar.offsetHeight}px`));
    observer.observe(bar);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--toolbar-offset");
    };
  }, []);

  const closePanel = () => {
    const id = panel;
    setPanel(null);
    if (id) panelButtons.current.get(id)?.focus();
  };
  const onPanelEscape = useEffectEvent(() => closePanel());

  useEffect(() => {
    if (!panel) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!barRef.current?.contains(event.target as Node)) setPanel(null);
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape" && barRef.current?.contains(document.activeElement)) onPanelEscape();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [panel]);

  const tipShown = tip !== null;
  useEffect(() => {
    if (!tipShown) return;
    // Captured first so Escape only hides the label, without also closing a panel (WCAG 1.4.13).
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setTip(null);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [tipShown]);

  const readFrom = useEffectEvent((target: Element) => tts.readFrom(target));

  useEffect(() => {
    if (!ttsOn) return;
    const main = document.getElementById("main");
    const onClick = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest("a, button, input, select, textarea, label")) return;
      readFrom(target);
    };
    main?.addEventListener("click", onClick);
    return () => main?.removeEventListener("click", onClick);
  }, [ttsOn]);

  // One tooltip rendered outside the scrolling row, which would otherwise clip it.
  const showTip = (target: EventTarget, keyboard = false) => {
    const button = (target as Element).closest<HTMLElement>("[data-label]");
    if (!button || (keyboard && (pointerInput.current || !button.matches(":focus-visible")))) return;
    const rect = button.getBoundingClientRect();
    // Controls in the lower half (the floating player) label upwards so the tip stays on screen.
    const above = rect.top > innerHeight / 2;
    const x = Math.min(Math.max(rect.left + rect.width / 2, 72), innerWidth - 72);
    setTip({ label: button.dataset.label ?? "", x, y: above ? rect.top - 8 : rect.bottom + 8, above });
  };
  const tipHandlers = {
    onPointerOver: (event: { target: EventTarget }) => showTip(event.target),
    onPointerLeave: (event: { relatedTarget: EventTarget | null }) => {
      if (!tipRef.current?.contains(event.relatedTarget as Node | null)) setTip(null);
    },
    onFocus: (event: { target: EventTarget }) => showTip(event.target, true),
    onBlur: () => setTip(null),
    onClick: () => setTip(null),
  };

  // Clearing first makes a repeated message ("Line spacing increased" twice) a real DOM change, so it is spoken again.
  const announce = (text: string) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(text));
  };

  const togglePanel = (id: PanelId) => {
    const button = panelButtons.current.get(id);
    const bar = barRef.current?.getBoundingClientRect();
    if (button && bar) {
      const left = button.getBoundingClientRect().left - bar.left;
      // The panel is min(20rem, 100vw - 1rem) wide and rem grows with the text-size setting.
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const width = Math.min(20 * rem, innerWidth - rem);
      setPanelLeft(Math.max(8, Math.min(left, bar.width - width - 8)));
    }
    setPanel((current) => (current === id ? null : id));
  };

  const textIndex = TEXT_SCALES.indexOf(prefs.textScale);
  const setTextScale = (index: number) => {
    const next = TEXT_SCALES[index];
    if (next === undefined) return;
    updatePrefs({ textScale: next });
    announce(`Text size ${next}%`);
  };

  const toggleTts = () => {
    if (ttsOn) tts.reset();
    setTtsOn(!ttsOn);
    announce(ttsOn ? "Read aloud off" : "Read aloud on. Select any paragraph or press play.");
  };

  const toggleSound = (on: boolean) => {
    sound.current ??= new FocusSound();
    if (on) sound.current.start(focusSound.mode, focusSound.volume);
    else sound.current.stop();
    setFocusSound({ ...focusSound, playing: on });
    announce(`Focus sound ${on ? "on" : "off"}`);
  };

  const toggleVoice = (on: boolean) => {
    if (on) {
      const update = (status: string) => {
        setVoiceStatus(status);
        announce(status);
      };
      stopVoice.current = startVoiceControl(update, () => setListening(false));
      setListening(stopVoice.current !== null);
    } else {
      stopVoice.current?.();
      stopVoice.current = null;
      setListening(false);
      setVoiceStatus("");
    }
  };

  const close = () => {
    tts.reset();
    sound.current?.stop();
    stopVoice.current?.();
    setTtsOn(false);
    setFocusSound((current) => ({ ...current, playing: false }));
    setListening(false);
    setPanel(null);
    closeToolbar();
  };

  const movePlayer = (from: { x: number; y: number }, rect: DOMRect, dx: number, dy: number) => {
    const margin = 8;
    const x = Math.min(Math.max(dx, margin - rect.left), innerWidth - margin - rect.right);
    const y = Math.min(Math.max(dy, margin - rect.top), innerHeight - margin - rect.bottom);
    setPlayerOffset({ x: from.x + x, y: from.y + y });
  };

  const gripHandlers = {
    onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const rect = playerRef.current?.getBoundingClientRect();
      if (!rect) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      playerDrag.current = { pointerX: event.clientX, pointerY: event.clientY, offset: playerOffset, rect };
      playerDragged.current = false;
      setTip(null);
    },
    onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => {
      const drag = playerDrag.current;
      if (!drag) return;
      const dx = event.clientX - drag.pointerX;
      const dy = event.clientY - drag.pointerY;
      if (Math.hypot(dx, dy) > 4) playerDragged.current = true;
      movePlayer(drag.offset, drag.rect, dx, dy);
    },
    onPointerUp: () => (playerDrag.current = null),
    onPointerCancel: () => (playerDrag.current = null),
    onLostPointerCapture: () => (playerDrag.current = null),
    // A tap (or Enter/Space) is the single-pointer alternative to dragging (WCAG 2.5.7): it swaps top and bottom.
    onClick: () => {
      if (playerDragged.current) {
        playerDragged.current = false;
        return;
      }
      const rect = playerRef.current?.getBoundingClientRect();
      const bar = barRef.current?.getBoundingClientRect();
      if (!rect || !bar) return;
      if (playerOffset.y < 0) setPlayerOffset({ x: 0, y: 0 });
      else movePlayer(playerOffset, rect, 0, bar.bottom + 8 - rect.top);
    },
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? 80 : 24;
      const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
      const rect = playerRef.current?.getBoundingClientRect();
      if (!delta || !rect) return;
      event.preventDefault();
      movePlayer(playerOffset, rect, delta[0] ?? 0, delta[1] ?? 0);
    },
  };

  const onToolbarKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    const tools = [...(toolbarRef.current?.querySelectorAll<HTMLButtonElement>("[data-tool]") ?? [])];
    const current = tools.indexOf(document.activeElement as HTMLButtonElement);
    const next =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? tools.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + tools.length) % tools.length;
    event.preventDefault();
    tools[next]?.focus();
    tools[next]?.scrollIntoView({ inline: "nearest", block: "nearest" });
  };

  let order = 0;
  const rove = () => {
    const index = order++;
    return { tabIndex: index === focusIndex ? 0 : -1, onFocus: () => setFocusIndex(index) };
  };
  const panelTool = (id: PanelId) => ({
    expanded: panel === id,
    controls: panelId,
    onClick: () => togglePanel(id),
    buttonRef: (element: HTMLButtonElement | null) => {
      if (element) panelButtons.current.set(id, element);
    },
  });

  const panels: Record<PanelId, ReactNode> = {
    audio: (
      <FocusAudioPanel
        playing={focusSound.playing}
        mode={focusSound.mode}
        volume={focusSound.volume}
        onToggle={toggleSound}
        onMode={(mode) => {
          setFocusSound({ ...focusSound, mode });
          if (focusSound.playing) sound.current?.start(mode, focusSound.volume);
        }}
        onVolume={(volume) => {
          setFocusSound({ ...focusSound, volume });
          sound.current?.setVolume(volume);
        }}
      />
    ),
    voice: <VoiceControlPanel supported={support.voice} listening={listening} status={voiceStatus} onToggle={toggleVoice} />,
    font: <FontPanel prefs={prefs} announce={announce} />,
    translate: <TranslationPanel announce={announce} />,
    colour: <ColourPanel prefs={prefs} announce={announce} />,
    ruler: <RulerPanel prefs={prefs} announce={announce} />,
    cursor: <CursorPanel prefs={prefs} announce={announce} />,
    mask: <MaskPanel prefs={prefs} announce={announce} />,
    page: <PageOptionsPanel prefs={prefs} announce={announce} />,
    structure: <PageStructurePanel onNavigate={() => setPanel(null)} />,
    help: <HelpPanel />,
  };

  return (
    <section
      ref={barRef}
      aria-label="Accessibility toolbar"
      data-dark={prefs.toolbarDark || undefined}
      // Kept out of Google Translate: it rewrites text nodes, which would break React updates here.
      translate="no"
      className="a11y-toolbar notranslate fixed inset-x-0 top-0 z-[60] border-b-4 border-accent shadow-md"
    >
      <a
        href="#main"
        className="sr-only z-10 rounded-md bg-(--tb-accent) px-4 py-3 font-bold text-(--tb-on-accent) focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        onClick={() => setPanel(null)}
      >
        Skip toolbar to main content
      </a>

      <div className="flex items-center gap-2 px-3 lg:gap-3" {...tipHandlers}>
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Accessibility tools"
          tabIndex={-1}
          onKeyDown={onToolbarKeyDown}
          onScroll={() => setTip(null)}
          // One row that scrolls sideways; the thin visible scrollbar shows more tools exist.
          className="a11y-tools flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pt-2 pb-3 lg:gap-3"
        >
          <ToolButton
            label={support.speech ? "Read aloud" : "Read aloud (not supported in this browser)"}
            icon="speak"
            color="--tool-listen"
            pressed={ttsOn}
            disabled={!support.speech}
            onClick={() => support.speech && toggleTts()}
            {...rove()}
          />
          <ToolButton label={focusSound.playing ? "Focus audio (on)" : "Focus audio"} icon="music" color="--tool-listen" active={focusSound.playing} {...panelTool("audio")} {...rove()} />
          <ToolButton label={listening ? "Voice control (on)" : "Voice control"} icon="mic" color="--tool-listen" active={listening} {...panelTool("voice")} {...rove()} />

          <ToolButton
            label="Decrease text size"
            icon="minus"
            color="--tool-text"
            disabled={textIndex <= 0}
            onClick={() => setTextScale(textIndex - 1)}
            {...rove()}
          />
          <ToolButton label="Font options" text="Aa" color="--tool-text" {...panelTool("font")} {...rove()} />
          <ToolButton
            label="Focus text (FT)"
            text="FT"
            color="--tool-text"
            pressed={prefs.focusText}
            onClick={() => {
              updatePrefs({ focusText: !prefs.focusText });
              announce(`Focus text ${prefs.focusText ? "off" : "on"}`);
            }}
            {...rove()}
          />
          <ToolButton
            label="Increase text size"
            icon="plus"
            color="--tool-text"
            disabled={textIndex >= TEXT_SCALES.length - 1}
            onClick={() => setTextScale(textIndex + 1)}
            {...rove()}
          />

          <ToolButton label="Translation" icon="translate" color="--tool-language" {...panelTool("translate")} {...rove()} />
          <ToolButton label="Colour theme" icon="palette" color="--tool-colour" {...panelTool("colour")} {...rove()} />
          <ToolButton label={prefs.readingGuide ? "Ruler options (on)" : "Ruler options"} icon="ruler" color="--tool-ruler" active={prefs.readingGuide} {...panelTool("ruler")} {...rove()} />
          <ToolButton label="Cursor options" icon="cursor" color="--tool-cursor" {...panelTool("cursor")} {...rove()} />
          <ToolButton label={prefs.readingMask ? "Screen mask (on)" : "Screen mask"} icon="mask" color="--tool-mask" active={prefs.readingMask} {...panelTool("mask")} {...rove()} />
          <ToolButton label="Page options" icon="options" color="--tool-page" {...panelTool("page")} {...rove()} />
          <ToolButton label="Page structure" icon="structure" color="--tool-page" {...panelTool("structure")} {...rove()} />

          <ToolButton label="Help" text="?" color="--tool-colour" {...panelTool("help")} {...rove()} />
          <ToolButton
            label="Reset all settings"
            icon="reset"
            color="--tool-colour"
            onClick={() => {
              resetPrefs();
              announce("All settings reset");
            }}
            {...rove()}
          />
        </div>

        {/* Rendered straight after the tools so Tab moves from the open tool into its panel. */}
        {panel ? (
          <section
            id={panelId}
            aria-labelledby={`${panelId}-title`}
            style={{ left: panelLeft }}
            className="pop-in absolute top-full mt-1 flex max-h-[calc(100dvh-var(--toolbar-offset)-1rem)] w-[min(20rem,calc(100vw-1rem))] flex-col gap-5 overflow-y-auto rounded-lg border-2 border-(--tb-border) bg-(--tb-bg) p-5 shadow-lg max-sm:!left-2"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={`${panelId}-title`} className="text-xl">
                {PANEL_TITLES[panel]}
              </h2>
              <button
                type="button"
                aria-label={`Close ${PANEL_TITLES[panel]}`}
                onClick={closePanel}
                className="grid size-11 place-items-center rounded-sm hover:bg-(--tb-hover)"
              >
                <ToolbarIcon name="close" className="size-5" />
              </button>
            </div>
            {panels[panel]}
          </section>
        ) : null}

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            aria-pressed={prefs.toolbarDark}
            aria-label="Dark toolbar"
            data-label={prefs.toolbarDark ? "Light toolbar" : "Dark toolbar"}
            onClick={() => updatePrefs({ toolbarDark: !prefs.toolbarDark })}
            className="grid size-11 place-items-center rounded-full border-2 border-(--tb-border) hover:bg-(--tb-hover)"
          >
            <ToolbarIcon name={prefs.toolbarDark ? "sun" : "moon"} className="size-5" />
          </button>
          <p className="hidden items-baseline gap-1 font-display leading-none select-none lg:flex" aria-hidden="true">
            <span className="text-2xl font-bold text-(--tb-accent)">RCET</span>
            <span className="text-sm font-semibold">Accessibility</span>
          </p>
          <button
            type="button"
            aria-label="Close accessibility toolbar"
            data-label="Close toolbar"
            onClick={close}
            className="grid size-11 place-items-center rounded-sm hover:bg-(--tb-hover)"
          >
            <ToolbarIcon name="close" className="size-7" />
          </button>
        </div>
      </div>

      {ttsOn ? (
        // Floats over the page so the toolbar layout never shifts when reading starts.
        <fieldset
          ref={playerRef}
          {...tipHandlers}
          // transform (not translate) so it composes with the centring translate utility.
          style={{ transform: `translate(${playerOffset.x}px, ${playerOffset.y}px)` }}
          // Wraps to two rows on the narrowest phones (and at large text) rather than running off screen.
          className="rise-in fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-3 flex max-w-[calc(100vw-1.5rem)] flex-wrap items-center justify-center gap-0.5 rounded-[1.75rem] border-2 border-(--tb-border) bg-(--tb-bg) p-1 shadow-lg sm:bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:left-1/2 sm:-translate-x-1/2"
        >
          <legend className="sr-only">Read aloud controls</legend>
          <button
            type="button"
            aria-label="Move reading controls to the top or bottom (arrow keys also move them)"
            data-label="Drag or tap to move"
            {...gripHandlers}
            className="grid size-11 cursor-grab touch-none place-items-center rounded-full text-(--tb-muted) hover:bg-(--tb-hover) active:cursor-grabbing"
          >
            <ToolbarIcon name="grip" className="size-5" />
          </button>
          <PlayerButton label="Previous paragraph" icon="skip-back" onClick={tts.previousBlock} />
          <PlayerButton label="Previous sentence" icon="rewind" onClick={tts.previousSentence} />
          <button
            type="button"
            data-label={tts.playing ? "Pause reading" : "Play reading"}
            aria-label={tts.playing ? "Pause reading" : "Play reading"}
            onClick={tts.togglePlay}
            className="grid size-12 place-items-center rounded-full bg-(--tb-accent) text-(--tb-on-accent)"
          >
            <ToolbarIcon name={tts.playing ? "pause" : "play"} />
          </button>
          <PlayerButton label="Next sentence" icon="forward" onClick={tts.nextSentence} />
          <PlayerButton label="Next paragraph" icon="skip-forward" onClick={tts.nextBlock} />
          <span aria-hidden="true" className="mx-0.5 h-6 w-px bg-(--tb-border) max-sm:hidden" />
          <PlayerButton label="Turn off read aloud" icon="close" onClick={toggleTts} />
        </fieldset>
      ) : null}

      {tip ? (
        // Visual only: every control already has the same text as its accessible name.
        <div
          ref={tipRef}
          aria-hidden="true"
          style={{ left: tip.x, top: tip.y }}
          onPointerLeave={() => setTip(null)}
          className={cn(
            // The ::before strip bridges the gap to the control so the pointer can move onto the label.
            "a11y-tip fixed z-10 -translate-x-1/2 rounded-md bg-(--tb-fg) px-2.5 py-1.5 text-sm font-bold whitespace-nowrap text-(--tb-bg) shadow-md before:absolute before:inset-x-0 before:h-2",
            tip.above ? "-translate-y-full before:-bottom-2" : "before:-top-2",
          )}
        >
          {tip.label}
        </div>
      ) : null}

      <output aria-live="polite" className="sr-only">
        {message}
      </output>
    </section>
  );
}
