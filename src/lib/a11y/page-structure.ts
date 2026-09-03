export const STRUCTURE_VIEWS = ["headings", "landmarks", "links"] as const;
export type StructureView = (typeof STRUCTURE_VIEWS)[number];

export interface OutlineItem {
  key: string;
  element: HTMLElement;
  label: string;
  badge: string;
  href?: string;
  target?: string;
  rel?: string;
}

const LANDMARK_NAMES: Record<string, string> = {
  header: "Header", banner: "Header", nav: "Navigation", navigation: "Navigation",
  main: "Main", footer: "Footer", contentinfo: "Footer", aside: "Sidebar",
  complementary: "Sidebar", section: "Section", region: "Section", form: "Form", search: "Search",
};

const outlineKeys = new WeakMap<HTMLElement, string>();
let nextOutlineKey = 0;

function outlineKey(element: HTMLElement) {
  let key = outlineKeys.get(element);
  if (!key) { key = `structure-item-${nextOutlineKey++}`; outlineKeys.set(element, key); }
  return key;
}

function referencedLabel(labelledBy: string | null) {
  return labelledBy?.split(/\s+/).map((id) => document.getElementById(id)?.textContent ?? "").join(" ").trim() ?? "";
}

function accessibleLabel(element: HTMLElement) {
  const referenced = referencedLabel(element.getAttribute("aria-labelledby"));
  return (referenced || element.getAttribute("aria-label")?.trim() || element.innerText?.trim() || element.textContent?.trim() || element.querySelector("img")?.alt || "").trim().replace(/\s+/g, " ");
}

let highlightedElement: HTMLElement | null = null;
let highlightEvents: AbortController | null = null;

export function clearOutlineHighlight() {
  highlightedElement?.removeAttribute("data-structure-active");
  highlightedElement = null;
  highlightEvents?.abort();
  highlightEvents = null;
}

export function highlightOutline(element: HTMLElement, view: StructureView) {
  clearOutlineHighlight();
  highlightedElement = element;
  element.setAttribute("data-structure-active", view === "landmarks" ? "landmark" : "true");
  // Keep the destination visible after a mobile drawer closes; clear it on the next page interaction.
  highlightEvents = new AbortController();
  const { signal } = highlightEvents;
  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (target instanceof Element && (target.closest(".a11y-toolbar") || element.contains(target))) return;
    clearOutlineHighlight();
  }, { capture: true, signal });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") clearOutlineHighlight();
  }, { signal });
}

export function collectOutline(view: StructureView): OutlineItem[] {
  const selector = view === "headings"
    ? "h1, h2, h3, h4, h5, h6, [role=heading][aria-level]"
    : view === "links"
      ? "a[href]"
      : "header, nav, main, footer, aside, form, section[aria-labelledby], section[aria-label], [role=banner], [role=navigation], [role=main], [role=contentinfo], [role=region], [role=complementary], [role=form], [role=search]";
  return [...document.querySelectorAll<HTMLElement>(selector)]
    .filter((element) => {
      if (element.closest('.a11y-toolbar, [data-tts-player], [hidden], [inert], [aria-hidden="true"]') || !element.getClientRects().length) return false;
      const style = getComputedStyle(element);
      return style.visibility !== "hidden" && style.visibility !== "collapse";
    })
    .map((element): OutlineItem => {
      if (view === "landmarks") {
        const kind = element.getAttribute("role")?.split(/\s+/)[0] ?? element.tagName.toLowerCase();
        const name = LANDMARK_NAMES[kind] ?? "Section";
        const labelledBy = element.getAttribute("aria-labelledby");
        const title = (labelledBy
          ? referencedLabel(labelledBy)
          : element.getAttribute("aria-label") || (["main", "section", "region"].includes(kind) ? element.querySelector("h1, h2, h3, h4, h5, h6")?.textContent : "") || "").trim().replace(/\s+/g, " ");
        return { key: outlineKey(element), element, label: title ? `${name}: ${title}` : name, badge: name };
      }
      const item: OutlineItem = {
        key: outlineKey(element),
        element,
        label: accessibleLabel(element),
        badge: view === "headings" ? (element.getAttribute("role") === "heading" ? `H${element.getAttribute("aria-level")}` : element.tagName) : "Link",
      };
      if (view === "links") {
        item.href = element.getAttribute("href") ?? undefined;
        item.target = element.getAttribute("target") ?? undefined;
        item.rel = element.getAttribute("rel") ?? undefined;
      }
      return item;
    })
    .filter((item) => item.label);
}
