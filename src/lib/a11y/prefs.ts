export const STORAGE_KEY = "rcet:a11y:v1";

export const TEXT_SCALES = [87.5, 100, 112.5, 125, 150, 175, 200] as const;
export const LINE_HEIGHTS = [0, 1.8, 2.2, 2.6] as const;
export const LETTER_SPACINGS = [0, 0.06, 0.12, 0.2] as const;
export const FONTS = ["default", "arial", "verdana", "georgia"] as const;
export const COLOR_PRESETS = ["none", "black-white", "black-yellow", "blue-yellow", "cream-black", "yellow-black", "white-blue"] as const;
export const RULER_COLORS = ["red", "blue", "yellow", "green", "black"] as const;

export interface A11yPrefs {
  theme: "system" | "light" | "dark";
  contrast: "system" | "default" | "more";
  grayscale: boolean;
  /** Fixed background/text pair that overrides theme and contrast; every pair is at least 11:1. */
  colorPreset: (typeof COLOR_PRESETS)[number];
  textScale: (typeof TEXT_SCALES)[number];
  /** 0 keeps the design's own line height. */
  lineHeight: (typeof LINE_HEIGHTS)[number];
  /** In em; 0 keeps the design's own spacing. */
  letterSpacing: (typeof LETTER_SPACINGS)[number];
  font: (typeof FONTS)[number];
  highlightLinks: boolean;
  hideImages: boolean;
  motion: "system" | "reduce" | "no-preference";
  cursor: "default" | "large" | "x-large";
  cursorColor: "black" | "white";
  readingGuide: boolean;
  rulerColor: (typeof RULER_COLORS)[number];
  rulerSize: 1 | 2 | 3 | 4;
  readingMask: boolean;
  maskSize: 1 | 2 | 3;
  focusText: boolean;
  toolbarDark: boolean;
}

export const DEFAULT_PREFS: A11yPrefs = {
  theme: "system",
  contrast: "system",
  grayscale: false,
  colorPreset: "none",
  textScale: 100,
  lineHeight: 0,
  letterSpacing: 0,
  font: "default",
  highlightLinks: false,
  hideImages: false,
  motion: "system",
  cursor: "default",
  cursorColor: "black",
  readingGuide: false,
  rulerColor: "red",
  rulerSize: 2,
  readingMask: false,
  maskSize: 2,
  focusText: false,
  toolbarDark: false,
};

/**
 * Validates raw stored preferences, writes the resolved data-* attributes to <html>,
 * and returns the clean preferences.
 *
 * Must stay self-contained (no imports, outer-scope references, spread or helpers): its source is
 * serialised into the pre-paint inline script, so the script and the toolbar share one implementation.
 */
export function applyPreferences(raw: unknown): A11yPrefs {
  const source = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- must stay inside for serialisation
  const pick = function <T>(value: unknown, allowed: readonly T[], fallback: T): T {
    return allowed.indexOf(value as T) > -1 ? (value as T) : fallback;
  };
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- must stay inside for serialisation
  const media = function (query: string): boolean {
    return typeof window.matchMedia === "function" && window.matchMedia(query).matches;
  };
  const prefs: A11yPrefs = {
    theme: pick(source.theme, ["system", "light", "dark"] as const, "system"),
    contrast: pick(source.contrast, ["system", "default", "more"] as const, "system"),
    grayscale: source.grayscale === true,
    colorPreset: pick(
      source.colorPreset,
      ["none", "black-white", "black-yellow", "blue-yellow", "cream-black", "yellow-black", "white-blue"] as const,
      "none",
    ),
    textScale: pick(source.textScale, [87.5, 100, 112.5, 125, 150, 175, 200] as const, 100),
    lineHeight: pick(source.lineHeight, [0, 1.8, 2.2, 2.6] as const, 0),
    letterSpacing: pick(source.letterSpacing, [0, 0.06, 0.12, 0.2] as const, 0),
    font: pick(source.font, ["default", "arial", "verdana", "georgia"] as const, "default"),
    highlightLinks: source.highlightLinks === true,
    hideImages: source.hideImages === true,
    motion: pick(source.motion, ["system", "reduce", "no-preference"] as const, "system"),
    cursor: pick(source.cursor, ["default", "large", "x-large"] as const, "default"),
    cursorColor: pick(source.cursorColor, ["black", "white"] as const, "black"),
    readingGuide: source.readingGuide === true,
    rulerColor: pick(source.rulerColor, ["red", "blue", "yellow", "green", "black"] as const, "red"),
    rulerSize: pick(source.rulerSize, [1, 2, 3, 4] as const, 2),
    readingMask: source.readingMask === true,
    maskSize: pick(source.maskSize, [1, 2, 3] as const, 2),
    focusText: source.focusText === true,
    toolbarDark: source.toolbarDark === true,
  };
  const root = document.documentElement;
  const set = function (name: string, value: string | null) {
    if (value === null) root.removeAttribute(name);
    else root.setAttribute(name, value);
  };

  set(
    "data-theme",
    prefs.theme === "system" ? (media("(prefers-color-scheme: dark)") ? "dark" : "light") : prefs.theme,
  );
  set(
    "data-contrast",
    prefs.contrast === "system" ? (media("(prefers-contrast: more)") ? "more" : "default") : prefs.contrast,
  );
  set(
    "data-motion",
    prefs.motion === "system" ? (media("(prefers-reduced-motion: reduce)") ? "reduce" : "no-preference") : prefs.motion,
  );
  set("data-grayscale", prefs.grayscale ? "true" : null);
  set("data-color-preset", prefs.colorPreset === "none" ? null : prefs.colorPreset);
  set("data-text-scale", String(prefs.textScale));
  set("data-line-height", prefs.lineHeight ? String(prefs.lineHeight) : null);
  set("data-letter-spacing", prefs.letterSpacing ? String(prefs.letterSpacing) : null);
  set("data-font", prefs.font === "default" ? null : prefs.font);
  set("data-links", prefs.highlightLinks ? "highlight" : null);
  set("data-images", prefs.hideImages ? "hidden" : null);
  set("data-cursor", prefs.cursor === "default" ? null : prefs.cursor + "-" + prefs.cursorColor);
  set("data-guide", prefs.readingGuide ? "on" : null);
  set("data-mask", prefs.readingMask ? "on" : null);

  return prefs;
}

/** Only non-default values are stored, so new defaults reach returning visitors. */
export function toStored(prefs: A11yPrefs): Partial<A11yPrefs> {
  const stored: Partial<A11yPrefs> = {};
  for (const key of Object.keys(prefs) as (keyof A11yPrefs)[]) {
    if (prefs[key] !== DEFAULT_PREFS[key]) Object.assign(stored, { [key]: prefs[key] });
  }
  return stored;
}

/** Runs during HTML parsing, before first paint, so saved preferences never flash. */
export const PREFERENCES_INIT_SCRIPT = `(function(){var raw={};try{raw=JSON.parse(localStorage.getItem(${JSON.stringify(
  STORAGE_KEY,
)})||"{}")}catch(e){}try{(${applyPreferences.toString()})(raw)}catch(e){}})();`;
