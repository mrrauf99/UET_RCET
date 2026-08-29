// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { applyPreferences, COLOR_PRESETS, DEFAULT_PREFS, PREFERENCES_INIT_SCRIPT, STORAGE_KEY, toStored } from "./prefs";

afterEach(() => { localStorage.clear(); applyPreferences({}); });

describe("accessibility preferences", () => {
  it("applies and persists every reference colour and cursor size", () => {
    for (const colorPreset of COLOR_PRESETS) {
      const prefs = applyPreferences({ colorPreset });
      expect(prefs.colorPreset).toBe(colorPreset);
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
