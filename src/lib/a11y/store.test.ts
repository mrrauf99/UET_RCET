// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STORAGE_KEY, TOOLBAR_STORAGE_KEY } from "./prefs";

beforeEach(() => { vi.resetModules(); localStorage.clear(); document.body.innerHTML = ""; });
afterEach(() => { vi.restoreAllMocks(); localStorage.clear(); document.documentElement.removeAttribute("data-toolbar"); });

describe("colour preference lifecycle", () => {
  it("keeps the chosen theme when closing and restores focus after reopening a saved toolbar", async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ colorPreset: "black-yellow" }));
    localStorage.setItem(TOOLBAR_STORAGE_KEY, "open");
    const trigger = document.createElement("button");
    trigger.dataset.a11yTrigger = "floating";
    document.body.append(trigger);
    const { closeToolbar } = await import("./store");
    closeToolbar();
    expect(document.activeElement).toBe(trigger);
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ colorPreset: "black-yellow" });
    expect(localStorage.getItem(TOOLBAR_STORAGE_KEY)).toBeNull();
  });

  it("changes colour settings without resetting reading preferences", async () => {
    const { updatePrefs } = await import("./store");
    updatePrefs({ colorPreset: "blue-white", textScale: 150, readingGuide: true });
    updatePrefs({ grayscale: true });
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toMatchObject({ grayscale: true, textScale: 150, readingGuide: true });
    expect(document.documentElement.hasAttribute("data-color-preset")).toBe(false);
    updatePrefs({ colorPreset: "purple-white" });
    expect(document.documentElement.hasAttribute("data-grayscale")).toBe(false);
    expect(document.documentElement.getAttribute("data-color-preset")).toBe("purple-white");
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual({ colorPreset: "purple-white", textScale: 150, readingGuide: true });
  });

  it("continues applying themes when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
    const { updatePrefs } = await import("./store");
    expect(() => updatePrefs({ colorPreset: "purple-white" })).not.toThrow();
    expect(document.documentElement.getAttribute("data-color-preset")).toBe("purple-white");
  });
});
