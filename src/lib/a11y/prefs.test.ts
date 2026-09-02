// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { applyPreferences, COLOR_PRESETS, DEFAULT_PREFS, PREFERENCES_INIT_SCRIPT, STORAGE_KEY, TOOLBAR_STORAGE_KEY, toStored } from "./prefs";

afterEach(() => { localStorage.clear(); applyPreferences({}); document.documentElement.removeAttribute("data-toolbar"); });

describe("accessibility preferences", () => {
  it("restores only monochrome when older saved preferences enabled both colour modes", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ grayscale: true, colorPreset: "blue-white" }));
    // oxlint-disable-next-line no-eval -- verifies normalization runs before paint
    window.eval(PREFERENCES_INIT_SCRIPT);
    expect(document.documentElement.getAttribute("data-grayscale")).toBe("true");
    expect(document.documentElement.hasAttribute("data-color-preset")).toBe(false);
  });
  it("restores an open toolbar before paint and falls back safely for corrupt preferences", () => {
    localStorage.setItem(STORAGE_KEY, "invalid JSON");
    localStorage.setItem(TOOLBAR_STORAGE_KEY, "open");
    // oxlint-disable-next-line no-eval -- verifies malformed storage cannot break startup
    window.eval(PREFERENCES_INIT_SCRIPT);
    expect(document.documentElement.getAttribute("data-toolbar")).toBe("open");
    expect(document.documentElement.getAttribute("data-text-scale")).toBe("100");
    expect(document.documentElement.hasAttribute("data-plain-text")).toBe(false);
  });
  it("restores each plain text area before paint and removes the area attribute when disabled", () => {
    for (const textArea of ["small", "medium", "large", "full"] as const) {
      const prefs = applyPreferences({ plainText: true, textArea });
      expect(applyPreferences(toStored(prefs)).textArea).toBe(textArea);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(prefs)));
      // oxlint-disable-next-line no-eval -- verifies the script actually delivered before hydration
      window.eval(PREFERENCES_INIT_SCRIPT);
      expect(document.documentElement.getAttribute("data-text-area")).toBe(textArea);
    }
    expect(applyPreferences({ textArea: "invalid" }).textArea).toBe("small");
    expect(document.documentElement.hasAttribute("data-text-area")).toBe(false);
  });
  it("applies and persists every reference colour and cursor size", () => {
    for (const colorPreset of COLOR_PRESETS) {
      const prefs = applyPreferences({ colorPreset });
      expect(prefs.colorPreset).toBe(colorPreset);
      expect(document.documentElement.getAttribute("data-color-preset")).toBe(colorPreset === "none" ? null : colorPreset);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStored(prefs)));
      applyPreferences({});
      // oxlint-disable-next-line no-eval -- verifies each saved theme is restored before paint
      window.eval(PREFERENCES_INIT_SCRIPT);
      expect(document.documentElement.getAttribute("data-color-preset")).toBe(colorPreset === "none" ? null : colorPreset);
    }
    for (const cursor of ["small", "medium", "large", "x-large"] as const) {
      const prefs = applyPreferences({ cursor, cursorColor: "white" });
      expect(document.documentElement.getAttribute("data-cursor")).toBe(`${cursor}-white`);
      expect(toStored(prefs).cursor).toBe(cursor);
    }
  });

  it("restores mask settings and rejects invalid stored settings", () => {
    const update = { readingMask: true, maskVertical: true, maskEdge: true, maskColor: "red", maskOpacity: 50, maskSize: 5, rulerSize: 5 } as const;
    expect(applyPreferences(toStored(applyPreferences(update)))).toMatchObject(update);
    expect(applyPreferences({ maskColor: "invalid", maskOpacity: 300, maskSize: -1, cursor: "huge" })).toEqual(DEFAULT_PREFS);
  });

  it("keeps pre-paint restoration self-contained", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ colorPreset: "purple-white", cursor: "medium", font: "georgia", maskVertical: true }));
    // oxlint-disable-next-line no-eval -- executes our own pre-paint script to verify serialisation
    window.eval(PREFERENCES_INIT_SCRIPT);
    expect(document.documentElement.getAttribute("data-color-preset")).toBe("purple-white");
    expect(document.documentElement.getAttribute("data-cursor")).toBe("medium-black");
    expect(document.documentElement.getAttribute("data-font")).toBe("georgia");
  });
});
