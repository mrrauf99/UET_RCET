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
  { say: "Click / Open …", does: "Follows a link or button, or opens a dropdown by its label" },
  { say: "Choose / Select / Click …", does: "Chooses an option in a dropdown, for example “select Computer Science”" },
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

function normalizePhrase(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function optionWords(value: string) {
  return value.split(" ").filter((word) => word && word !== "and" && word !== "the");
}

function accessibleName(element: HTMLElement) {
  const labelledBy = element.getAttribute("aria-labelledby");
  const referenced = labelledBy?.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ");
  return (referenced || element.getAttribute("aria-label") || (element instanceof HTMLSelectElement ? [...element.labels ?? []].map((label) => label.innerText).join(" ") : "") || element.innerText || element.textContent || "").trim().replace(/\s+/g, " ");
}

function optionMatches(option: HTMLOptionElement, phrase: string) {
  const wanted = normalizePhrase(phrase);
  const candidate = normalizePhrase(option.label);
  if (!wanted || !candidate) return false;
  if (candidate === wanted || candidate.includes(wanted) || wanted.includes(candidate)) return true;

  const wantedWords = optionWords(wanted);
  const candidateWords = optionWords(candidate);
  if (wantedWords.length === 1) return candidateWords.some((word) => word.startsWith(wantedWords[0]));
  const matched = wantedWords.filter((word) => candidateWords.some((candidateWord) => candidateWord.startsWith(word) || word.startsWith(candidateWord)));
  return matched.length >= 2 && matched.length / wantedWords.length >= 0.66;
}

function findOption(label: string): { select?: HTMLSelectElement; option?: HTMLOptionElement; error: string | null } {
  const matchingSelects = [...document.querySelectorAll<HTMLSelectElement>("select")]
    .filter((select) => select.offsetParent !== null && !select.closest("[inert]"))
    .map((select) => ({ select, options: [...select.options].filter((option) => optionMatches(option, label)) }))
    .filter(({ options }) => options.length > 0);
  const active = document.activeElement;
  const match = active instanceof HTMLSelectElement
    ? matchingSelects.find(({ select }) => select === active)
    : undefined;
  const selected = match ?? (matchingSelects.length === 1 ? matchingSelects[0] : undefined);
  if (!selected) {
    return {
      select: undefined,
      option: undefined,
      error: matchingSelects.length > 1
        ? "More than one dropdown has a matching option. Focus the dropdown first."
        : null,
    };
  }
  if (selected.options.length > 1) {
    const exact = selected.options.filter((option) => normalizePhrase(option.label) === normalizePhrase(label));
    if (exact.length === 1) return { select: selected.select, option: exact[0], error: null };
    return { select: undefined, option: undefined, error: `Several options match “${label}”. Say more of the option name.` };
  }
  return { select: selected.select, option: selected.options[0], error: null };
}

async function chooseOption(label: string) {
  const match = findOption(label);
  if (!match.select || !match.option) return match.error ?? `No dropdown option called “${label}”`;
  const { select, option } = match;
  select.focus();
  const setValue = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
  if (setValue) setValue.call(select, option.value);
  else select.value = option.value;
  select.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  return select.value === option.value ? `Selected ${option.label}` : `Could not select ${option.label}. Try again.`;
}

function openSelect(select: HTMLSelectElement, label: string) {
  select.focus();
  const picker = select as HTMLSelectElement & { showPicker?: () => void };
  if (typeof picker.showPicker === "function") {
    try {
      picker.showPicker();
      return `Opened ${label} options`;
    } catch {
      // Voice results do not carry the transient user activation some browsers require for native pickers.
    }
  }

  const restore = () => {
    select.size = 1;
    select.removeEventListener("change", restore);
    select.removeEventListener("blur", restore);
  };
  select.addEventListener("change", restore);
  select.addEventListener("blur", restore);
  select.size = Math.min(Math.max(select.options.length, 2), 6);
  select.scrollIntoView({ block: "center", behavior: "smooth" });
  return `${label} options are open. Say “select” and the option name.`;
}

async function runCommand(phrase: string, stopListening: () => void): Promise<string> {
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
  else if (command.startsWith("choose ") || command.startsWith("select ")) {
    return chooseOption(command.replace(/^(choose|select)\s+(on\s+)?(the\s+)?(option\s+)?/, ""));
  }
  else if (command.startsWith("click ")) {
    const label = command.replace(/^click\s+(on\s+)?(the\s+)?(option\s+)?/, "").replace(/\s+dropdown$/, "");
    const dropdown = focusables().find((element) =>
      element instanceof HTMLSelectElement && normalizePhrase(accessibleName(element)).includes(normalizePhrase(label)),
    );
    if (dropdown instanceof HTMLSelectElement) return openSelect(dropdown, accessibleName(dropdown) || label);

    const option = findOption(label);
    if (option.error) return option.error;
    if (option.select && option.option) return chooseOption(label);

    const target = focusables().find((element) =>
      normalizePhrase(accessibleName(element)).includes(normalizePhrase(label)),
    );
    if (!target) return `No link or button called “${label}”`;
    target.click();
    return `Clicked ${label}`;
  } else if (command.startsWith("open ") || command.startsWith("show ")) {
    const label = command.replace(/^(open|show)\s+(the\s+)?/, "").replace(/\s+dropdown$/, "");
    const target = focusables().find((element) =>
      element instanceof HTMLSelectElement && normalizePhrase(accessibleName(element)).includes(normalizePhrase(label)),
    );
    if (target instanceof HTMLSelectElement) return openSelect(target, accessibleName(target) || label);
    return `No dropdown called “${label}”`;
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
      if (result?.isFinal) void runCommand(result[0].transcript, stop).then(onUpdate);
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
