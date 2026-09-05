"use client";

import { useCallback, useEffect, useEffectEvent, useRef, useState } from "react";
import type { SpeechOptions } from "./speech";
import { currentTranslation } from "./translate";

export const AUDIO_TEXT_LIMIT = 12_000;
export const AUDIO_SELECT_MESSAGE = "Please select some text.";
export const AUDIO_CREATING_MESSAGE = "Your download file is being created. It will be automatically downloaded once created";
const EXCLUDED = ".a11y-toolbar, [data-audio-notices], input, textarea, select, [contenteditable='true'], script, style, [hidden], [aria-hidden='true']";

export function selectedAudioText(): string {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || !selection.rangeCount) return "";
  const range = selection.getRangeAt(0);
  const ancestor = range.commonAncestorContainer;
  const element = ancestor instanceof Element ? ancestor : ancestor.parentElement;
  if (element?.closest(EXCLUDED)) return "";
  const fragment = range.cloneContents();
  // Keep ordinary selections intact, including the browser's paragraph boundaries.
  if (!fragment.querySelector(EXCLUDED)) return selection.toString().replace(/\s+/g, " ").trim();
  fragment.querySelectorAll(EXCLUDED).forEach((node) => node.remove());
  fragment.querySelectorAll("p, li, h1, h2, h3, h4, h5, h6, br").forEach((node) => node.append(" "));
  return fragment.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function useAudioDownload(options: SpeechOptions, onStart: () => void) {
  const [notices, setNotices] = useState<{ id: number; text: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const awaitingSelection = useRef(false);
  const captured = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const urls = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);
  const settings = useRef(options);
  const stopPlayback = useRef(onStart);
  useEffect(() => { settings.current = options; }, [options]);
  useEffect(() => { stopPlayback.current = onStart; }, [onStart]);

  const dismissNotice = useCallback((id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setNotices((current) => current.filter((notice) => notice.id !== id));
  }, []);

  const notify = useCallback((text: string) => {
    const id = nextId.current++;
    setNotices((current) => [...current.filter((notice) => notice.text !== text), { id, text }]);
    timers.current.set(id, setTimeout(() => dismissNotice(id), 4000));
  }, [dismissNotice]);

  const generate = useCallback(async (text: string) => {
    if (request.current) return;
    awaitingSelection.current = false;
    setWaiting(false);
    if (text.length > AUDIO_TEXT_LIMIT) {
      notify("Please select a shorter passage (up to 12,000 characters).");
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    stopPlayback.current();
    notify(AUDIO_CREATING_MESSAGE);
    const timeout = setTimeout(() => controller.abort("timeout"), 190_000);
    try {
      const response = await fetch("/api/a11y/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: settings.current.voice, rate: settings.current.rate, language: currentTranslation() || document.documentElement.lang || "en" }),
        signal: controller.signal,
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error === "unsupported_language" ? "Audio is unavailable for this language. Try another language." : response.status === 429 ? "Audio downloads are busy. Please try again in a few seconds." : "Your audio file could not be created. Please try again.");
      }
      const blob = await response.blob();
      if (controller.signal.aborted) return;
      if (!blob.size || !blob.type.startsWith("audio/mpeg")) throw new Error("Your audio file could not be created. Please try again.");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "RCET-Audio.mp3";
      document.body.append(link);
      link.click();
      link.remove();
      // Safari needs the URL to survive the click while its download starts.
      urls.current.set(url, setTimeout(() => { URL.revokeObjectURL(url); urls.current.delete(url); }, 30_000));
    } catch (error) {
      if (!controller.signal.aborted || controller.signal.reason === "timeout") {
        notify(controller.signal.reason === "timeout" ? "Your audio file took too long to create. Please try a shorter selection." : error instanceof Error && !(error instanceof TypeError) ? error.message : "Your audio file could not be created. Please try again.");
      }
    } finally {
      clearTimeout(timeout);
      if (request.current === controller) {
        request.current = null;
        setBusy(false);
      }
    }
  }, [notify]);

  const download = () => {
    const text = captured.current ?? selectedAudioText();
    captured.current = null;
    if (request.current) return;
    if (text) void generate(text);
    else {
      awaitingSelection.current = true;
      setWaiting(true);
      notify(AUDIO_SELECT_MESSAGE);
    }
  };

  const onSelectionComplete = useEffectEvent(() => {
    if (!awaitingSelection.current || request.current) return;
    const text = selectedAudioText();
    if (text) void generate(text);
  });

  useEffect(() => {
    const complete = (event: Event) => {
      if ((event.target as Element)?.closest?.(".a11y-toolbar")) return;
      onSelectionComplete();
    };
    document.addEventListener("pointerup", complete);
    document.addEventListener("keyup", complete);
    document.addEventListener("touchend", complete);
    return () => {
      document.removeEventListener("pointerup", complete);
      document.removeEventListener("keyup", complete);
      document.removeEventListener("touchend", complete);
    };
  }, []);

  const clear = useCallback(() => {
    awaitingSelection.current = false;
    captured.current = null;
    request.current?.abort();
    request.current = null;
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    urls.current.forEach((timer, url) => { clearTimeout(timer); URL.revokeObjectURL(url); });
    urls.current.clear();
  }, []);
  useEffect(() => clear, [clear]);

  return {
    busy, waiting, notices, download, dismissNotice,
    captureSelection: () => { captured.current = selectedAudioText(); },
    reset: () => { clear(); setBusy(false); setWaiting(false); setNotices([]); },
  };
}
