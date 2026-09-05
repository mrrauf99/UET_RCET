import { describe, expect, it } from "vitest";
import { speechChunks } from "./audio-text.mjs";

describe("Speech phrasing", () => {
  it("keeps complete sentences together", () => {
    expect(speechChunks("Welcome to RCET.\nPlease explore our engineering programs!")).toEqual(["Welcome to RCET.", "Please explore our engineering programs!"]);
  });

  it("preserves every word of a passage longer than the model context", () => {
    const text = "Explore our engineering programs and meet our students ".repeat(40).trim();
    const chunks = speechChunks(text);
    expect(chunks.length).toBeGreaterThan(5);
    expect(chunks.every((chunk: string) => chunk.length <= 240)).toBe(true);
    expect(chunks.join(" ")).toBe(text);
  });

  it("splits a long sentence at a clause when possible", () => {
    const first = "Our students learn in practical laboratories and work together on engineering projects,";
    const text = `${first} ${"with guidance from experienced teachers ".repeat(5).trim()}`;
    expect(speechChunks(text, 120)[0]).toBe(first);
  });
});
