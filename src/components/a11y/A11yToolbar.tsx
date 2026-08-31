"use client";

import { useEffect, useEffectEvent, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FocusSound, type FocusSoundMode } from "@/lib/a11y/focus-sound";
import { TEXT_SCALES } from "@/lib/a11y/prefs";
import { DEFAULT_SPEECH_OPTIONS, isSpeechSupported, useTextToSpeech } from "@/lib/a11y/speech";
import { closeToolbar, resetPrefs, updatePrefs, useA11yState } from "@/lib/a11y/store";
import { isVoiceControlSupported, startVoiceControl } from "@/lib/a11y/voice-control";
import { ToolbarIcon, type ToolbarIconName } from "./ToolbarIcon";
import {
  ColourPanel,
  CursorPanel,
  FocusAudioPanel,
  FontPanel,
  MaskPanel,
  PageOptionsPanel,
  PageStructurePanel,
  RulerPanel,
  SpeechPanel,
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
  | "speech";

const PANEL_TITLES: Record<PanelId, string> = {
  audio: "Focus Audio",
  voice: "Voice Control",
  font: "Font Options",
  translate: "Translation",
  colour: "Colour Theme",
  ruler: "Ruler Options",
  cursor: "Cursor Options",
  mask: "Screen Mask",
  page: "Page Options",
  structure: "Page Structure",
  speech: "Text to Speech",
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
      data-active={pressed || active || undefined}
      data-expanded={expanded || undefined}
      aria-label={label}
      aria-pressed={pressed}
      aria-expanded={expanded}
      aria-controls={controls}
      aria-disabled={disabled || undefined}
      tabIndex={tabIndex}
      onClick={onClick}
      onFocus={onFocus}
      style={{ backgroundColor: `var(${color})`, "--tool-c": `var(${color})` } as CSSProperties}
      className={cn(
        "relative grid size-11 shrink-0 cursor-pointer place-items-center rounded-md text-(--tool-icon) aria-disabled:opacity-55 lg:size-14",
        // Keep the underline mounted for animation and to indicate state without colour alone.
        "after:absolute after:inset-x-3 after:-bottom-2 after:h-1 after:scale-x-0 after:rounded-full after:bg-(--tb-fg) after:transition-[scale] after:duration-(--dur-base) after:ease-(--ease-out) hover:after:scale-x-100 focus-visible:after:scale-x-100 lg:after:inset-x-4",
        highlighted && "after:scale-x-100",
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

function PageButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const label = direction === "prev" ? "Show previous tools" : "Show more tools";
  return (
    <button
      type="button"
      data-label={label}
      aria-label={label}
      onClick={onClick}
      className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-(--tb-hover)"
    >
      <ToolbarIcon name={direction === "prev" ? "chevron-left" : "chevron-right"} className="size-7" />
    </button>
  );
}

export function A11yToolbar() {
  const { prefs } = useA11yState();
  const [panel, setPanel] = useState<PanelId | null>(null);
  const [panelLeft, setPanelLeft] = useState(0);
  const [focusIndex, setFocusIndex] = useState(0);
  const [edges, setEdges] = useState({ prev: false, next: false });
  const [message, setMessage] = useState("");
  const [ttsOn, setTtsOn] = useState(false);
  const [speechOptions, setSpeechOptions] = useState(DEFAULT_SPEECH_OPTIONS);
  const [movablePlayer, setMovablePlayer] = useState(false);
  const [focusSound, setFocusSound] = useState<{ playing: boolean; mode: FocusSoundMode; volume: number }>({
    playing: false,
    mode: "focus",
    volume: 1,
  });
  const [soundError, setSoundError] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [tip, setTip] = useState<{ label: string; x: number; y: number; above: boolean; shown: boolean; glide: boolean } | null>(null);
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
  const spokenFor = useRef<HTMLElement | null>(null);
  // Stays mounted so the label can fade out and glide between neighbouring controls.
  const hideTip = () => {
    spokenFor.current = null;
    setTip((current) => (current?.shown ? { ...current, shown: false } : current));
  };
  const panelId = useId();
  const tts = useTextToSpeech(speechOptions);

  // The toolbar only renders in the browser (it is closed during server rendering), so capabilities can be read directly.
  const support = { speech: isSpeechSupported(), voice: isVoiceControlSupported() };

  // Programmatic focus can appear keyboard-driven after a pointer open; use the last real input for labels.
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

  const updateEdges = () => {
    const row = toolbarRef.current;
    if (!row) return;
    const more = { prev: row.scrollLeft > 1, next: row.scrollLeft + row.clientWidth < row.scrollWidth - 1 };
    setEdges((current) => (current.prev === more.prev && current.next === more.next ? current : more));
  };
  const syncEdges = useEffectEvent(updateEdges);
  useEffect(() => {
    const row = toolbarRef.current;
    if (!row) return;
    const observer = new ResizeObserver(() => syncEdges());
    observer.observe(row);
    syncEdges();
    return () => observer.disconnect();
  }, []);
  const page = (direction: 1 | -1) => {
    const row = toolbarRef.current;
    row?.scrollBy({ left: direction * row.clientWidth * 0.8 });
  };

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

  const hideTipOnEscape = useEffectEvent(hideTip);
  const tipShown = tip?.shown ?? false;
  useEffect(() => {
    if (!tipShown) return;
    // Captured first so Escape only hides the label, without also closing a panel (WCAG 1.4.13).
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      hideTipOnEscape();
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

  const readHovered = useEffectEvent((target: Element) => tts.readHovered(target));

  useEffect(() => {
    if (!ttsOn) return;
    let timer: number | undefined;
    const onOver = (event: PointerEvent) => {
      const target = event.target as Element;
      if (event.pointerType === "touch" || barRef.current?.contains(target) || playerRef.current?.contains(target)) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => readHovered(target), 150);
    };
    document.addEventListener("pointerover", onOver);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("pointerover", onOver);
    };
  }, [ttsOn]);

  // One tooltip rendered outside the scrolling row, which would otherwise clip it.
  const showTip = (target: EventTarget, keyboard = false) => {
    const button = (target as Element).closest<HTMLElement>("[data-label]");
    if (!button || (keyboard && (pointerInput.current || !button.matches(":focus-visible")))) return;
    // pointerover also fires for the icon inside a button, so speak once per control.
    if (ttsOn && spokenFor.current !== button) tts.say(button.dataset.label ?? "");
    spokenFor.current = button;
    const rect = button.getBoundingClientRect();
    const above = rect.top > innerHeight / 2;
    const x = Math.min(Math.max(rect.left + rect.width / 2, 72), innerWidth - 72);
    setTip((current) => ({
      label: button.dataset.label ?? "",
      x,
      y: above ? rect.top - 8 : rect.bottom + 8,
      above,
      shown: true,
      // Only glide when moving from a visible label, so a fresh label never sweeps in from its last position.
      glide: current?.shown ?? false,
    }));
  };
  const tipHandlers = {
    onPointerOver: (event: { target: EventTarget }) => showTip(event.target),
    onPointerLeave: (event: { relatedTarget: EventTarget | null }) => {
      if (!(event.relatedTarget instanceof Node) || !tipRef.current?.contains(event.relatedTarget)) hideTip();
    },
    onFocus: (event: { target: EventTarget }) => showTip(event.target, true),
    onBlur: () => hideTip(),
    onClick: () => hideTip(),
  };

  // Clear first so repeated messages produce a live-region change.
  const announce = (text: string) => {
    setMessage("");
    requestAnimationFrame(() => setMessage(text));
  };

  const togglePanel = (id: PanelId) => {
    const button = panelButtons.current.get(id);
    const bar = barRef.current?.getBoundingClientRect();
    if (button && bar) {
      const left = button.getBoundingClientRect().left - bar.left;
      const width = Math.min(300, innerWidth - 16);
      const anchor = left + button.offsetWidth / 2 - width / 2;
      setPanelLeft(Math.max(8, Math.min(anchor, bar.width - width - 8)));
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
    announce(ttsOn ? "Text to speech off" : "Text to speech on. Select any paragraph or press play.");
  };

  const toggleSound = (on: boolean) => {
    sound.current ??= new FocusSound(onSoundPlayback);
    setSoundError("");
    if (on) sound.current.start(focusSound.mode, focusSound.volume);
    else sound.current.stop();
    setFocusSound({ ...focusSound, playing: false });
    if (!on) announce("Focus sound off");
  };

  const onSoundPlayback = (playing: boolean, error: string) => {
    setFocusSound((current) => ({ ...current, playing }));
    setSoundError(error);
    if (error) announce(error);
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
      hideTip();
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
    if (current < 0) return;
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

  const speechKey = useEffectEvent((event: globalThis.KeyboardEvent) => {
    if (!support.speech || !event.ctrlKey || (event.target as Element).closest?.("input:not([type=checkbox]):not([type=radio]), textarea, select, [contenteditable=true]")) return;
    const key = event.key.toLowerCase();
    if (event.altKey && key === "z") { event.preventDefault(); toggleTts(); return; }
    if (!ttsOn) return;
    if (event.altKey && key === "p") { event.preventDefault(); if (!tts.playing) tts.togglePlay(); }
    else if (event.altKey && key === "s") { event.preventDefault(); tts.pause(); }
    else if (event.shiftKey && movablePlayer) {
      const delta = { ArrowLeft: [-24, 0], ArrowRight: [24, 0], ArrowUp: [0, -24], ArrowDown: [0, 24] }[event.key];
      const rect = playerRef.current?.getBoundingClientRect();
      if (delta && rect) { event.preventDefault(); movePlayer(playerOffset, rect, delta[0], delta[1]); }
    } else if (!event.altKey && !event.shiftKey && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "ArrowRight") tts.nextBlock(); else tts.previousBlock();
    }
  });
  useEffect(() => {
    const handler = (event: globalThis.KeyboardEvent) => speechKey(event);
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

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
        error={soundError}
        onToggle={toggleSound}
        onPlay={(mode) => {
          sound.current ??= new FocusSound(onSoundPlayback);
          setSoundError("");
          sound.current.start(mode, focusSound.volume);
          setFocusSound({ ...focusSound, mode, playing: false });
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
    structure: <PageStructurePanel onHeadingNavigate={close} />,
    speech: <SpeechPanel enabled={ttsOn} options={speechOptions} movable={movablePlayer} error={tts.error} onToggle={toggleTts} onOptions={setSpeechOptions} onMovable={(on) => { setMovablePlayer(on); setPlayerOffset({ x: 0, y: 0 }); }} onReset={() => {
      tts.reset(); setTtsOn(false); setSpeechOptions(DEFAULT_SPEECH_OPTIONS); setMovablePlayer(false); setPlayerOffset({ x: 0, y: 0 }); announce("Text to speech reset");
    }} />,
  };

  const player = (
    <fieldset ref={playerRef} data-tts-player data-movable={movablePlayer || undefined} {...tipHandlers}
      style={movablePlayer ? { transform: `translate(${playerOffset.x}px, ${playerOffset.y}px)` } : undefined}
      className={cn("a11y-tts-player", movablePlayer && "fixed bottom-4 left-4 z-[70]")}>
      <legend className="sr-only">Text to Speech player controls</legend>
      {movablePlayer ? <button type="button" aria-label="Move reading controls to the top or bottom (arrow keys also move them)" {...gripHandlers} className="grid size-10 cursor-grab touch-none place-items-center"><ToolbarIcon name="grip" /></button> : null}
      <PlayerButton label="Back" icon="skip-back" onClick={tts.previousBlock} />
      <PlayerButton label="Rewind 10 seconds" icon="rewind" onClick={tts.rewind} />
      <PlayerButton label={tts.playing ? "Pause Text to Speech" : "Play Text to Speech"} icon={tts.playing ? "pause" : "play"} onClick={tts.togglePlay} />
      <PlayerButton label="Fast Forward 10 seconds" icon="forward" onClick={tts.forward} />
      <PlayerButton label="Next" icon="skip-forward" onClick={tts.nextBlock} />
    </fieldset>
  );

  return (
    <section
      ref={barRef}
      aria-label="Accessibility toolbar"
      data-dark={prefs.toolbarDark || undefined}
      // Kept out of Google Translate: it rewrites text nodes, which would break React updates here.
      translate="no"
      className="a11y-toolbar notranslate fixed inset-x-0 top-0 z-[60] border-b-4 border-accent shadow-md [view-transition-class:chrome] [view-transition-name:a11y-toolbar]"
    >
      <a
        href="#main"
        className="sr-only z-10 rounded-md bg-(--tb-accent) px-4 py-3 font-bold text-(--tb-on-accent) focus:not-sr-only focus:absolute focus:top-2 focus:left-2"
        onClick={() => setPanel(null)}
      >
        Skip toolbar to main content
      </a>

      <div className="flex items-center gap-2 px-4 lg:gap-3 lg:px-6" {...tipHandlers}>
        {edges.prev ? <PageButton direction="prev" onClick={() => page(-1)} /> : null}
        <div
          ref={toolbarRef}
          role="toolbar"
          aria-label="Accessibility tools"
          tabIndex={-1}
          onKeyDown={onToolbarKeyDown}
          onScroll={() => {
            hideTip();
            updateEdges();
          }}
          className="a11y-tools flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 pt-2 pb-3 lg:gap-3"
        >
          <ToolButton
            label={support.speech ? "Text to Speech" : "Text to Speech (not supported in this browser)"}
            icon="speak"
            color="--tool-listen"
            active={ttsOn}
            disabled={!support.speech}
            {...panelTool("speech")}
            onClick={() => support.speech && togglePanel("speech")}
            {...rove()}
          />
          {ttsOn && !movablePlayer ? player : null}
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
          <ToolButton label={(prefs.readingMask || prefs.maskVertical) ? "Screen mask (on)" : "Screen mask"} icon="mask" color="--tool-mask" active={prefs.readingMask || prefs.maskVertical} {...panelTool("mask")} {...rove()} />
          <ToolButton label="Page options" icon="options" color="--tool-page" {...panelTool("page")} {...rove()} />
          <ToolButton label="Page structure" icon="structure" color="--tool-page" {...panelTool("structure")} {...rove()} />

          <ToolButton
            label="Reset all settings"
            icon="reset"
            color="--tool-colour"
            onClick={() => {
              resetPrefs();
              tts.reset();
              setTtsOn(false);
              setSpeechOptions(DEFAULT_SPEECH_OPTIONS);
              setMovablePlayer(false);
              sound.current?.stop();
              setFocusSound({ playing: false, mode: "focus", volume: 0.4 });
              stopVoice.current?.();
              stopVoice.current = null;
              setListening(false);
              setVoiceStatus("");
              setPlayerOffset({ x: 0, y: 0 });
              setPanel(null);
              announce("All settings reset");
            }}
            {...rove()}
          />
        </div>
        {edges.next ? <PageButton direction="next" onClick={() => page(1)} /> : null}

        {/* Rendered straight after the tools so Tab moves from the open tool into its panel. */}
        {panel ? (
          <section
            id={panelId}
            aria-labelledby={`${panelId}-title`}
            data-panel={panel}
            style={{ left: panelLeft }}
            className="a11y-panel pop-in absolute top-full z-[80] flex flex-col overflow-y-auto bg-(--tb-bg)"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={`${panelId}-title`} className="text-xl">
                {PANEL_TITLES[panel]}
              </h2>
              {panel === "structure" ? <button type="button" aria-label="Close Page Structure" onClick={closePanel} className="a11y-structure-close grid size-11 place-items-center rounded-full hover:bg-(--tb-hover)"><ToolbarIcon name="close" className="size-5" /></button> : null}
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

      {ttsOn && movablePlayer ? player : null}

      {tip ? (
        // Visual only: every control already has the same text as its accessible name.
        <div
          ref={tipRef}
          aria-hidden="true"
          style={{ left: tip.x, top: tip.y }}
          onPointerLeave={() => hideTip()}
          data-shown={tip.shown}
          data-glide={tip.glide}
          className={cn(
            // The ::before strip bridges the gap to the control so the pointer can move onto the label.
            "a11y-tip fixed z-10 -translate-x-1/2 whitespace-nowrap before:absolute before:inset-x-0 before:h-2",
            tip.above ? "-translate-y-full before:-bottom-2" : "before:-top-2",
            !tip.shown && "pointer-events-none",
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
