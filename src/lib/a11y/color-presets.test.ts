import { describe, expect, it } from "vitest";
import { PRESET_LABELS } from "./color-presets";

function luminance(colour: string) {
  const channels = colour.startsWith("rgb")
    ? colour.match(/\d+/g)!.map(Number)
    : (colour.length === 4 ? colour.slice(1).split("").map((c) => c + c) : colour.slice(1).match(/../g)!).map((c) => Number.parseInt(c, 16));
  const linear = channels.map((c) => {
    const value = c / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

describe("colour theme contrast", () => {
  for (const preset of Object.values(PRESET_LABELS)) {
    it(`${preset.name} meets AA for text and links`, () => {
      const background = luminance(preset.bg);
      for (const colour of [preset.fg, preset.link]) {
        const foreground = luminance(colour);
        const ratio = (Math.max(background, foreground) + 0.05) / (Math.min(background, foreground) + 0.05);
        expect(ratio).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
