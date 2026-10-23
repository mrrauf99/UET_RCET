// @vitest-environment jsdom
import { act, createElement, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AUDIO_CREATING_MESSAGE, AUDIO_SELECT_MESSAGE, selectedAudioText, useAudioDownload } from "./audio-download";
import { DEFAULT_SPEECH_OPTIONS } from "./speech";

let root: Root;
let api: ReturnType<typeof useAudioDownload>;
let resolveResponse: (response: Response) => void;
const stopSpeech = vi.fn();
const click = vi.fn();
function Harness() {
  const download = useAudioDownload(DEFAULT_SPEECH_OPTIONS, stopSpeech);
  useEffect(() => { api = download; });
  return null;
}
function select(id = "passage", start = 0, end?: number) {
  const node = document.getElementById(id)!.firstChild!;
  const range = document.createRange();
  range.setStart(node, start);
  range.setEnd(node, end ?? node.textContent!.length);
  window.getSelection()!.removeAllRanges();
  window.getSelection()!.addRange(range);
}
async function complete() {
  await act(async () => { resolveResponse(new Response("mp3", { headers: { "Content-Type": "audio/mpeg" } })); });
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  document.body.innerHTML = '<main><p id="passage">Read this selected passage.</p></main><section class="a11y-toolbar"><span id="tool">Toolbar text</span></section><div id="root"></div>';
  document.documentElement.lang = "en";
  document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = "rcet_translation_language=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  window.getSelection()!.removeAllRanges();
  vi.stubGlobal("fetch", vi.fn(() => new Promise<Response>((resolve) => { resolveResponse = resolve; })));
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:audio") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(click);
  root = createRoot(document.getElementById("root")!);
  act(() => root.render(createElement(Harness)));
});
afterEach(() => { act(() => root.unmount()); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("Download Audio", () => {
  it("downloads only the selected words and preserves selection when clicking the toolbar collapses it", async () => {
    select("passage", 5, 9);
    act(api.captureSelection);
    window.getSelection()!.removeAllRanges();
    act(api.download);
    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(request!.body as string)).toEqual({ text: "this", voice: "female", rate: 1, language: "en" });
    expect(stopSpeech).toHaveBeenCalledOnce();
    expect(api.notices.map((notice) => notice.text)).toContain(AUDIO_CREATING_MESSAGE);
    await complete();
    expect(click).toHaveBeenCalledOnce();
    expect(api.busy).toBe(false);
    act(() => vi.advanceTimersByTime(30_000));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:audio");
  });

  it("preserves the selected English region in the server audio request", () => {
    document.cookie = "rcet_translation_language=en-GB; path=/";
    select();
    act(api.download);
    const [, request] = vi.mocked(fetch).mock.calls[0];
    expect(JSON.parse(request!.body as string)).toEqual({ text: "Read this selected passage.", voice: "female", rate: 1, language: "en-GB" });
  });

  it("waits after an empty click, then automatically exports a pointer or keyboard selection once", async () => {
    act(api.download);
    expect(api.waiting).toBe(true);
    expect(api.notices.map((notice) => notice.text)).toEqual([AUDIO_SELECT_MESSAGE]);
    expect(fetch).not.toHaveBeenCalled();
    select();
    act(() => document.getElementById("passage")!.dispatchEvent(new Event("keyup", { bubbles: true })));
    act(() => document.getElementById("passage")!.dispatchEvent(new Event("pointerup", { bubbles: true })));
    act(api.download);
    expect(fetch).toHaveBeenCalledOnce();
    expect(api.waiting).toBe(false);
    await complete();
  });

  it("ignores toolbar text and refuses an oversized selection", () => {
    select("tool");
    expect(selectedAudioText()).toBe("");
    document.getElementById("passage")!.textContent = "a".repeat(12_001);
    select();
    act(api.download);
    expect(fetch).not.toHaveBeenCalled();
    expect(api.notices[0].text).toContain("shorter passage");
  });

  it("shows a recoverable error and permits a retry after a failed request", async () => {
    select();
    act(api.download);
    await act(async () => resolveResponse(new Response('{"error":"audio_failed"}', { status: 503 })));
    expect(api.busy).toBe(false);
    expect(api.notices.at(-1)!.text).toContain("Please try again");
    act(api.download);
    expect(fetch).toHaveBeenCalledTimes(2);
    await complete();
  });

  it("reset cancels pending work and prevents a late download or next-selection download", async () => {
    select();
    act(api.download);
    const [, request] = vi.mocked(fetch).mock.calls[0];
    act(api.reset);
    expect(request!.signal!.aborted).toBe(true);
    await complete();
    expect(click).not.toHaveBeenCalled();
    window.getSelection()!.removeAllRanges();
    act(api.download);
    act(api.reset);
    select();
    act(() => document.dispatchEvent(new Event("pointerup")));
    expect(fetch).toHaveBeenCalledOnce();
    expect(api.notices).toEqual([]);
  });

  it("dismisses notifications by click and after four seconds", () => {
    act(api.download);
    act(() => api.dismissNotice(api.notices[0].id));
    expect(api.notices).toEqual([]);
    act(api.download);
    act(() => vi.advanceTimersByTime(4000));
    expect(api.notices).toEqual([]);
    expect(api.waiting).toBe(true);
  });
});
