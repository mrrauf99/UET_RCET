"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import type { FocusSoundMode } from "@/lib/a11y/focus-sound";
import { COLOR_PRESETS, DEFAULT_PREFS, LETTER_SPACINGS, LINE_HEIGHTS, RULER_COLORS, type A11yPrefs } from "@/lib/a11y/prefs";
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

export function FocusAudioPanel({
  playing,
  mode,
  volume,
  onToggle,
  onMode,
  onVolume,
}: {
  playing: boolean;
  mode: FocusSoundMode;
  volume: number;
  onToggle: (on: boolean) => void;
  onMode: (mode: FocusSoundMode) => void;
  onVolume: (volume: number) => void;
}) {
  return (
    <>
      <Switch
        label="Play focus sound"
        description="Steady background sound that masks distractions while you read."
        checked={playing}
        onChange={onToggle}
      />
      <Choice
        legend="Sound"
        name="focus-sound-mode"
        value={mode}
        columns={2}
        options={[
          { value: "focus", label: "Focus" },
          { value: "deeper", label: "Deeper reading" },
        ]}
        onChange={onMode}
      />
      <label className="flex flex-col gap-2 font-bold">
        Volume
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(volume * 100)}
          onChange={(event) => onVolume(Number(event.target.value) / 100)}
          className="h-11 w-full accent-(--tb-accent)"
        />
      </label>
    </>
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
  if (!supported) {
    return (
      <p>
        Voice control is not available in this browser. It works in recent versions of Chrome, Edge and Safari.
      </p>
    );
  }
  return (
    <>
      <Switch
        label="Voice control"
        description="Uses your microphone. Speech is processed by your browser’s speech service."
        checked={listening}
        onChange={onToggle}
      />
      {status ? <p className="rounded-md border-2 border-(--tb-border) p-3 text-sm">{status}</p> : null}
      <div>
        <h3 className="font-bold">Commands</h3>
        <dl className="mt-2 divide-y divide-(--tb-border) text-sm">
          {VOICE_COMMANDS.map((command) => (
            <div key={command.say} className="py-2">
              <dt className="font-bold">“{command.say}”</dt>
              <dd className="text-(--tb-muted)">{command.does}</dd>
            </div>
          ))}
        </dl>
      </div>
    </>
  );
}

const FONT_OPTIONS = [
  { value: "default", label: "Default", style: undefined },
  { value: "arial", label: "Arial", style: "Arial, sans-serif" },
  { value: "verdana", label: "Verdana", style: "Verdana, sans-serif" },
  { value: "georgia", label: "Georgia", style: "Georgia, serif" },
] as const;

export function FontPanel({ prefs, announce }: PrefsPanelProps) {
  const lineIndex = LINE_HEIGHTS.indexOf(prefs.lineHeight);
  const spacingIndex = LETTER_SPACINGS.indexOf(prefs.letterSpacing);
  return (
    <>
      <Stepper
        legend="Line height"
        valueLabel={prefs.lineHeight ? `${prefs.lineHeight}×` : "Default"}
        canDecrease={lineIndex > 0}
        canIncrease={lineIndex < LINE_HEIGHTS.length - 1}
        decreaseLabel="Reduce line spacing"
        increaseLabel="Increase line spacing"
        onDecrease={() => set({ lineHeight: LINE_HEIGHTS[lineIndex - 1] }, announce, "Line spacing reduced")}
        onIncrease={() => set({ lineHeight: LINE_HEIGHTS[lineIndex + 1] }, announce, "Line spacing increased")}
      />
      <Stepper
        legend="Character spacing"
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
      <fieldset>
        <legend className="mb-2 font-bold">Select font</legend>
        <div className="flex flex-col gap-2">
          {FONT_OPTIONS.map((font) => (
            <label
              key={font.value}
              style={{ fontFamily: font.style }}
              className="flex min-h-11 cursor-pointer items-center justify-center rounded-full border-2 border-(--tb-border) has-checked:border-(--tb-accent) has-checked:bg-(--tb-accent) has-checked:text-(--tb-on-accent) has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--tb-focus)"
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

const LANGUAGES = [
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "简体中文" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ps", name: "Pashto", native: "پښتو" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "fa", name: "Persian", native: "فارسی" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "fr", name: "French", native: "Français" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "es", name: "Spanish", native: "Español" },
] as const;

export function TranslationPanel({ announce }: { announce: Announce }) {
  const [query, setQuery] = useState("");
  // Panels render only in the browser (the toolbar is closed during server rendering).
  const [active, setActive] = useState(currentTranslation);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visible = LANGUAGES.filter((language) =>
    `${language.name} ${language.native}`.toLowerCase().includes(query.toLowerCase()),
  );

  const choose = async (language: (typeof LANGUAGES)[number]) => {
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
    <>
      <p className="text-sm text-(--tb-muted)">
        Translates this page with Google Translate. Machine translation can contain errors.
      </p>
      {active ? (
        <button
          type="button"
          onClick={showOriginal}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full border-2 border-(--tb-fg) font-bold hover:bg-(--tb-hover)"
        >
          <Icon name="reset" />
          Show original (English)
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-md border-2 border-(--tb-accent) p-3 text-sm">
          {error}
        </p>
      ) : null}
      <label className="flex flex-col gap-2 font-bold">
        Search languages
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="min-h-11 rounded-full border-2 border-(--tb-border) bg-(--tb-bg) px-4 font-normal"
        />
      </label>
      <ul className="flex max-h-72 flex-col overflow-y-auto">
        {visible.map((language) => (
          <li key={language.code}>
            <button
              type="button"
              aria-pressed={active === language.code}
              aria-busy={pending === language.code || undefined}
              disabled={pending !== null}
              onClick={() => choose(language)}
              className="flex min-h-11 w-full items-center justify-between gap-3 rounded-sm px-2 text-start hover:bg-(--tb-hover) aria-pressed:bg-(--tb-accent) aria-pressed:text-(--tb-on-accent) disabled:cursor-wait"
            >
              <span className="font-bold">{language.name}</span>
              <span lang={language.code} className="opacity-80">
                {pending === language.code ? "Translating…" : language.native}
              </span>
            </button>
          </li>
        ))}
        {visible.length === 0 ? <li className="py-2 text-sm">No language matches “{query}”.</li> : null}
      </ul>
    </>
  );
}

const PRESET_LABELS: Record<(typeof COLOR_PRESETS)[number], { name: string; bg: string; fg: string }> = {
  none: { name: "Site colours", bg: "#ffffff", fg: "#0a1f55" },
  "black-white": { name: "Black background, white text", bg: "#000000", fg: "#ffffff" },
  "black-yellow": { name: "Black background, yellow text", bg: "#000000", fg: "#ffff00" },
  "blue-yellow": { name: "Blue background, yellow text", bg: "#002b80", fg: "#ffff00" },
  "cream-black": { name: "Cream background, black text", bg: "#fff6d9", fg: "#000000" },
  "yellow-black": { name: "Yellow background, black text", bg: "#ffff00", fg: "#000000" },
  "white-blue": { name: "White background, blue text", bg: "#ffffff", fg: "#0a2a9e" },
};

export function ColourPanel({ prefs, announce }: PrefsPanelProps) {
  const contrastOn = resolvedAttribute("data-contrast") === "more";
  return (
    <>
      <Choice
        legend="Theme"
        name="toolbar-theme"
        value={prefs.theme}
        options={[
          { value: "system", label: "Device" },
          { value: "light", label: "Light" },
          { value: "dark", label: "Dark" },
        ]}
        onChange={(theme) => set({ theme }, announce, `Theme ${theme === "system" ? "follows your device" : theme}`)}
      />
      <Switch
        label="High contrast"
        checked={contrastOn}
        onChange={(on) => set({ contrast: on ? "more" : "default" }, announce, `High contrast ${onOff(on)}`)}
      />
      <Switch
        label="Monochrome"
        checked={prefs.grayscale}
        onChange={(on) => set({ grayscale: on }, announce, `Monochrome ${onOff(on)}`)}
      />
      <fieldset>
        <legend className="mb-2 font-bold">Page background</legend>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_PRESETS.map((preset) => {
            const swatch = PRESET_LABELS[preset];
            return (
              <label
                key={preset}
                title={swatch.name}
                style={{ backgroundColor: swatch.bg, color: swatch.fg }}
                className="relative grid aspect-square min-h-11 cursor-pointer place-items-center rounded-md border-2 border-(--tb-border) font-display text-xl font-bold has-checked:outline-3 has-checked:outline-offset-2 has-checked:outline-(--tb-accent) has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-(--tb-focus)"
              >
                <input
                  type="radio"
                  name="toolbar-preset"
                  value={preset}
                  checked={prefs.colorPreset === preset}
                  onChange={() => set({ colorPreset: preset }, announce, swatch.name)}
                  aria-label={swatch.name}
                  className="sr-only"
                />
                <span aria-hidden="true">A</span>
              </label>
            );
          })}
        </div>
      </fieldset>
      <ResetButton
        label="Reset colours"
        onClick={() =>
          set(
            { theme: DEFAULT_PREFS.theme, contrast: DEFAULT_PREFS.contrast, grayscale: false, colorPreset: "none" },
            announce,
            "Colours reset",
          )
        }
      />
    </>
  );
}

const RULER_SWATCHES: Record<A11yPrefs["rulerColor"], string> = {
  red: "#b3261e",
  blue: "#1d4fa8",
  yellow: "#f5c451",
  green: "#1b6e3c",
  black: "#000000",
};

export function RulerPanel({ prefs, announce }: PrefsPanelProps) {
  return (
    <>
      <Switch
        label="Reading ruler"
        description="A bar that follows your pointer or keyboard focus. Press Alt with the up or down arrow to move it."
        checked={prefs.readingGuide}
        onChange={(on) => set({ readingGuide: on }, announce, `Reading ruler ${onOff(on)}`)}
      />
      <Choice
        legend="Colour"
        name="ruler-colour"
        value={prefs.rulerColor}
        columns={5}
        swatches
        options={RULER_COLORS.map((color) => ({
          value: color,
          ariaLabel: color,
          label: <span aria-hidden="true" className="size-6 rounded-full border-2 border-white" style={{ backgroundColor: RULER_SWATCHES[color] }} />,
        }))}
        onChange={(rulerColor) => set({ rulerColor }, announce, `Ruler colour ${rulerColor}`)}
      />
      <Stepper
        legend="Size"
        valueLabel={String(prefs.rulerSize)}
        canDecrease={prefs.rulerSize > 1}
        canIncrease={prefs.rulerSize < 4}
        decreaseLabel="Reduce ruler size"
        increaseLabel="Increase ruler size"
        onDecrease={() => set({ rulerSize: (prefs.rulerSize - 1) as A11yPrefs["rulerSize"] }, announce, "Ruler smaller")}
        onIncrease={() => set({ rulerSize: (prefs.rulerSize + 1) as A11yPrefs["rulerSize"] }, announce, "Ruler larger")}
      />
    </>
  );
}

export function CursorPanel({ prefs, announce }: PrefsPanelProps) {
  return (
    <>
      <Choice
        legend="Cursor size"
        name="cursor-size"
        value={prefs.cursor}
        options={[
          { value: "default", label: "Default" },
          { value: "large", label: "Large" },
          { value: "x-large", label: "X-Large" },
        ]}
        onChange={(cursor) => set({ cursor }, announce, `Cursor ${cursor === "x-large" ? "extra large" : cursor}`)}
      />
      <Choice
        legend="Cursor colour"
        name="cursor-colour"
        value={prefs.cursorColor}
        columns={2}
        options={[
          { value: "black", label: "Black" },
          { value: "white", label: "White" },
        ]}
        onChange={(cursorColor) => set({ cursorColor }, announce, `Cursor colour ${cursorColor}`)}
      />
    </>
  );
}

export function MaskPanel({ prefs, announce }: PrefsPanelProps) {
  return (
    <>
      <Switch
        label="Screen mask"
        description="Darkens the screen except for a clear band around what you are reading."
        checked={prefs.readingMask}
        onChange={(on) => set({ readingMask: on }, announce, `Screen mask ${onOff(on)}`)}
      />
      <Stepper
        legend="Clear band height"
        valueLabel={String(prefs.maskSize)}
        canDecrease={prefs.maskSize > 1}
        canIncrease={prefs.maskSize < 3}
        decreaseLabel="Narrower band"
        increaseLabel="Taller band"
        onDecrease={() => set({ maskSize: (prefs.maskSize - 1) as A11yPrefs["maskSize"] }, announce, "Band narrower")}
        onIncrease={() => set({ maskSize: (prefs.maskSize + 1) as A11yPrefs["maskSize"] }, announce, "Band taller")}
      />
    </>
  );
}

export function PageOptionsPanel({ prefs, announce }: PrefsPanelProps) {
  const motionReduced = resolvedAttribute("data-motion") === "reduce";
  return (
    <>
      <Switch
        label="Pause animations"
        checked={motionReduced}
        onChange={(on) => set({ motion: on ? "reduce" : "no-preference" }, announce, `Animations ${on ? "paused" : "on"}`)}
      />
      <Switch label="Hide images" checked={prefs.hideImages} onChange={(on) => set({ hideImages: on }, announce, `Images ${on ? "hidden" : "shown"}`)} />
      <Switch
        label="Highlight links"
        checked={prefs.highlightLinks}
        onChange={(on) => set({ highlightLinks: on }, announce, `Highlight links ${onOff(on)}`)}
      />
    </>
  );
}

interface Outline {
  id: string;
  label: string;
  level: number;
}

function collectOutline(view: "headings" | "landmarks"): Outline[] {
  const selector =
    view === "headings" ? "main :is(h1, h2, h3)" : "header, nav[aria-label], main, footer, section[aria-labelledby]";
  const found = [...document.querySelectorAll<HTMLElement>(selector)].filter((element) => !element.closest(".a11y-toolbar"));
  return found.map((element, index) => {
    // Elements need an id so the outline can move focus to them.
    element.id ||= `outline-${view}-${index}`;
    const labelledBy = element.getAttribute("aria-labelledby");
    const label =
      view === "headings"
        ? element.innerText
        : (element.getAttribute("aria-label") ??
          (labelledBy ? document.getElementById(labelledBy)?.innerText : null) ??
          element.tagName.toLowerCase());
    return { id: element.id, label: label.trim().replace(/\s+/g, " "), level: view === "headings" ? Number(element.tagName[1]) : 1 };
  });
}

export function PageStructurePanel({ onNavigate }: { onNavigate: () => void }) {
  const [view, setView] = useState<"headings" | "landmarks">("headings");
  const [items, setItems] = useState<Outline[]>(() => collectOutline("headings"));

  const go = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    if (!element.hasAttribute("tabindex")) element.setAttribute("tabindex", "-1");
    onNavigate();
    element.focus();
  };

  return (
    <>
      <Choice
        legend="Show"
        name="structure-view"
        value={view}
        columns={2}
        options={[
          { value: "headings", label: "Headings" },
          { value: "landmarks", label: "Regions" },
        ]}
        onChange={(next) => {
          setView(next);
          setItems(collectOutline(next));
        }}
      />
      <ul className="flex max-h-80 flex-col overflow-y-auto">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => go(item.id)}
              className={cn(
                "flex min-h-11 w-full items-center rounded-sm px-2 text-start hover:bg-(--tb-hover)",
                item.level === 1 && "font-bold",
                item.level === 3 && "ps-6 text-sm",
              )}
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

export function HelpPanel() {
  return (
    <dl className="flex flex-col gap-3 text-sm">
      <div>
        <dt className="font-bold">Move between tools</dt>
        <dd className="text-(--tb-muted)">Left and right arrow keys, Home and End.</dd>
      </div>
      <div>
        <dt className="font-bold">Open or close a tool</dt>
        <dd className="text-(--tb-muted)">Enter or Space. Escape closes the open panel.</dd>
      </div>
      <div>
        <dt className="font-bold">Read aloud</dt>
        <dd className="text-(--tb-muted)">Turn on Read aloud, then select any paragraph to start from it.</dd>
      </div>
      <div>
        <dt className="font-bold">Saved settings</dt>
        <dd className="text-(--tb-muted)">Your choices are stored on this device only and apply on every page.</dd>
      </div>
    </dl>
  );
}
