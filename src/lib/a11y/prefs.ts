export const STORAGE_KEY = "rcet:a11y:v1";
export const TOOLBAR_STORAGE_KEY = "rcet:a11y:toolbar";

export const TEXT_SCALES = [87.5, 100, 112.5, 125, 150, 175, 200] as const;
export const LINE_HEIGHTS = [0, 1.8, 2.2, 2.6] as const;
export const LETTER_SPACINGS = [0, 0.06, 0.12, 0.2] as const;
const FONTS = ["default", "lexend", "arial", "verdana", "comic-sans", "georgia", "tahoma", "lato", "trebuchet", "open-dyslexic"] as const;
export const COLOR_PRESETS = ["none", "black-white", "black-yellow", "green-white", "blue-white", "orange-white", "blue-yellow", "dark-grey-light-grey", "grey-white", "purple-white", "dark-red-white", "off-white-black", "grey-dark-grey", "cream-black", "yellow-black", "yellow-blue", "white-red", "white-brown", "white-green", "white-blue", "white-black"] as const;
export const RULER_COLORS = ["black", "blue", "green", "red", "orange", "grey", "teal", "cream", "yellow", "white"] as const;
export const RULER_SWATCHES: Record<(typeof RULER_COLORS)[number], string> = {
  red: "#990000",
  blue: "#003366",
  yellow: "#ffeb3b",
  green: "#006600",
  black: "#000000",
  orange: "#bd3f1e",
  grey: "#333333",
  teal: "#008080",
  cream: "#ffebc1",
  white: "#ffffff",
};

export interface A11yPrefs {
  theme: "system" | "light" | "dark";
  contrast: "system" | "default" | "more";
  grayscale: boolean;
  /** Overrides theme and contrast with a fixed background/text pair. */
  colorPreset: (typeof COLOR_PRESETS)[number];
  textScale: (typeof TEXT_SCALES)[number];
  /** 0 keeps the design's own line height. */
  lineHeight: (typeof LINE_HEIGHTS)[number];
  /** In em; 0 keeps the design's own spacing. */
  letterSpacing: (typeof LETTER_SPACINGS)[number];
  font: (typeof FONTS)[number];
  highlightLinks: boolean;
  hideImages: boolean;
  imageDescriptions: boolean;
  plainText: boolean;
  motion: "system" | "reduce" | "no-preference";
  cursor: "default" | "small" | "medium" | "large" | "x-large";
  cursorColor: "black" | "white";
  readingGuide: boolean;
  rulerColor: (typeof RULER_COLORS)[number];
  rulerSize: 1 | 2 | 3 | 4 | 5;
  rulerMarkings: boolean;
  rulerOpacity: 25 | 50 | 75 | 100;
  readingMask: boolean;
  maskSize: 1 | 2 | 3 | 4 | 5;
  maskVertical: boolean;
  maskEdge: boolean;
  maskColor: (typeof RULER_COLORS)[number];
  maskOpacity: 25 | 50 | 75 | 100;
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
  imageDescriptions: false,
  plainText: false,
  motion: "system",
  cursor: "default",
  cursorColor: "black",
  readingGuide: false,
  rulerColor: "teal",
  rulerSize: 1,
  rulerMarkings: false,
  rulerOpacity: 100,
  readingMask: false,
  maskSize: 1,
  maskVertical: false,
  maskEdge: false,
  maskColor: "teal",
  maskOpacity: 100,
  focusText: false,
  toolbarDark: false,
};

/**
 * Keep self-contained: this function is serialized into the pre-paint script.
 * Imports, outer-scope helpers and transpiled spread helpers would be unavailable there.
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
      ["none", "black-white", "black-yellow", "green-white", "blue-white", "orange-white", "blue-yellow", "dark-grey-light-grey", "grey-white", "purple-white", "dark-red-white", "off-white-black", "grey-dark-grey", "cream-black", "yellow-black", "yellow-blue", "white-red", "white-brown", "white-green", "white-blue", "white-black"] as const,
      "none",
    ),
    textScale: pick(source.textScale, [87.5, 100, 112.5, 125, 150, 175, 200] as const, 100),
    lineHeight: pick(source.lineHeight, [0, 1.8, 2.2, 2.6] as const, 0),
    letterSpacing: pick(source.letterSpacing, [0, 0.06, 0.12, 0.2] as const, 0),
    font: pick(source.font, ["default", "lexend", "arial", "verdana", "comic-sans", "georgia", "tahoma", "lato", "trebuchet", "open-dyslexic"] as const, "default"),
    highlightLinks: source.highlightLinks === true,
    hideImages: source.hideImages === true,
    imageDescriptions: source.imageDescriptions === true,
    plainText: source.plainText === true,
    motion: pick(source.motion, ["system", "reduce", "no-preference"] as const, "system"),
    cursor: pick(source.cursor, ["default", "small", "medium", "large", "x-large"] as const, "default"),
    cursorColor: pick(source.cursorColor, ["black", "white"] as const, "black"),
    readingGuide: source.readingGuide === true,
    rulerColor: pick(source.rulerColor, ["black", "blue", "green", "red", "orange", "grey", "teal", "cream", "yellow", "white"] as const, "teal"),
    rulerSize: pick(source.rulerSize, [1, 2, 3, 4, 5] as const, 1),
    rulerMarkings: source.rulerMarkings === true,
    rulerOpacity: pick(source.rulerOpacity, [25, 50, 75, 100] as const, 100),
    readingMask: source.readingMask === true,
    maskSize: pick(source.maskSize, [1, 2, 3, 4, 5] as const, 1),
    maskVertical: source.maskVertical === true,
    maskEdge: source.maskEdge === true,
    maskColor: pick(source.maskColor, ["black", "blue", "green", "red", "orange", "grey", "teal", "cream", "yellow", "white"] as const, "teal"),
    maskOpacity: pick(source.maskOpacity, [25, 50, 75, 100] as const, 100),
    focusText: source.focusText === true,
    toolbarDark: source.toolbarDark === true,
  };
  // Older saved settings could combine both modes; restore only monochrome.
  if (prefs.grayscale) prefs.colorPreset = "none";
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
  set("data-plain-text", prefs.plainText ? "true" : null);
  set("data-cursor", prefs.cursor === "default" ? null : prefs.cursor + "-" + prefs.cursorColor);

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
)})||"{}")}catch(e){}try{(${applyPreferences.toString()})(raw)}catch(e){}try{if(localStorage.getItem(${JSON.stringify(TOOLBAR_STORAGE_KEY)})==="open")document.documentElement.setAttribute("data-toolbar","open")}catch(e){}})();`;
