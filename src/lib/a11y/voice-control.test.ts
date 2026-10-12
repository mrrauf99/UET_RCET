// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isVoiceControlSupported, startVoiceControl } from "./voice-control";

type RecognitionEventName = "result" | "error" | "end";

class MockRecognition {
  static instances: MockRecognition[] = [];
  static failOnStart = false;
  continuous = false;
  interimResults = true;
  lang = "";
  startCalls = 0;
  stopCalls = 0;
  private listeners = new Map<RecognitionEventName, Array<(event: unknown) => void>>();

  constructor() {
    MockRecognition.instances.push(this);
  }

  addEventListener(type: RecognitionEventName, listener: (event: never) => void) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener as (event: unknown) => void);
    this.listeners.set(type, listeners);
  }

  start() {
    this.startCalls++;
    if (MockRecognition.failOnStart) throw new Error("recognition could not start");
  }

  stop() {
    this.stopCalls++;
  }

  emit(type: RecognitionEventName, event: unknown = {}) {
    for (const listener of this.listeners.get(type) ?? []) listener(event);
  }

  emitResult(transcript: string, isFinal = true) {
    this.emit("result", {
      resultIndex: 0,
      results: [{ isFinal, 0: { transcript } }],
    });
  }
}

function installRecognition(prefix: "SpeechRecognition" | "webkitSpeechRecognition" = "SpeechRecognition") {
  Object.defineProperty(window, prefix, { configurable: true, value: MockRecognition });
  return MockRecognition;
}

function lastRecognition() {
  return MockRecognition.instances.at(-1)!;
}

function visibleElements() {
  Object.defineProperty(HTMLElement.prototype, "offsetParent", {
    configurable: true,
    get() {
      return this.closest("[hidden], [inert]") ? null : document.body;
    },
  });
}

function start() {
  const updates = vi.fn<(message: string) => void>();
  const onStop = vi.fn();
  const stop = startVoiceControl(updates, onStop);
  return { updates, onStop, stop };
}

async function expectLatest(updates: ReturnType<typeof vi.fn<(message: string) => void>>, message: string | RegExp) {
  await vi.waitFor(() => expect(updates).toHaveBeenLastCalledWith(expect.stringMatching(message)));
}

describe("voice control", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    MockRecognition.instances = [];
    MockRecognition.failOnStart = false;
    delete (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition;
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    visibleElements();
    vi.spyOn(window, "scrollBy").mockImplementation(() => {});
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    vi.spyOn(history, "back").mockImplementation(() => {});
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("detects the standard and prefixed recognition APIs and reports unsupported browsers", () => {
    expect(isVoiceControlSupported()).toBe(false);
    installRecognition("webkitSpeechRecognition");
    expect(isVoiceControlSupported()).toBe(true);
    delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
    installRecognition();
    expect(isVoiceControlSupported()).toBe(true);
  });

  it("starts continuous English recognition and announces the listening state", () => {
    installRecognition();
    const { updates, onStop, stop } = start();
    const recognition = lastRecognition();

    expect(stop).toEqual(expect.any(Function));
    expect(recognition).toMatchObject({ continuous: true, interimResults: false, lang: "en-GB", startCalls: 1 });
    expect(updates).toHaveBeenCalledWith("Listening… say a command");
    expect(onStop).not.toHaveBeenCalled();
  });

  it("returns null and resets the listening state when startup throws", () => {
    installRecognition();
    MockRecognition.failOnStart = true;
    const { updates, onStop, stop } = start();

    expect(stop).toBeNull();
    expect(updates).not.toHaveBeenCalled();
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("ignores interim transcripts and executes only final results", async () => {
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("scroll down", false);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(window.scrollBy).not.toHaveBeenCalled();
    expect(updates).toHaveBeenCalledTimes(1);
    lastRecognition().emitResult("scroll down");
    await expectLatest(updates, "Done: scroll down");
    expect(window.scrollBy).toHaveBeenCalledWith({ top: window.innerHeight * 0.8 });
  });

  it.each([
    ["scroll up", { top: -0.8 }],
    ["scroll down", { top: 0.8 }],
  ])("scroll command %s uses most of the viewport", async (phrase, expected) => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 1000 });
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult(phrase);
    await expectLatest(updates, `Done: ${phrase}`);
    expect(window.scrollBy).toHaveBeenCalledWith({ top: expected.top * 1000 });
  });

  it.each([
    ["go to top", 0],
    ["go to bottom", 2500],
  ])("%s scrolls to the requested page edge", async (phrase, top) => {
    Object.defineProperty(document.body, "scrollHeight", { configurable: true, value: 2500 });
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult(phrase);
    await expectLatest(updates, `Done: ${phrase}`);
    expect(window.scrollTo).toHaveBeenCalledWith({ top });
  });

  it("moves focus forward and backward across visible, enabled controls", async () => {
    document.body.innerHTML = '<button id="first">First</button><button disabled>Disabled</button><a href="/last" id="last">Last</a><button hidden>Hidden</button>';
    installRecognition();
    const { updates } = start();

    lastRecognition().emitResult("next");
    await expectLatest(updates, "Done: next");
    expect(document.activeElement?.id).toBe("first");
    lastRecognition().emitResult("next");
    await expectLatest(updates, "Done: next");
    expect(document.activeElement?.id).toBe("last");
    lastRecognition().emitResult("next");
    await expectLatest(updates, "Done: next");
    expect(document.activeElement?.id).toBe("first");
    lastRecognition().emitResult("previous");
    await expectLatest(updates, "Done: previous");
    expect(document.activeElement?.id).toBe("last");
  });

  it("returns to the previous browser history entry", async () => {
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("go back");
    await expectLatest(updates, "Done: go back");
    expect(history.back).toHaveBeenCalledOnce();
  });

  it("clicks links and buttons by normalized accessible name", async () => {
    document.body.innerHTML = '<button aria-label="École Admissions">Open</button>';
    const button = document.querySelector("button")!;
    const clicked = vi.fn();
    button.addEventListener("click", clicked);
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("click ecole admissions!!!");
    await expectLatest(updates, "Clicked ecole admissions");
    expect(clicked).toHaveBeenCalledOnce();
  });

  it("reports a clear result when a link or button cannot be found", async () => {
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("click missing action");
    await expectLatest(updates, "No link or button called");
  });

  it("chooses a matching option and emits a bubbling change event", async () => {
    document.body.innerHTML = '<label for="program">Program</label><select id="program"><option value="">Choose one</option><option value="cs">Computer Science</option><option value="me">Mechanical Engineering</option></select>';
    const select = document.querySelector("select")!;
    const change = vi.fn();
    select.addEventListener("change", change);
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("select computer science");
    await expectLatest(updates, "Selected Computer Science");

    expect(select.value).toBe("cs");
    expect(document.activeElement).toBe(select);
    expect(change).toHaveBeenCalledOnce();
    expect(change.mock.calls[0][0].bubbles).toBe(true);
  });

  it("uses the focused dropdown when matching option names exist in multiple dropdowns", async () => {
    document.body.innerHTML = '<select aria-label="First"><option value="cs">Computer Science</option><option value="me">Mechanical Engineering</option></select><select aria-label="Second"><option value="cs2">Computer Science</option><option value="ee">Electrical Engineering</option></select>';
    const selects = document.querySelectorAll("select");
    selects[1].focus();
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("choose computer science");
    await expectLatest(updates, "Selected Computer Science");
    expect(selects[0].value).toBe("cs");
    expect(selects[1].value).toBe("cs2");
  });

  it("asks for a more specific option when several approximate matches exist", async () => {
    document.body.innerHTML = '<select aria-label="Program"><option value="cse">Computer Science Engineering</option><option value="cs">Computer Science Technology</option></select>';
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("select computer science");
    await expectLatest(updates, "Several options match");
    expect(document.querySelector("select")?.value).toBe("cse");
  });

  it("asks which dropdown to use if multiple selects contain the requested option", async () => {
    document.body.innerHTML = '<select aria-label="First"><option value="cs">Computer Science</option></select><select aria-label="Second"><option value="cs2">Computer Science</option></select>';
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("select computer science");
    await expectLatest(updates, "More than one dropdown");
    expect([...document.querySelectorAll("select")].map(({ value }) => value)).toEqual(["cs", "cs2"]);
  });

  it("does not match options in hidden or inert dropdowns", async () => {
    document.body.innerHTML = '<select aria-label="Program" hidden><option value="cs">Computer Science</option></select>';
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("select computer science");
    await expectLatest(updates, "No dropdown option called");
  });

  it("opens a dropdown with showPicker when the browser permits it", async () => {
    document.body.innerHTML = '<select aria-label="Program"><option>Choose one</option><option>Computer Science</option></select>';
    const select = document.querySelector("select")!;
    const showPicker = vi.fn();
    Object.defineProperty(select, "showPicker", { configurable: true, value: showPicker });
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("open program dropdown");
    await expectLatest(updates, "Opened Program options");
    expect(showPicker).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(select);
  });

  it("falls back to an expanded inline dropdown if showPicker lacks user activation", async () => {
    document.body.innerHTML = '<select aria-label="Program"><option>Choose one</option><option>Computer Science</option><option>Mechanical Engineering</option></select>';
    const select = document.querySelector("select")!;
    Object.defineProperty(select, "showPicker", { configurable: true, value: () => { throw new DOMException("Not allowed", "NotAllowedError"); } });
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("click program dropdown");
    await expectLatest(updates, "Say “select” and the option name");
    expect(select.size).toBe(3);
    expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalledOnce();
    select.dispatchEvent(new Event("change"));
    expect(select.size).toBe(1);
  });

  it("reports missing dropdowns and missing options", async () => {
    document.body.innerHTML = '<button>Admissions</button>';
    installRecognition();
    const { updates } = start();
    lastRecognition().emitResult("show program");
    await expectLatest(updates, "No dropdown called");
    lastRecognition().emitResult("choose chemistry");
    await expectLatest(updates, "No dropdown option called");
  });

  it("ignores routine no-speech and aborted errors", () => {
    installRecognition();
    const { updates, onStop } = start();
    const recognition = lastRecognition();
    recognition.emit("error", { error: "no-speech" });
    recognition.emit("error", { error: "aborted" });

    expect(updates).toHaveBeenCalledTimes(1);
    expect(onStop).not.toHaveBeenCalled();
  });

  it.each([
    ["not-allowed", "Microphone access was blocked"],
    ["service-not-allowed", "Voice control is not allowed in this browser"],
    ["audio-capture", "No microphone was found"],
    ["network", "Voice control needs an internet connection"],
    ["language-not-supported", "Voice control does not support English in this browser"],
    ["unknown", "Voice control stopped because of an error. Try again."],
  ])("stops on %s and reports the matching explanation", (error, message) => {
    installRecognition();
    const { updates, onStop } = start();
    const recognition = lastRecognition();
    recognition.emit("error", { error });

    expect(updates).toHaveBeenLastCalledWith(message);
    expect(recognition.stopCalls).toBe(1);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("restarts after the browser ends a continuous session and stops if restart fails", () => {
    installRecognition();
    const { updates, onStop } = start();
    const recognition = lastRecognition();
    recognition.emit("end");
    expect(recognition.startCalls).toBe(2);

    MockRecognition.failOnStart = true;
    recognition.emit("end");
    expect(updates).toHaveBeenLastCalledWith("Voice control stopped. Try again.");
    expect(onStop).toHaveBeenCalledOnce();
    expect(recognition.stopCalls).toBe(1);
  });

  it("does not restart after the user stops listening", () => {
    installRecognition();
    const { onStop, stop } = start();
    const recognition = lastRecognition();
    stop?.();
    recognition.emit("end");

    expect(recognition.stopCalls).toBe(1);
    expect(recognition.startCalls).toBe(1);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("stops recognition when the spoken stop command is received", async () => {
    installRecognition();
    const { updates, onStop } = start();
    const recognition = lastRecognition();
    recognition.emitResult("stop listening");
    await expectLatest(updates, "Voice control off");

    expect(recognition.stopCalls).toBe(1);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("reports unrecognized commands without stopping the session", async () => {
    installRecognition();
    const { updates, onStop } = start();
    lastRecognition().emitResult("turn on the lights");
    await expectLatest(updates, "Not recognised");
    expect(onStop).not.toHaveBeenCalled();
    expect(lastRecognition().stopCalls).toBe(0);
  });
});
