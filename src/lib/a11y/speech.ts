"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BLOCK_SELECTOR = "main :is(h1, h2, h3, h4, p, li, blockquote, dt, dd, figcaption)";
const HOVER_SELECTOR = "h1, h2, h3, h4, h5, h6, p, li, blockquote, dt, dd, figcaption, a, button, label, summary, td, th";
const ACTIVE_ATTRIBUTE = "data-tts-active";

function readableBlocks(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>(BLOCK_SELECTOR)].filter((element) => {
    if (!element.innerText.trim() || element.closest("[aria-hidden='true'], .sr-only")) return false;
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

function mark(element: HTMLElement | undefined) {
  document.querySelector(`[${ACTIVE_ATTRIBUTE}]`)?.removeAttribute(ACTIVE_ATTRIBUTE);
  if (!element) return;
  element.setAttribute(ACTIVE_ATTRIBUTE, "");
  const reduced = document.documentElement.dataset.motion === "reduce";
  element.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
}

export function isSpeechSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

type SpeechStatus = "idle" | "playing" | "paused";

export function useTextToSpeech() {
  const [status, setStatusState] = useState<SpeechStatus>("idle");
  const statusRef = useRef<SpeechStatus>("idle");
  const position = useRef({ block: 0, sentence: 0 });
  const blocks = useRef<HTMLElement[]>([]);
  // cancel() still fires onend on the cancelled utterance; a generation check ignores those stale callbacks.
  const generation = useRef(0);
  const pending = useRef<SpeechSynthesisUtterance | null>(null);
  const hovered = useRef<HTMLElement | null>(null);

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
      position.current = { block: position.current.block + 1, sentence: 0 };
      speakNext();
      return;
    }
    mark(element);
    const current = generation.current;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-GB";
    utterance.onend = () => {
      if (current !== generation.current) return;
      position.current = { ...position.current, sentence: position.current.sentence + 1 };
      speakNext();
    };
    // Without this a failed voice leaves the player showing Pause while nothing is spoken.
    utterance.addEventListener("error", (event) => {
      if (current !== generation.current || event.error === "interrupted" || event.error === "canceled") return;
      setStatus("paused");
    });
    // Chrome can garbage-collect an unreferenced utterance mid-speech, which silences it and drops onend.
    pending.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [setStatus]);

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
      utterance.lang = "en-GB";
      pending.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 60);
  };

  /** Speaks the hovered element's text without highlighting it; ignored while a reading is playing. */
  const readHovered = (target: Element) => {
    if (statusRef.current === "playing") return;
    const element = target.closest<HTMLElement>(HOVER_SELECTOR);
    if (!element || element.closest("[aria-hidden='true'], .sr-only")) return;
    const text = (element.getAttribute("aria-label") || element.innerText || "").replace(/\s+/g, " ").trim();
    if (!text || hovered.current === element) return;
    hovered.current = element;
    // Clear a leftover highlight from auto-play; hover reading stays unmarked.
    mark(undefined);
    say(text);
  };

  const restart = () => {
    hovered.current = null;
    generation.current += 1;
    const current = generation.current;
    window.speechSynthesis.cancel();
    if (blocks.current.length === 0) blocks.current = readableBlocks();
    setStatus("playing");
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
    if (statusRef.current === "playing") restart();
    else mark(blocks.current[block]);
  };

  const readFrom = (target: Element) => {
    blocks.current = readableBlocks();
    const index = blocks.current.findIndex((element) => element === target || element.contains(target));
    if (index === -1) return;
    position.current = { block: index, sentence: 0 };
    restart();
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
    playing: status === "playing",
    togglePlay: () => {
      if (statusRef.current === "playing") pause();
      else if (blocks.current.length) restart();
      else play();
    },
    reset,
    readHovered,
    previousBlock: () => move(-1, 0),
    nextBlock: () => move(1, 0),
    previousSentence: () => move(0, -1),
    nextSentence: () => move(0, 1),
    readFrom,
    say,
  };
}
