"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BLOCK_SELECTOR = "main :is(h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption)";
const HOVER_SELECTOR = "h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption, a, button, label, summary, td, th";
const ACTIVE_ATTRIBUTE = "data-tts-active";

function readableBlocks(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)].filter((element) => {
    if (!element.innerText.trim() || !element.getClientRects().length || element.closest("[aria-hidden='true'], .sr-only")) return false;
    // Skip containers whose text is read through a nested block, so nothing is spoken twice.
    return !element.querySelector(BLOCK_SELECTOR.replace("main ", ""));
  });
}

function sentences(text: string): string[] {
  return text.match(/[^.!?…]+[.!?…]*\s*/g)?.map((part) => part.trim()).filter(Boolean) ?? [text];
}

function blockSentences(element: HTMLElement): string[] {
  return sentences(element.innerText.replace(/\s+/g, " "));
}

function mark(element: HTMLElement | undefined, scroll = true) {
  document.querySelector(`[${ACTIVE_ATTRIBUTE}]`)?.removeAttribute(ACTIVE_ATTRIBUTE);
  if (!element) return;
  element.setAttribute(ACTIVE_ATTRIBUTE, "");
  if (scroll) {
    const reduced = document.documentElement.dataset.motion === "reduce";
    element.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
  }
}

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

type SpeechStatus = "idle" | "playing" | "paused";

export interface SpeechOptions { autoPlay: boolean; wholePage: boolean; voice: "male" | "female"; rate: number; }
export const DEFAULT_SPEECH_OPTIONS: SpeechOptions = { autoPlay: false, wholePage: false, voice: "female", rate: 1 };

export function useTextToSpeech(options: SpeechOptions = DEFAULT_SPEECH_OPTIONS) {
  const [status, setStatusState] = useState<SpeechStatus>("idle");
  const statusRef = useRef<SpeechStatus>("idle");
  const position = useRef({ block: 0, sentence: 0 });
  const blocks = useRef<HTMLElement[]>([]);
  // cancel() still fires onend on the cancelled utterance; a generation check ignores those stale callbacks.
  const generation = useRef(0);
  const pending = useRef<SpeechSynthesisUtterance | null>(null);
  const hovered = useRef<HTMLElement | null>(null);
  const settings = useRef(options);
  const wordOffset = useRef(0);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const sync = () => setVoices(window.speechSynthesis.getVoices());
    sync();
    window.speechSynthesis.addEventListener("voiceschanged", sync);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", sync);
  }, []);

  const configure = (utterance: SpeechSynthesisUtterance) => {
    const language = document.documentElement.lang || "en-GB";
    const available = window.speechSynthesis.getVoices().filter((voice) => voice.lang.split("-")[0] === language.split("-")[0]);
    const pattern = settings.current.voice === "male" ? /\b(male|david|mark|george|daniel|ryan|guy)\b/i : /\b(female|samantha|susan|zira|hazel|sonia|aria|jenny)\b/i;
    utterance.voice = available.find((voice) => pattern.test(voice.name)) ?? available.find((voice) => voice.default) ?? available[0] ?? null;
    utterance.lang = utterance.voice?.lang ?? language;
    utterance.rate = settings.current.rate;
  };
  const configureRef = useRef(configure);
  useEffect(() => { configureRef.current = configure; });

  const setStatus = useCallback((next: SpeechStatus) => {
    statusRef.current = next;
    setStatusState(next);
  }, []);

  const pause = useCallback(() => {
    generation.current += 1;
    window.speechSynthesis.cancel();
    setStatus("paused");
  }, [setStatus]);

  /** Turning read aloud off (unlike pausing) also clears the highlight and the reading position. */
  const reset = useCallback(() => {
    generation.current += 1;
    window.speechSynthesis.cancel();
    setStatus("idle");
    position.current = { block: 0, sentence: 0 };
    blocks.current = [];
    wordOffset.current = 0;
    setError("");
    mark(undefined);
  }, [setStatus]);

  // Reads only refs and stable setters, so one instance can recurse from utterance callbacks.
  const speak = useCallback(function speakNext() {
    const element = blocks.current[position.current.block];
    if (!element) {
      position.current = { block: 0, sentence: 0 };
      mark(undefined);
      setStatus("idle");
      return;
    }
    const parts = blockSentences(element);
    const text = parts[position.current.sentence];
    if (!text) {
      if (!settings.current.wholePage) { position.current.sentence = 0; mark(undefined); setStatus("idle"); return; }
      position.current = { block: position.current.block + 1, sentence: 0 };
      speakNext();
      return;
    }
    mark(element);
    const current = generation.current;
    const offset = wordOffset.current;
    const words = text.split(/\s+/);
    const spoken = words.slice(offset).join(" ");
    const utterance = new SpeechSynthesisUtterance(spoken);
    configureRef.current(utterance);
    utterance.onboundary = (event) => {
      if (current !== generation.current) return;
      wordOffset.current = offset + spoken.slice(0, event.charIndex).split(/\s+/).filter(Boolean).length;
    };
    utterance.onend = () => {
      if (current !== generation.current) return;
      wordOffset.current = 0;
      position.current = { ...position.current, sentence: position.current.sentence + 1 };
      speakNext();
    };
    // Without this a failed voice leaves the player showing Pause while nothing is spoken.
    utterance.addEventListener("error", (event) => {
      if (current !== generation.current || event.error === "interrupted" || event.error === "canceled") return;
      setStatus("paused");
      setError("Speech could not play. Check that your browser has a speech voice installed, then try Play again.");
    });
    // Chrome can garbage-collect an unreferenced utterance mid-speech, which silences it and drops onend.
    pending.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [setStatus]);

  useEffect(() => {
    settings.current = options;
    if (statusRef.current !== "playing") return;
    generation.current += 1;
    const current = generation.current;
    window.speechSynthesis.cancel();
    const timer = setTimeout(() => { if (current === generation.current) speak(); }, 60);
    return () => clearTimeout(timer);
  }, [options, speak]);

  /** Speaks a short label (e.g. a hovered control). Never interrupts a running reading. */
  const say = (text: string) => {
    if (statusRef.current === "playing") return;
    generation.current += 1;
    window.speechSynthesis.cancel();
    const current = generation.current;
    // Same cancel-then-speak race as restart().
    setTimeout(() => {
      if (current !== generation.current) return;
      const utterance = new SpeechSynthesisUtterance(text);
      configureRef.current(utterance);
      pending.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 60);
  };

  /** Hover selects text without moving the page; autoplay also starts reading it. */
  const readHovered = (target: Element) => {
    if (statusRef.current === "playing") return;
    const element = target.closest<HTMLElement>(HOVER_SELECTOR);
    if (!element || element.closest("[aria-hidden='true'], .sr-only")) return;
    if (hovered.current === element) return;
    const available = readableBlocks();
    const index = available.findIndex((block) => block === element || block.contains(element));
    if (index === -1) return;
    hovered.current = element;
    blocks.current = available;
    position.current = { block: index, sentence: 0 };
    wordOffset.current = 0;
    if (settings.current.autoPlay) restart();
    else { pause(); mark(available[index], false); }
  };

  const restart = () => {
    hovered.current = null;
    generation.current += 1;
    const current = generation.current;
    window.speechSynthesis.cancel();
    if (blocks.current.length === 0) blocks.current = readableBlocks();
    setStatus("playing");
    setError("");
    // Chrome silently drops a speak() issued in the same tick as cancel().
    setTimeout(() => {
      if (current === generation.current) speak();
    }, 60);
  };

  const play = () => {
    blocks.current = readableBlocks();
    restart();
  };

  const move = (blockDelta: number, sentenceDelta: number) => {
    hovered.current = null;
    if (blocks.current.length === 0) blocks.current = readableBlocks();
    const last = Math.max(blocks.current.length - 1, 0);
    const count = (index: number) => {
      const element = blocks.current[index];
      return element ? blockSentences(element).length : 1;
    };
    let { block, sentence } = position.current;
    if (blockDelta !== 0) {
      block = Math.min(Math.max(block + blockDelta, 0), last);
      sentence = 0;
    } else {
      sentence += sentenceDelta;
      // Sentence steps cross into the neighbouring paragraph instead of stalling at its edge.
      if (sentence < 0) {
        if (block > 0) {
          block -= 1;
          sentence = count(block) - 1;
        } else sentence = 0;
      } else if (sentence >= count(block)) {
        if (block < last) {
          block += 1;
          sentence = 0;
        } else sentence = count(block) - 1;
      }
    }
    position.current = { block, sentence };
    wordOffset.current = 0;
    if (settings.current.autoPlay) restart();
    else { pause(); mark(blocks.current[block]); }
  };

  // Web Speech has no audio seek API; approximate ten seconds using word position and reading rate.
  const seek = (seconds: number) => {
    if (!blocks.current.length) blocks.current = readableBlocks();
    if (!blocks.current.length) return;
    const segments = blocks.current.flatMap((element, block) => blockSentences(element).map((text, sentence) => ({ block, sentence, words: text.split(/\s+/).length })));
    let index = segments.findIndex((segment) => segment.block === position.current.block && segment.sentence === position.current.sentence);
    if (index < 0) index = 0;
    let word = wordOffset.current + Math.round(seconds * 2.5 * settings.current.rate);
    while (word < 0 && index > 0) { index -= 1; word += segments[index].words; }
    while (word >= segments[index].words && index < segments.length - 1) { word -= segments[index].words; index += 1; }
    position.current = { block: segments[index].block, sentence: segments[index].sentence };
    wordOffset.current = Math.max(0, Math.min(word, segments[index].words - 1));
    restart();
  };

  const readFrom = (target: Element) => {
    blocks.current = readableBlocks();
    const index = blocks.current.findIndex((element) => element === target || element.contains(target));
    if (index === -1) return;
    position.current = { block: index, sentence: 0 };
    wordOffset.current = 0;
    if (settings.current.autoPlay) restart();
    else { pause(); mark(blocks.current[index]); }
  };

  useEffect(
    () => () => {
      generation.current += 1;
      window.speechSynthesis.cancel();
      mark(undefined);
    },
    [],
  );

  return {
    status,
    error,
    voices,
    playing: status === "playing",
    togglePlay: () => {
      if (statusRef.current === "playing") pause();
      else if (blocks.current.length) restart();
      else play();
    },
    reset,
    pause,
    play,
    rewind: () => seek(-10),
    forward: () => seek(10),
    readHovered,
    previousBlock: () => move(-1, 0),
    nextBlock: () => move(1, 0),
    previousSentence: () => move(0, -1),
    nextSentence: () => move(0, 1),
    readFrom,
    say,
  };
}
