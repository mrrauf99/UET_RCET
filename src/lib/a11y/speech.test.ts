// @vitest-environment jsdom
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SPEECH_OPTIONS, useTextToSpeech, type SpeechOptions } from "./speech";

class Utterance extends EventTarget {
  text: string;
  lang = "";
  rate = 1;
  voice: SpeechSynthesisVoice | null = null;
  onend: (() => void) | null = null;
  onboundary: ((event: { charIndex: number }) => void) | null = null;
  constructor(text: string) { super(); this.text = text; }
}

let root: Root;
let api: ReturnType<typeof useTextToSpeech>;
let spoken: Utterance[];
let options: SpeechOptions;
let installedVoices: SpeechSynthesisVoice[];
let wordHighlights: Map<string, { ranges: Range[] }>;

class HighlightMock {
  ranges: Range[];
  constructor(...ranges: Range[]) { this.ranges = ranges; }
}

function Harness() { const speech = useTextToSpeech(options); useEffect(() => { api = speech; }); return null; }
function run(action: () => void) { act(() => { action(); vi.advanceTimersByTime(100); }); }
function last() { return spoken[spoken.length - 1]; }

beforeEach(() => {
  vi.useFakeTimers();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.cookie = "rcet_translation_language=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  document.body.innerHTML = '<main><h1>Title.</h1><p id="first">First sentence. Second sentence.</p><p id="last">Last paragraph.</p></main><div id="root"></div>';
  Object.defineProperty(HTMLElement.prototype, "innerText", { configurable: true, get() { return this.textContent; } });
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{ width: 100, height: 20 }] as unknown as DOMRectList);
  HTMLElement.prototype.scrollIntoView = vi.fn();
  spoken = [];
  installedVoices = [{ name: "Microsoft David", lang: "en-US", default: false }, { name: "Microsoft Zira", lang: "en-US", default: true }] as SpeechSynthesisVoice[];
  wordHighlights = new Map();
  options = { ...DEFAULT_SPEECH_OPTIONS, autoPlay: false };
  vi.stubGlobal("SpeechSynthesisUtterance", Utterance);
  vi.stubGlobal("Highlight", HighlightMock);
  vi.stubGlobal("CSS", { highlights: wordHighlights });
  vi.stubGlobal("speechSynthesis", {
    cancel: vi.fn(), speak: (utterance: Utterance) => spoken.push(utterance),
    getVoices: () => installedVoices,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  });
  root = createRoot(document.getElementById("root")!);
  act(() => root.render(createElement(Harness)));
});

afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Text to Speech transport", () => {
  it("enables automatic playback by default", () => {
    expect(DEFAULT_SPEECH_OPTIONS.autoPlay).toBe(true);
  });

  it("reads header, footer and standalone text, switching targets without scrolling", () => {
    document.body.insertAdjacentHTML("afterbegin", '<header><a id="nav-text" href="/">Home navigation</a></header><div id="plain-text">Standalone text</div><footer><span id="footer-text">Contact the college</span></footer>');
    options = { ...options, autoPlay: true };
    act(() => root.render(createElement(Harness)));
    run(() => api.readHovered(document.getElementById("nav-text")!));
    expect(last().text).toBe("Home navigation");
    const cancelled = last();
    run(() => api.readHovered(document.getElementById("footer-text")!));
    expect(last().text).toBe("Contact the college");
    const count = spoken.length;
    run(() => api.readHovered(document.getElementById("footer-text")!));
    expect(spoken).toHaveLength(count);
    run(() => cancelled.onend?.());
    expect(spoken).toHaveLength(count);
    run(() => api.readHovered(document.getElementById("plain-text")!));
    expect(last().text).toBe("Standalone text");
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    run(api.reset);
    run(() => api.readHovered(document.getElementById("plain-text")!));
    expect(spoken).toHaveLength(count + 2);
  });

  it("ignores hidden text, editable fields and the accessibility toolbar", () => {
    document.body.insertAdjacentHTML("beforeend", '<div hidden><p id="hidden-text">Hidden</p></div><div class="a11y-toolbar"><button id="toolbar-text">Toolbar</button></div><div contenteditable="true" id="editable-text">Draft</div>');
    options = { ...options, autoPlay: true };
    act(() => root.render(createElement(Harness)));
    for (const id of ["hidden-text", "toolbar-text", "editable-text"]) run(() => api.readHovered(document.getElementById(id)!));
    expect(spoken).toHaveLength(0);
  });

  it("selects a paragraph without autoplay, then reads it when Play is pressed", () => {
    run(() => api.readFrom(document.getElementById("first")!));
    expect(api.status).toBe("paused");
    expect(spoken).toHaveLength(0);
    run(api.togglePlay);
    expect(last().text).toBe("First sentence.");
  });

  it("highlights hovered text without speech or scrolling until Play", () => {
    run(() => api.readHovered(document.getElementById("first")!));
    expect(document.querySelector("[data-tts-active]")?.id).toBe("first");
    expect(spoken).toHaveLength(0);
    expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
    run(api.togglePlay); expect(last().text).toBe("First sentence.");
  });

  it("moves the visual highlight to each spoken word and clears it on reset", () => {
    options = { ...options, autoPlay: true };
    act(() => root.render(createElement(Harness)));
    run(() => api.readFrom(document.getElementById("first")!));
    run(() => last().onboundary?.({ charIndex: 0 }));
    expect(wordHighlights.get("rcet-tts-word")?.ranges[0]?.toString()).toBe("First");
    expect(document.getElementById("first")?.hasAttribute("data-tts-word-active")).toBe(true);

    run(() => last().onboundary?.({ charIndex: 6 }));
    expect(wordHighlights.get("rcet-tts-word")?.ranges[0]?.toString()).toBe("sentence.");

    run(api.reset);
    expect(wordHighlights.has("rcet-tts-word")).toBe(false);
    expect(document.getElementById("first")?.hasAttribute("data-tts-word-active")).toBe(false);
  });

  it("selects Next and Back silently, cancels playing speech, and clamps boundaries", () => {
    run(api.play);
    const started = spoken.length;
    run(api.nextBlock);
    expect(api.playing).toBe(false);
    expect(spoken).toHaveLength(started);
    expect(document.querySelector("[data-tts-active]")?.id).toBe("first");
    run(api.togglePlay); expect(last().text).toBe("First sentence.");
    run(api.nextBlock); run(api.nextBlock);
    expect(document.querySelector("[data-tts-active]")?.id).toBe("last");
    run(api.togglePlay); expect(last().text).toBe("Last paragraph.");
    run(api.previousBlock); run(api.previousBlock); run(api.previousBlock);
    run(api.togglePlay); expect(last().text).toBe("Title.");
  });

  it("stops after the selected block unless whole-page reading is enabled", () => {
    run(api.play);
    run(() => last().onend?.());
    expect(api.status).toBe("idle");
    options = { ...options, wholePage: true };
    act(() => root.render(createElement(Harness)));
    run(api.play); run(() => last().onend?.());
    expect(last().text).toBe("First sentence.");
    run(() => last().onend?.()); expect(last().text).toBe("Second sentence.");
    run(() => last().onend?.()); expect(last().text).toBe("Last paragraph.");
  });

  it("uses autoplay, the selected voice, and reading speed", () => {
    options = { ...options, autoPlay: true, voice: "male", rate: 1.4 };
    act(() => root.render(createElement(Harness)));
    run(() => api.readFrom(document.getElementById("first")!));
    expect(api.playing).toBe(true);
    expect(last().voice?.name).toBe("Microsoft David");
    expect(last().rate).toBe(1.4);
    run(api.nextBlock); expect(last().text).toBe("Last paragraph.");
    run(api.previousBlock); expect(last().text).toBe("First sentence.");
  });

  it("uses the selected English region and the matching browser voice", () => {
    document.cookie = "rcet_translation_language=en-GB; path=/";
    installedVoices = [
      { name: "Microsoft English US", lang: "en-US", default: true },
      { name: "Microsoft English UK", lang: "en-GB", default: false },
    ] as SpeechSynthesisVoice[];
    options = { ...options, autoPlay: true };
    act(() => root.render(createElement(Harness)));

    run(() => api.readFrom(document.getElementById("first")!));

    expect(last().voice?.name).toBe("Microsoft English UK");
    expect(last().lang).toBe("en-GB");
  });

  it("blocks Text to Speech on translated pages without requesting server audio", async () => {
    document.body.innerHTML = '<main><p id="translated">Translated page content.</p></main><div id="root"></div>';
    document.cookie = "googtrans=/en/ar; path=/";
    document.cookie = "rcet_translation_language=ar; path=/";
    options = { ...options, autoPlay: true };
    act(() => root.render(createElement(Harness)));

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    run(() => api.readFrom(document.getElementById("translated")!));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(spoken).toHaveLength(0);
    expect(api.playing).toBe(false);
    expect(api.error).toContain("available only when the page is in English");
  });
  it("seeks forwards and backwards within a long paragraph", () => {
    document.getElementById("first")!.textContent = Array.from({ length: 80 }, (_, index) => `word${index}`).join(" ");
    run(() => api.readFrom(document.getElementById("first")!));
    run(api.forward); expect(last().text.startsWith("word25 ")).toBe(true);
    run(api.rewind); expect(last().text.startsWith("word0 ")).toBe(true);
  });

  it("ignores cancelled speech callbacks and clears highlights on reset", () => {
    run(api.play); const cancelled = last();
    run(api.nextBlock); run(api.togglePlay); const current = last();
    run(() => cancelled.onend?.()); expect(last()).toBe(current);
    run(api.reset);
    expect(api.status).toBe("idle");
    expect(document.querySelector("[data-tts-active]")).toBeNull();
  });

  it("reports a speech engine failure rather than leaving Play stuck", () => {
    run(api.play);
    run(() => last().dispatchEvent(Object.assign(new Event("error"), { error: "synthesis-failed" })));
    expect(api.playing).toBe(false);
    expect(api.error).toContain("Speech could not play");
  });
});
