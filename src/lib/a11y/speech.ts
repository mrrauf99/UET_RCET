"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isEnglishPage, selectedTranslation } from "./translate";

const BLOCK_SELECTOR = "h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption, a, button, label, summary, td, th, span, div";
const HOVER_SELECTOR = "h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption, a, button, label, summary, td, th";
const EXCLUDED_SELECTOR = "[aria-hidden='true'], [hidden], .sr-only, .a11y-toolbar, script, style, textarea, input, select, [contenteditable='true']";
const ACTIVE_ATTRIBUTE = "data-tts-active";
const WORD_ACTIVE_ATTRIBUTE = "data-tts-word-active";
const TEXT_BACKGROUND_ATTRIBUTE = "data-tts-text-background";
const WORD_HIGHLIGHT_NAME = "rcet-tts-word";
const WORD_HIGHLIGHT_STYLE_ID = "rcet-tts-word-highlight-style";

function ensureWordHighlightStyle() {
  if (document.getElementById(WORD_HIGHLIGHT_STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = WORD_HIGHLIGHT_STYLE_ID;
  style.textContent = `::highlight(${WORD_HIGHLIGHT_NAME}) { background-color: #000000; color: #ffffff; text-decoration: underline 2px #ffffff; text-underline-offset: 2px; }`;
  document.head.append(style);
}

function readableTarget(target: Element): HTMLElement | null {
  if (target.closest(EXCLUDED_SELECTOR)) return null;
  const element = target.closest<HTMLElement>(HOVER_SELECTOR) ?? target.closest<HTMLElement>("span, div");
  if (!element || !element.innerText?.trim() || !element.getClientRects().length) return null;
  if (!element.matches(HOVER_SELECTOR) && ![...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())) return null;
  return element;
}

function readableBlocks(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)].filter((element) => {
    if (!readableTarget(element)) return false;
    // Skip containers whose text is read through a nested block, so nothing is spoken twice.
    return !element.querySelector(BLOCK_SELECTOR);
  });
}

function sentences(text: string): string[] {
  return text.match(/[^.!?…]+[.!?…]*\s*/g)?.map((part) => part.trim()).filter(Boolean) ?? [text];
}

function blockSentences(element: HTMLElement): string[] {
  return sentences(element.innerText.replace(/\s+/g, " "));
}

function renderedTextMap(element: HTMLElement) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  const positions: Array<{ node: Text; offset: number }> = [];
  let text = "";
  let current: Node | null;

  while ((current = walker.nextNode())) {
    const node = current as Text;
    if (node.parentElement?.closest(EXCLUDED_SELECTOR)) continue;
    for (let offset = 0; offset < node.data.length; offset += 1) {
      const character = node.data[offset];
      if (!character) continue;
      if (/\s/.test(character)) {
        if (!text || text.endsWith(" ")) continue;
        text += " ";
      } else {
        text += character;
      }
      positions.push({ node, offset });
    }
  }

  if (text.endsWith(" ")) {
    text = text.slice(0, -1);
    positions.pop();
  }
  return { text, positions };
}

function sentenceStart(text: string, parts: string[], index: number) {
  let searchFrom = 0;
  for (let partIndex = 0; partIndex <= index; partIndex += 1) {
    const part = parts[partIndex];
    if (!part) continue;
    const found = text.indexOf(part, searchFrom);
    if (found < 0) return text.indexOf(parts[index] ?? "");
    if (partIndex === index) return found;
    searchFrom = found + part.length;
  }
  return -1;
}

function clearWordHighlight() {
  if (typeof CSS !== "undefined" && "highlights" in CSS) CSS.highlights.delete(WORD_HIGHLIGHT_NAME);
  document.querySelector(`[${WORD_ACTIVE_ATTRIBUTE}]`)?.removeAttribute(WORD_ACTIVE_ATTRIBUTE);
}

function hasBlueBackground(element: HTMLElement) {
  let current: HTMLElement | null = element;
  while (current) {
    const channels = getComputedStyle(current).backgroundColor.match(/[\d.]+/g)?.map(Number);
    if (channels && channels.length >= 3) {
      const [red = 0, green = 0, blue = 0, alpha = 1] = channels;
      if (alpha > 0.05 && blue > red + 20 && blue > green + 12) return true;
    }
    current = current.parentElement;
  }
  return false;
}

function highlightWord(element: HTMLElement, parts: string[], partIndex: number, wordOffset: number, charIndex: number) {
  clearWordHighlight();
  if (typeof CSS === "undefined" || !("highlights" in CSS) || typeof Highlight === "undefined") return false;

  const mapped = renderedTextMap(element);
  const part = parts[partIndex];
  if (!part) return false;
  const start = sentenceStart(mapped.text, parts, partIndex);
  if (start < 0) return false;
  const skipped = wordOffset > 0 ? `${part.split(/\s+/).slice(0, wordOffset).join(" ")} `.length : 0;
  const localOffset = skipped + charIndex;
  const words = [...part.matchAll(/\S+/g)];
  const word = words.find((match) => {
    const wordStart = match.index ?? -1;
    return localOffset >= wordStart && localOffset < wordStart + match[0].length;
  }) ?? words.find((match) => (match.index ?? -1) >= localOffset);
  if (!word) return false;

  const wordStart = start + (word.index ?? 0);
  const wordEnd = wordStart + word[0].length;
  const first = mapped.positions[wordStart];
  const last = mapped.positions[wordEnd - 1];
  if (!first || !last) return false;

  const range = document.createRange();
  range.setStart(first.node, first.offset);
  range.setEnd(last.node, last.offset + 1);
  CSS.highlights.set(WORD_HIGHLIGHT_NAME, new Highlight(range));
  element.setAttribute(WORD_ACTIVE_ATTRIBUTE, "");
  return true;
}

function mark(element: HTMLElement | undefined, scroll = true) {
  clearWordHighlight();
  const previous = document.querySelector(`[${ACTIVE_ATTRIBUTE}]`);
  previous?.removeAttribute(ACTIVE_ATTRIBUTE);
  previous?.removeAttribute(TEXT_BACKGROUND_ATTRIBUTE);
  if (!element) return;
  element.setAttribute(ACTIVE_ATTRIBUTE, "");
  if (!hasBlueBackground(element)) element.setAttribute(TEXT_BACKGROUND_ATTRIBUTE, "");
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
export const DEFAULT_SPEECH_OPTIONS: SpeechOptions = { autoPlay: true, wholePage: false, voice: "female", rate: 1 };

export function useTextToSpeech(options: SpeechOptions = DEFAULT_SPEECH_OPTIONS) {
  const [status, setStatusState] = useState<SpeechStatus>("idle");
  const statusRef = useRef<SpeechStatus>("idle");
  const position = useRef({ block: 0, sentence: 0 });
  const blocks = useRef<HTMLElement[]>([]);
  // cancel() still fires onend on the cancelled utterance; a generation check ignores those stale callbacks.
  const generation = useRef(0);
  const pending = useRef<SpeechSynthesisUtterance | null>(null);
  const hovered = useRef<HTMLElement | null>(null);
  const scrollOnRead = useRef(true);
  const settings = useRef(options);
  const wordOffset = useRef(0);
  const [error, setError] = useState("");
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof CSS !== "undefined" && "highlights" in CSS) ensureWordHighlightStyle();
  }, []);
  useEffect(() => {
    const sync = () => setVoices(window.speechSynthesis.getVoices());
    sync();
    window.speechSynthesis.addEventListener("voiceschanged", sync);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", sync);
  }, []);

  const configure = (utterance: SpeechSynthesisUtterance) => {
    const language = selectedTranslation() || document.documentElement.lang || "en-GB";
    const normalizedLanguage = language.toLowerCase();
    const installedVoices = window.speechSynthesis.getVoices();
    const exact = installedVoices.filter((voice) => voice.lang.toLowerCase() === normalizedLanguage);
    const available = exact.length
      ? exact
      : installedVoices.filter((voice) => voice.lang.toLowerCase().split("-")[0] === normalizedLanguage.split("-")[0]);
    const pattern = settings.current.voice === "male" ? /\b(male|david|mark|george|daniel|ryan|guy)\b/i : /\b(female|samantha|susan|zira|hazel|sonia|aria|jenny)\b/i;
    const voice = available.find((candidate) => pattern.test(candidate.name)) ?? available.find((candidate) => candidate.default) ?? available[0] ?? null;
    utterance.voice = voice;
    // Keep the utterance locale aligned with the voice actually selected by the browser.
    utterance.lang = voice?.lang || language;
    utterance.rate = settings.current.rate;
    return voice;
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
    hovered.current = null;
    wordOffset.current = 0;
    setError("");
    mark(undefined);
  }, [setStatus]);

  // Reads only refs and stable setters, so one instance can recurse from utterance callbacks.
  const speak = useCallback(function speakNext() {
    if (!isEnglishPage()) {
      setStatus("idle");
      setError("Text to Speech is available only when the page is in English.");
      mark(undefined);
      return;
    }
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
    mark(element, scrollOnRead.current);
    highlightWord(element, parts, position.current.sentence, wordOffset.current, 0);
    const current = generation.current;
    const offset = wordOffset.current;
    const sentence = position.current.sentence;
    const words = text.split(/\s+/);
    const spoken = words.slice(offset).join(" ");
    const utterance = new SpeechSynthesisUtterance(spoken);
    configureRef.current(utterance);
    utterance.onboundary = (event) => {
      if (current !== generation.current) return;
      highlightWord(element, parts, sentence, offset, event.charIndex);
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
    if (!isEnglishPage()) {
      setError("Text to Speech is available only when the page is in English.");
      return;
    }
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

  const readHovered = (target: Element) => {
    if (!isEnglishPage()) {
      setError("Text to Speech is available only when the page is in English.");
      return;
    }
    const element = readableTarget(target);
    if (!element) return;
    if (hovered.current === element && statusRef.current === "playing") return;
    const available = readableBlocks();
    let index = available.indexOf(element);
    if (index === -1) { available.unshift(element); index = 0; }
    hovered.current = element;
    blocks.current = available;
    position.current = { block: index, sentence: 0 };
    wordOffset.current = 0;
    if (settings.current.autoPlay) restart(false);
    else { pause(); mark(available[index], false); }
  };

  const restart = (scroll = true) => {
    if (!isEnglishPage()) {
      setError("Text to Speech is available only when the page is in English.");
      return;
    }
    scrollOnRead.current = scroll;
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
    hovered.current = null;
    blocks.current = readableBlocks();
    restart();
  };

  const move = (blockDelta: number, sentenceDelta: number) => {
    if (!isEnglishPage()) {
      setError("Text to Speech is available only when the page is in English.");
      return;
    }
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
    if (!isEnglishPage()) {
      setError("Text to Speech is available only when the page is in English.");
      return;
    }
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
    hovered.current = null;
    readHovered(target);
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
