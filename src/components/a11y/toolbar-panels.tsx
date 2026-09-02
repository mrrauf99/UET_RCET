"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { ToolbarIcon } from "./ToolbarIcon";
import { LANGUAGES } from "@/lib/a11y/languages";
import { PRESET_LABELS } from "@/lib/a11y/color-presets";
import type { FocusSoundMode } from "@/lib/a11y/focus-sound";
import type { SpeechOptions } from "@/lib/a11y/speech";
import { COLOR_PRESETS, DEFAULT_PREFS, LETTER_SPACINGS, LINE_HEIGHTS, RULER_COLORS, RULER_SWATCHES, type A11yPrefs } from "@/lib/a11y/prefs";
import { resolvedAttribute, updatePrefs } from "@/lib/a11y/store";
import { currentTranslation, showOriginal, translatePage } from "@/lib/a11y/translate";
import { VOICE_COMMANDS } from "@/lib/a11y/voice-control";
import { Choice, ResetButton, Stepper, Switch } from "./controls";

type Announce = (message: string) => void;

interface PrefsPanelProps {
  prefs: A11yPrefs;
  announce: Announce;
}

function set(update: Partial<A11yPrefs>, announce: Announce, message: string) {
  updatePrefs(update);
  announce(message);
}

const onOff = (on: boolean) => (on ? "on" : "off");

export function SpeechPanel({ enabled, options, movable, error, onToggle, onOptions, onMovable, onReset }: {
  enabled: boolean; options: SpeechOptions; movable: boolean; error: string;
  onToggle: () => void; onOptions: (options: SpeechOptions) => void; onMovable: (on: boolean) => void; onReset: () => void;
}) {
  return <div className="a11y-speech-controls">
    <Switch label="Text To Speech (On/Off)" checked={enabled} onChange={onToggle} />
    {enabled ? <>
      <Switch label="Play Automatically" checked={options.autoPlay} onChange={(autoPlay) => onOptions({ ...options, autoPlay })} />
      <Switch label="Read whole page of content" checked={options.wholePage} onChange={(wholePage) => onOptions({ ...options, wholePage })} />
      <Switch label="Movable Player Controls" checked={movable} onChange={onMovable} />
      <hr className="a11y-divider" />
      <Choice legend="Voice" name="tts-voice" value={options.voice} options={[{ value: "male", label: "Male" }, { value: "female", label: "Female" }]} onChange={(voice) => onOptions({ ...options, voice })} />
      <hr className="a11y-divider" />
      <Stepper legend="Reading Speed:" valueLabel={String(options.rate)} canDecrease={options.rate > 0.5} canIncrease={options.rate < 2} decreaseLabel="Decrease playback speed" increaseLabel="Increase playback speed" onDecrease={() => onOptions({ ...options, rate: Math.max(0.5, Math.round((options.rate - 0.1) * 10) / 10) })} onIncrease={() => onOptions({ ...options, rate: Math.min(2, Math.round((options.rate + 0.1) * 10) / 10) })} />
      <hr className="a11y-divider" />
      <details className="a11y-speech-keyboard"><summary>Keyboard Controls</summary><p>Ctrl + Alt + Z: toggle Text to Speech.<br />Ctrl + Alt + P: play.<br />Ctrl + Alt + S: stop.<br />Ctrl + Right / Left: next / previous.<br />Ctrl + Shift + arrows: move floating controls.</p></details>
      {error ? <p role="alert" className="text-sm">{error}</p> : null}
    </> : null}
    <hr className="a11y-divider" />
    <ResetButton label="Reset Text to Speech Options to default" onClick={onReset} />
  </div>;
}

export function FocusAudioPanel({
  playing,
  mode,
  volume,
  error,
  onToggle,
  onPlay,
  onVolume,
}: {
  playing: boolean;
  mode: FocusSoundMode;
  volume: number;
  error: string;
  onToggle: (on: boolean) => void;
  onPlay: (mode: FocusSoundMode) => void;
  onVolume: (volume: number) => void;
}) {
  return (
    <div className="a11y-panel-controls">
      <div className="a11y-audio-volume">
        <button type="button" className="a11y-audio-toggle" aria-label={playing ? "Pause focus audio" : "Resume focus audio"} aria-pressed={playing} onClick={() => onToggle(!playing)}>
          <ToolbarIcon name={playing ? "speak" : "pause"} className="size-5" />
        </button>
        <label htmlFor="focus-audio-volume">Volume</label>
        <input
          id="focus-audio-volume"
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(volume * 100)}
          onChange={(event) => onVolume(Number(event.target.value) / 100)}
          className="min-w-0 flex-1 accent-(--tb-fg)"
        />
      </div>
      {([{ value: "focus", label: "Focus" }, { value: "deeper", label: "Deeper Reading" }] as const).map((track) => (
        <button key={track.value} type="button" className="a11y-audio-track" aria-pressed={playing && mode === track.value} onClick={() => playing && mode === track.value ? onToggle(false) : onPlay(track.value)}>
          {track.label}<ToolbarIcon name={playing && mode === track.value ? "pause" : "play"} className="size-5" />
        </button>
      ))}
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
export function VoiceControlPanel({
  supported,
  listening,
  status,
  onToggle,
}: {
  supported: boolean;
  listening: boolean;
  status: string;
  onToggle: (on: boolean) => void;
}) {
  const [showCommands, setShowCommands] = useState(false);
  if (!supported) {
    return (
      <p>
        Voice control is not available in this browser. It works in recent versions of Chrome, Edge and Safari.
      </p>
    );
  }
  return (
    <div className="a11y-panel-controls">
      <Switch
        label="Voice Control (On/Off)"
        description="Uses your microphone. Speech is processed by your browser’s speech service."
        checked={listening}
        onChange={onToggle}
      />
      {status ? <p className="rounded-md border-2 border-(--tb-border) p-3 text-sm">{status}</p> : null}
      <Switch label="View all Commands" checked={showCommands} onChange={setShowCommands} />
      {showCommands ? <div>
        <h3 className="font-bold">Commands</h3>
        <dl className="mt-2 divide-y divide-(--tb-border) text-sm">
          {VOICE_COMMANDS.map((command) => (
            <div key={command.say} className="py-2">
              <dt className="font-bold">“{command.say}”</dt>
              <dd className="text-(--tb-muted)">{command.does}</dd>
            </div>
          ))}
        </dl>
      </div> : null}
    </div>
  );
}

const FONT_OPTIONS = [
  { value: "default", label: "Default Font", style: undefined },
  { value: "lexend", label: "Lexend", style: "var(--font-lexend), Verdana, Arial, sans-serif" },
  { value: "arial", label: "Arial", style: "Arial, sans-serif" },
  { value: "verdana", label: "Verdana", style: "Verdana, sans-serif" },
  { value: "comic-sans", label: "Comic Sans MS", style: '"Comic Sans MS", cursive' },
  { value: "georgia", label: "Georgia", style: "Georgia, serif" },
  { value: "tahoma", label: "Tahoma", style: "Tahoma, Verdana, sans-serif" },
  { value: "lato", label: "Lato", style: "var(--font-lato), Arial, sans-serif" },
  { value: "trebuchet", label: "Trebuchet", style: '"Trebuchet MS", sans-serif' },
  { value: "open-dyslexic", label: "Open Dyslexic", style: '"Open Dyslexic", Verdana, sans-serif' },
] as const;

export function FontPanel({ prefs, announce }: PrefsPanelProps) {
  const lineIndex = LINE_HEIGHTS.indexOf(prefs.lineHeight);
  const spacingIndex = LETTER_SPACINGS.indexOf(prefs.letterSpacing);
  return (
    <>
      <Stepper
        legend="Line Height"
        valueLabel={prefs.lineHeight ? `${prefs.lineHeight}×` : "Default"}
        canDecrease={lineIndex > 0}
        canIncrease={lineIndex < LINE_HEIGHTS.length - 1}
        decreaseLabel="Reduce line spacing"
        increaseLabel="Increase line spacing"
        onDecrease={() => set({ lineHeight: LINE_HEIGHTS[lineIndex - 1] }, announce, "Line spacing reduced")}
        onIncrease={() => set({ lineHeight: LINE_HEIGHTS[lineIndex + 1] }, announce, "Line spacing increased")}
      />
      <Stepper
        legend="Character Spacing"
        valueLabel={prefs.letterSpacing ? `+${prefs.letterSpacing}em` : "Default"}
        canDecrease={spacingIndex > 0}
        canIncrease={spacingIndex < LETTER_SPACINGS.length - 1}
        decreaseLabel="Reduce character spacing"
        increaseLabel="Increase character spacing"
        onDecrease={() => set({ letterSpacing: LETTER_SPACINGS[spacingIndex - 1] }, announce, "Character spacing reduced")}
        onIncrease={() =>
          set({ letterSpacing: LETTER_SPACINGS[spacingIndex + 1] }, announce, "Character spacing increased")
        }
      />
      <hr className="a11y-divider" />
      <fieldset className="a11y-font-list">
        <legend className="mb-2 font-bold">Select Font</legend>
        <div className="flex flex-col gap-2">
          {FONT_OPTIONS.map((font) => (
            <label
              key={font.value}
              style={{ fontFamily: font.style }}
              className="a11y-font-option flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-(--tb-border) has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--tb-focus)"
            >
              <input
                type="radio"
                name="toolbar-font"
                value={font.value}
                checked={prefs.font === font.value}
                onChange={() => set({ font: font.value }, announce, `Font ${font.label}`)}
                className="sr-only"
              />
              {font.label}
            </label>
          ))}
        </div>
      </fieldset>
      <ResetButton
        label="Reset font options"
        onClick={() =>
          set(
            { font: DEFAULT_PREFS.font, lineHeight: DEFAULT_PREFS.lineHeight, letterSpacing: DEFAULT_PREFS.letterSpacing },
            announce,
            "Font options reset",
          )
        }
      />
    </>
  );
}

export function TranslationPanel({ announce }: { announce: Announce }) {
  const [query, setQuery] = useState("");
  // Panels render only in the browser (the toolbar is closed during server rendering).
  const [active, setActive] = useState(currentTranslation);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const visible = LANGUAGES.toSorted((a, b) => a.name.localeCompare(b.name)).filter((language) =>
    `${language.name} ${language.native}`.toLowerCase().includes(query.toLowerCase()),
  );

  const choose = async (language: (typeof LANGUAGES)[number]) => {
    if (pending) return;
    setPending(language.code);
    setError("");
    try {
      await translatePage(language.code);
      setActive(language.code);
      announce(`Page translated to ${language.name}`);
    } catch {
      setError("Translation could not start. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="a11y-translation-controls">
      <button type="button" className="a11y-panel-reset" aria-label="Reset translation to original English" aria-disabled={pending !== null || undefined} onClick={() => {
        if (pending) return;
        if (active) showOriginal();
        else {
          setQuery("");
          setError("");
          announce("Original English selected");
        }
      }}>Reset to default</button>
      {error ? (
        <p role="alert" className="rounded-md border-2 border-(--tb-accent) p-3 text-sm">
          {error}
        </p>
      ) : null}
      <label className="a11y-language-search">
        <span className="sr-only">Search languages</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 shrink-0"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
        <input
          ref={searchRef}
          type="search"
          placeholder={`Search ${LANGUAGES.length} Languages`}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <output aria-live="polite" className="sr-only">{visible.length} languages found</output>
      <ul className="a11y-language-list" aria-label="Languages">
        {visible.map((language) => (
          <li key={language.code}>
            <button
              type="button"
              aria-pressed={active === language.code}
              aria-label={`${language.name} (${language.native})`}
              aria-busy={pending === language.code || undefined}
              // aria-disabled keeps keyboard focus on the button; disabled would drop it to <body>.
              aria-disabled={pending !== null || undefined}
              onClick={() => choose(language)}
              className="a11y-language-option"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span>{language.name}</span>
                <span lang={language.code} dir="auto" className="text-sm">{language.native}</span>
              </span>
              {pending === language.code ? (
                <span className="text-sm">Translating…</span>
              ) : active === language.code ? <Icon name="check" /> : null}
            </button>
          </li>
        ))}
        {visible.length === 0 ? <li className="py-2 text-sm">No language matches “{query}”.</li> : null}
      </ul>
      <button type="button" className="a11y-language-top" onClick={() => {
        searchRef.current?.closest<HTMLElement>("[data-panel]")?.scrollTo({ top: 0 });
        searchRef.current?.focus({ preventScroll: true });
      }}><Icon name="send" className="size-4" />Back to top</button>
      <p className="text-sm text-(--tb-muted)">Translated with Google Translate. Machine translation can contain errors.</p>
    </div>
  );
}

export function ColourPanel({ prefs, announce }: PrefsPanelProps) {
  const selected = prefs.colorPreset === "none" ? (prefs.grayscale ? "Monochrome" : "Default theme") : PRESET_LABELS[prefs.colorPreset].name;
  return (
    <div className="a11y-colour-controls">
      <label className="a11y-ruler-check">
        Monochrome
        <input type="checkbox" checked={prefs.grayscale} onChange={(event) => set({ grayscale: event.target.checked, colorPreset: "none" }, announce, `Monochrome ${onOff(event.target.checked)}. Page colours reset.`)} />
      </label>
      <div className="a11y-colour-background">
        <h3>Page Background</h3>
        {(["Dark", "Light"] as const).map((group) => (
          <fieldset key={group}>
            <legend>{group}</legend>
            <div className="a11y-colour-swatches">
              {COLOR_PRESETS.filter((preset): preset is Exclude<A11yPrefs["colorPreset"], "none"> => preset !== "none" && PRESET_LABELS[preset].group === group).map((preset) => {
                const swatch = PRESET_LABELS[preset];
                return (
                  <label key={preset} title={swatch.name} data-tone={group.toLowerCase()} style={{ backgroundColor: swatch.bg, color: swatch.fg }}>
                    <input type="radio" name="toolbar-preset" value={preset} checked={prefs.colorPreset === preset} onChange={() => set({ colorPreset: preset }, announce, swatch.name)} aria-label={swatch.name} className="sr-only" />
                    <span aria-hidden="true">A</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <p className="a11y-colour-selection">Selected: {selected}</p>
      <button type="button" className="a11y-panel-reset" aria-label="Reset colour themes to default" onClick={() => set({ theme: DEFAULT_PREFS.theme, contrast: DEFAULT_PREFS.contrast, grayscale: false, colorPreset: "none" }, announce, "Colours reset")}>Reset to default</button>
    </div>
  );
}

export function RulerPanel({ prefs, announce }: PrefsPanelProps) {
  return (
    <div className="a11y-ruler-controls">
      <label className="a11y-ruler-check">
        Ruler
        <input type="checkbox" checked={prefs.readingGuide} onChange={(event) => set({ readingGuide: event.target.checked }, announce, `Reading ruler ${onOff(event.target.checked)}`)} />
      </label>
      {prefs.readingGuide ? (
        <>
          <label className="a11y-ruler-check">
            Markings
            <input type="checkbox" checked={prefs.rulerMarkings} onChange={(event) => set({ rulerMarkings: event.target.checked }, announce, `Ruler markings ${onOff(event.target.checked)}`)} />
          </label>
          <fieldset className="a11y-ruler-colours">
            <legend>Select Colour</legend>
            <div className="a11y-ruler-swatches">
              {RULER_COLORS.map((color) => (
                <label key={color} title={color} style={{ backgroundColor: RULER_SWATCHES[color] }}>
                  <input type="radio" name="ruler-colour" aria-label={color} value={color} checked={prefs.rulerColor === color} onChange={() => set({ rulerColor: color }, announce, `Ruler colour ${color}`)} className="sr-only" />
                </label>
              ))}
            </div>
          </fieldset>
          <div className="a11y-ruler-adjustments">
            <Stepper
              legend="Size"
              valueLabel={String(prefs.rulerSize)}
              canDecrease={prefs.rulerSize > 1}
              canIncrease={prefs.rulerSize < 5}
              decreaseLabel="Reduce ruler size"
              increaseLabel="Increase ruler size"
              onDecrease={() => set({ rulerSize: (prefs.rulerSize - 1) as A11yPrefs["rulerSize"] }, announce, "Ruler smaller")}
              onIncrease={() => set({ rulerSize: (prefs.rulerSize + 1) as A11yPrefs["rulerSize"] }, announce, "Ruler larger")}
            />
            <Stepper
              legend="Opacity Level"
              valueLabel={`${prefs.rulerOpacity}%`}
              canDecrease={prefs.rulerOpacity > 25}
              canIncrease={prefs.rulerOpacity < 100}
              decreaseLabel="Reduce ruler opacity"
              increaseLabel="Increase ruler opacity"
              onDecrease={() => set({ rulerOpacity: (prefs.rulerOpacity - 25) as A11yPrefs["rulerOpacity"] }, announce, "Ruler opacity reduced")}
              onIncrease={() => set({ rulerOpacity: (prefs.rulerOpacity + 25) as A11yPrefs["rulerOpacity"] }, announce, "Ruler opacity increased")}
            />
          </div>
          <hr className="a11y-divider" />
          <div className="a11y-reading-controls">
            <h3>Controls</h3>
            <p>Move mouse or use your keyboard keys</p>
            <p>Shift + Arrow keys (up &amp; down)</p>
          </div>
        </>
      ) : null}
      <button type="button" className="a11y-ruler-reset" onClick={() => set({ readingGuide: false, rulerMarkings: DEFAULT_PREFS.rulerMarkings, rulerColor: DEFAULT_PREFS.rulerColor, rulerSize: DEFAULT_PREFS.rulerSize, rulerOpacity: DEFAULT_PREFS.rulerOpacity }, announce, "Ruler reset to default")}>
        Reset to default
      </button>
    </div>
  );
}

export function CursorPanel({ prefs, announce }: PrefsPanelProps) {
  return (
    <>
      <Choice
        legend="Cursor Size"
        name="cursor-size"
        value={prefs.cursor}
        options={[
          { value: "small", label: "Small" },
          { value: "medium", label: "Medium" },
          { value: "large", label: "Large" },
          { value: "x-large", label: "X-Large" },
        ]}
        onChange={(cursor) => set({ cursor }, announce, `Cursor ${cursor === "x-large" ? "extra large" : cursor}`)}
      />
      <hr className="a11y-divider" />
      <Choice
        legend="Cursor Colour"
        name="cursor-colour"
        value={prefs.cursorColor}
        options={[
          { value: "white", label: "White" },
          { value: "black", label: "Black" },
        ]}
        onChange={(cursorColor) => set({ cursorColor }, announce, `Cursor colour ${cursorColor}`)}
      />
      <ResetButton label="Reset cursor to system default" onClick={() => set({ cursor: DEFAULT_PREFS.cursor, cursorColor: DEFAULT_PREFS.cursorColor }, announce, "Cursor reset to system default")} />
    </>
  );
}

export function MaskPanel({ prefs, announce }: PrefsPanelProps) {
  const enabled = prefs.readingMask || prefs.maskVertical;
  return (
    <div className="a11y-mask-controls">
      <Switch label="Horizontal" checked={prefs.readingMask} onChange={(on) => set({ readingMask: on }, announce, `Horizontal mask ${onOff(on)}`)} />
      <Switch label="Vertical" checked={prefs.maskVertical} onChange={(on) => set({ maskVertical: on }, announce, `Vertical mask ${onOff(on)}`)} />
      {enabled ? <>
        <Switch label="Edge Colour" checked={prefs.maskEdge} onChange={(on) => set({ maskEdge: on }, announce, `Mask edge ${onOff(on)}`)} />
        <fieldset className="a11y-ruler-colours">
          <legend>Select Colour</legend>
          <div className="a11y-ruler-swatches">
            {RULER_COLORS.map((color) => <label key={color} title={color} style={{ backgroundColor: RULER_SWATCHES[color] }}>
              <input type="radio" name="mask-colour" aria-label={color} checked={prefs.maskColor === color} onChange={() => set({ maskColor: color }, announce, `Mask colour ${color}`)} className="sr-only" />
            </label>)}
          </div>
        </fieldset>
        <hr className="a11y-divider" />
        <Stepper legend="Size" valueLabel={String(prefs.maskSize)} canDecrease={prefs.maskSize > 1} canIncrease={prefs.maskSize < 5} decreaseLabel="Reduce screen mask window size" increaseLabel="Increase screen mask window size" onDecrease={() => set({ maskSize: (prefs.maskSize - 1) as A11yPrefs["maskSize"] }, announce, "Mask window smaller")} onIncrease={() => set({ maskSize: (prefs.maskSize + 1) as A11yPrefs["maskSize"] }, announce, "Mask window larger")} />
        <Stepper legend="Opacity Level" valueLabel={`${prefs.maskOpacity}%`} canDecrease={prefs.maskOpacity > 25} canIncrease={prefs.maskOpacity < 100} decreaseLabel="Reduce mask opacity" increaseLabel="Increase mask opacity" onDecrease={() => set({ maskOpacity: (prefs.maskOpacity - 25) as A11yPrefs["maskOpacity"] }, announce, "Mask opacity reduced")} onIncrease={() => set({ maskOpacity: (prefs.maskOpacity + 25) as A11yPrefs["maskOpacity"] }, announce, "Mask opacity increased")} />
        <hr className="a11y-divider" />
        <div className="a11y-reading-controls">
          <h3>Controls</h3>
          <p>Move mouse or use your keyboard keys</p>
          <p>Shift + Arrow keys ({prefs.readingMask && prefs.maskVertical ? "up, down, left & right" : prefs.maskVertical ? "left & right" : "up & down"})</p>
        </div>
      </> : null}
      <ResetButton label="Reset screen mask to default" onClick={() => set({ readingMask: false, maskVertical: false, maskEdge: false, maskColor: DEFAULT_PREFS.maskColor, maskOpacity: DEFAULT_PREFS.maskOpacity, maskSize: DEFAULT_PREFS.maskSize }, announce, "Screen mask reset")} />
    </div>
  );
}

export function PageOptionsPanel({ prefs, announce }: PrefsPanelProps) {
  const motionReduced = resolvedAttribute("data-motion") === "reduce";
  return (
    <div className="a11y-page-controls">
      {!prefs.plainText ? <div className="a11y-page-image-options">
        <Switch label="Pause Animations and Video" checked={motionReduced} onChange={(on) => set({ motion: on ? "reduce" : "no-preference" }, announce, `Animations and video ${on ? "paused" : "on"}`)} />
        <Switch label="Hide Images" checked={prefs.hideImages} onChange={(on) => set({ hideImages: on }, announce, on ? "Images hidden on page. Images which are links have not been hidden." : "Images shown")} />
        <Switch label="View Image Description" checked={prefs.imageDescriptions} onChange={(on) => set({ imageDescriptions: on }, announce, `Image descriptions ${onOff(on)}`)} />
      </div> : null}
      {!prefs.plainText ? <hr className="a11y-divider" /> : null}
      <Switch label="Plain Text Mode" checked={prefs.plainText} onChange={(on) => set({ plainText: on, textArea: DEFAULT_PREFS.textArea }, announce, `Plain text mode ${onOff(on)}`)} />
      <hr className="a11y-divider" />
      {prefs.plainText ? <>
        <Choice
          legend="Text Area"
          name="page-text-area"
          value={prefs.textArea}
          options={[
            { value: "small", label: "Small", ariaLabel: "Small Text Area" },
            { value: "medium", label: "Medium", ariaLabel: "Medium Text Area" },
            { value: "large", label: "Large", ariaLabel: "Large Text Area" },
            { value: "full", label: "Full Page", ariaLabel: "Full Page Text Area" },
          ]}
          onChange={(textArea) => set({ textArea }, announce, `Text area ${textArea === "full" ? "full page" : textArea}`)}
        />
        <hr className="a11y-divider" />
      </> : null}
      <ResetButton label="Reset page options to default" onClick={() => set({ motion: DEFAULT_PREFS.motion, hideImages: false, imageDescriptions: false, plainText: false, textArea: DEFAULT_PREFS.textArea }, announce, "Page options reset")} />
    </div>
  );
}

type StructureView = "headings" | "landmarks" | "links";
interface Outline { id: string; label: string; badge: string; }

function collectOutline(view: StructureView): Outline[] {
  const selector = view === "headings" ? "h1, h2, h3, h4, h5, h6" : view === "links" ? "a[href]" : "header, nav, main, footer, aside, section[aria-labelledby], [role=banner], [role=navigation], [role=main], [role=contentinfo], [role=region]";
  return [...document.querySelectorAll<HTMLElement>(selector)]
    .filter((element) => !element.closest(".a11y-toolbar") && element.getClientRects().length > 0)
    .map((element, index) => {
      element.id ||= `outline-${view}-${index}`;
      const labelledBy = element.getAttribute("aria-labelledby");
      const label = element.getAttribute("aria-label") ?? (labelledBy ? labelledBy.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ") : null) ?? (view === "landmarks" ? element.getAttribute("role") ?? element.tagName.toLowerCase() : element.innerText || element.querySelector("img")?.alt || "");
      return { id: element.id, label: label.trim().replace(/\s+/g, " "), badge: view === "headings" ? element.tagName : view === "links" ? "Link" : element.getAttribute("role") ?? element.tagName.toLowerCase() };
    }).filter((item) => item.label);
}

export function PageStructurePanel({ onHeadingNavigate }: { onHeadingNavigate: () => void }) {
  const [view, setView] = useState<StructureView>("headings");
  const [items, setItems] = useState<Outline[]>(() => collectOutline("headings"));
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeElement = useRef<HTMLElement | null>(null);
  const preserveHighlight = useRef(false);
  useEffect(() => () => {
    const element = activeElement.current;
    if (!element) return;
    if (!preserveHighlight.current) {
      element.removeAttribute("data-structure-active");
      return;
    }
    const clearOnOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && element.contains(event.target)) return;
      element.removeAttribute("data-structure-active");
      document.removeEventListener("pointerdown", clearOnOutside, true);
    };
    document.addEventListener("pointerdown", clearOnOutside, true);
  }, []);
  const go = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    document.querySelectorAll("[data-structure-active]").forEach((target) => target.removeAttribute("data-structure-active"));
    activeElement.current = element;
    element.setAttribute("data-structure-active", "true");
    setActiveId(id);
    preserveHighlight.current = view === "headings" && window.matchMedia("(max-width: 1023px)").matches;
    if (preserveHighlight.current) onHeadingNavigate();
    element.scrollIntoView({ block: "center", behavior: "instant" });
  };
  return <>
    <div className="a11y-structure-rule" />
    <p className="a11y-structure-description">Provides an overview of the webpage's layout by displaying key elements such as headings, landmarks, and links.</p>
    <div className="a11y-structure-tabs" role="tablist" aria-label="Page structure">
      {(["headings", "landmarks", "links"] as const).map((tab) => <button type="button" key={tab} id={`structure-tab-${tab}`} role="tab" aria-selected={view === tab} aria-controls="structure-content" tabIndex={view === tab ? 0 : -1} onClick={() => { setView(tab); setItems(collectOutline(tab)); }} onKeyDown={(event) => {
        const tabs = ["headings", "landmarks", "links"] as const;
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const index = event.key === "Home" ? 0 : event.key === "End" ? 2 : (tabs.indexOf(tab) + (event.key === "ArrowRight" ? 1 : 2)) % 3;
        const next = tabs[index];
        setView(next); setItems(collectOutline(next)); document.getElementById(`structure-tab-${next}`)?.focus();
      }}>{tab[0].toUpperCase() + tab.slice(1)}</button>)}
    </div>
    <div id="structure-content" role="tabpanel" aria-labelledby={`structure-tab-${view}`}>
      <ul className="a11y-structure-list">
        {items.map((item) => <li key={item.id}><span className="a11y-structure-badge" aria-hidden="true">{item.badge}</span><button type="button" onClick={() => go(item.id)} aria-current={activeId === item.id ? "location" : undefined} aria-label={`${item.badge}: ${item.label}`}>{item.label}</button></li>)}
      </ul>
      {!items.length ? <p>No {view} found on this page.</p> : null}
    </div>
  </>;
}
