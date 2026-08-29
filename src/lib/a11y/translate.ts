const COOKIE = "googtrans";
const CONTAINER_ID = "google-translate-element";
const SCRIPT_SRC = "https://translate.google.com/translate_a/element.js?cb=rcetTranslateInit";

declare global {
  interface Window {
    rcetTranslateInit?: () => void;
    google?: { translate?: { TranslateElement: new (options: object, elementId: string) => unknown } };
  }
}

let loading: Promise<void> | null = null;
let widget: unknown = null;

export function currentTranslation(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
  return match?.[1] && match[1] !== "en" ? decodeURIComponent(match[1]) : null;
}

function writeCookie(value: string | null) {
  if (value) {
    document.cookie = `${COOKIE}=${value}; path=/; SameSite=Lax`;
    return;
  }
  // Google may also have written the cookie on the domain itself, so clear every variant.
  for (const domain of ["", `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) {
    document.cookie = `${COOKIE}=; path=/${domain}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  }
}

/**
 * Google Translate swaps text nodes for <font> wrappers behind React's back, so React's later
 * removeChild/insertBefore calls target nodes that moved. Tolerating that avoids crashes (facebook/react#11538).
 */
function patchDomForTranslation() {
  const proto = Node.prototype as Node & { rcetPatched?: boolean };
  if (proto.rcetPatched) return;
  proto.rcetPatched = true;
  const removeChild = proto.removeChild;
  proto.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return removeChild.call(this, child) as T;
  };
  const insertBefore = proto.insertBefore;
  proto.insertBefore = function <T extends Node>(this: Node, node: T, reference: Node | null): T {
    return insertBefore.call(this, node, reference && reference.parentNode !== this ? null : reference) as T;
  };
}

function loadWidget(): Promise<void> {
  loading ??= new Promise((resolve, reject) => {
    patchDomForTranslation();
    const container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.hidden = true;
    document.body.append(container);
    window.rcetTranslateInit = () => {
      const TranslateElement = window.google?.translate?.TranslateElement;
      if (!TranslateElement) return reject(new Error("Google Translate unavailable"));
      widget ??= new TranslateElement({ pageLanguage: "en", autoDisplay: false }, CONTAINER_ID);
      resolve();
    };
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener(
      "error",
      () => {
        loading = null;
        reject(new Error("Google Translate could not be loaded"));
      },
      { once: true },
    );
    document.head.append(script);
  });
  return loading;
}

async function languageSelect(): Promise<HTMLSelectElement> {
  // The widget builds its hidden <select> asynchronously after init.
  for (let attempt = 0; attempt < 50; attempt++) {
    const select = document.querySelector<HTMLSelectElement>(".goog-te-combo");
    if (select?.options.length) return select;
    // oxlint-disable-next-line no-await-in-loop -- sequential polling is the point
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Google Translate did not start");
}

export async function translatePage(code: string) {
  const language = code === "fil" ? "tl" : code.startsWith("en-") ? "en" : code;
  if (language === "en") {
    if (currentTranslation()) showOriginal();
    return;
  }
  // The widget reads this cookie on load, so it is written first and cleared if loading fails.
  writeCookie(`/en/${code}`);
  try {
    await loadWidget();
    const select = await languageSelect();
    if (![...select.options].some((option) => option.value === language)) {
      throw new Error("This language is unavailable from the translation service");
    }
    select.value = language;
    select.dispatchEvent(new Event("change"));
  } catch (error) {
    writeCookie(null);
    throw error;
  }
}

/** Restores the original page; Google offers no reliable in-place undo, so this reloads. */
export function showOriginal() {
  writeCookie(null);
  location.reload();
}

export function resumeTranslation() {
  const code = currentTranslation();
  if (code) void translatePage(code).catch(() => {});
}
