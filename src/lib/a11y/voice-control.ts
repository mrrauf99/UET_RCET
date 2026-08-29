"use client";

// Minimal typing for the Web Speech recognition API, which TypeScript's DOM lib does not ship.
interface RecognitionResultEvent {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

interface Recognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  addEventListener(type: "result", listener: (event: RecognitionResultEvent) => void): void;
  addEventListener(type: "error", listener: (event: { error: string }) => void): void;
  addEventListener(type: "end", listener: () => void): void;
  start(): void;
  stop(): void;
}

type RecognitionConstructor = new () => Recognition;

function recognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const candidate = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return candidate.SpeechRecognition ?? candidate.webkitSpeechRecognition ?? null;
}

export function isVoiceControlSupported() {
  return recognitionConstructor() !== null;
}

export const VOICE_COMMANDS = [
  { say: "Scroll down / Scroll up", does: "Scrolls the page" },
  { say: "Go to top / Go to bottom", does: "Jumps to the start or end of the page" },
  { say: "Next / Previous", does: "Moves keyboard focus" },
  { say: "Click …", does: "Follows a link or button by its text, for example “click admissions”" },
  { say: "Go back", does: "Returns to the previous page" },
  { say: "Stop listening", does: "Turns voice control off" },
] as const;

function focusables() {
  return [...document.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), input, select, textarea")].filter(
    (element) => element.offsetParent !== null && !element.closest("[inert]"),
  );
}

function moveFocus(step: 1 | -1) {
  const items = focusables();
  const index = items.indexOf(document.activeElement as HTMLElement);
  items[(index + step + items.length) % items.length]?.focus();
}

function runCommand(phrase: string, stopListening: () => void): string {
  const command = phrase.toLowerCase().trim().replace(/[.!?]$/, "");
  if (command.includes("stop listening")) {
    stopListening();
    return "Voice control off";
  }
  if (command.includes("scroll down")) window.scrollBy({ top: window.innerHeight * 0.8 });
  else if (command.includes("scroll up")) window.scrollBy({ top: -window.innerHeight * 0.8 });
  else if (command.includes("go to top")) window.scrollTo({ top: 0 });
  else if (command.includes("go to bottom")) window.scrollTo({ top: document.body.scrollHeight });
  else if (command === "next") moveFocus(1);
  else if (command === "previous") moveFocus(-1);
  else if (command.includes("go back")) history.back();
  else if (command.startsWith("click ")) {
    const label = command.slice(6);
    const target = focusables().find((element) =>
      (element.getAttribute("aria-label") ?? element.innerText).toLowerCase().includes(label),
    );
    if (!target) return `No link or button called “${label}”`;
    target.click();
    return `Clicked ${label}`;
  } else return `Not recognised: “${phrase}”`;
  return `Done: ${command}`;
}

const ERROR_MESSAGES: Record<string, string> = {
  "not-allowed": "Microphone access was blocked",
  "service-not-allowed": "Voice control is not allowed in this browser",
  "audio-capture": "No microphone was found",
  network: "Voice control needs an internet connection",
  "language-not-supported": "Voice control does not support English in this browser",
};

export function startVoiceControl(onUpdate: (message: string) => void, onStop: () => void) {
  const Constructor = recognitionConstructor();
  if (!Constructor) return null;
  const recognition = new Constructor();
  let active = true;
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = "en-GB";

  const stop = () => {
    active = false;
    recognition.stop();
    onStop();
  };

  recognition.addEventListener("result", (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result?.isFinal) onUpdate(runCommand(result[0].transcript, stop));
    }
  });
  recognition.addEventListener("error", (event) => {
    // Silence and our own stop() are routine; every other error would fail again on restart.
    if (event.error === "no-speech" || event.error === "aborted") return;
    onUpdate(ERROR_MESSAGES[event.error] ?? "Voice control stopped because of an error. Try again.");
    stop();
  });
  // Browsers end continuous sessions after silence; restart while the user still wants it on.
  recognition.addEventListener("end", () => {
    if (!active) return;
    try {
      recognition.start();
    } catch {
      onUpdate("Voice control stopped. Try again.");
      stop();
    }
  });
  try {
    recognition.start();
  } catch {
    onStop();
    return null;
  }
  onUpdate("Listening… say a command");
  return stop;
}
