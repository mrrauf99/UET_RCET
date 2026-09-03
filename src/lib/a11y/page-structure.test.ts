// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearOutlineHighlight, collectOutline, highlightOutline } from "./page-structure";

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([{}] as unknown as DOMRectList);
});

afterEach(() => {
  clearOutlineHighlight();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("page structure", () => {
  it("excludes tools and hidden content while including semantic headings", () => {
    document.body.innerHTML = '<h1>College</h1><div role="heading" aria-level="3">Courses</div><div class="a11y-toolbar"><h2>Page Structure</h2></div><div aria-hidden="true"><h2>Hidden slide</h2></div><h2 hidden>Hidden heading</h2><h2 style="visibility:hidden">Invisible heading</h2>';
    expect(collectOutline("headings").map(({ label, badge }) => ({ label, badge }))).toEqual([
      { label: "College", badge: "H1" }, { label: "Courses", badge: "H3" },
    ]);
  });

  it("preserves link destinations and accessible names, including image links", () => {
    document.body.innerHTML = '<span id="name">Student portal</span><a href="https://example.com" target="_blank" rel="external" aria-labelledby="name" aria-label="Other name">Portal</a><a href="tel:123">Call</a><a href="mailto:office@example.com">Email</a><a href="#courses"><img alt="Browse courses"></a>';
    const links = collectOutline("links");
    expect(links[0]).toMatchObject({ label: "Student portal", href: "https://example.com", target: "_blank", rel: "external" });
    expect(links.slice(1).map(({ href, label }) => ({ href, label }))).toEqual([
      { href: "tel:123", label: "Call" }, { href: "mailto:office@example.com", label: "Email" }, { href: "#courses", label: "Browse courses" },
    ]);
  });

  it("names native and ARIA landmarks using their labels or headings", () => {
    document.body.innerHTML = '<header><nav aria-label="Primary">Menu</nav></header><main><h1>College</h1><section aria-labelledby="courses"><h2 id="courses">Courses</h2></section><div role="search" aria-label="Find courses"></div></main><footer>Contact</footer>';
    expect(collectOutline("landmarks").map(({ label }) => label)).toEqual([
      "Header", "Navigation: Primary", "Main: College", "Section: Courses", "Search: Find courses", "Footer",
    ]);
  });

  it("keeps distinct stable keys for duplicate labels without changing page IDs", () => {
    document.body.innerHTML = '<h2>Courses</h2><h2>Courses</h2>';
    const first = collectOutline("headings");
    expect(first[0].key).not.toBe(first[1].key);
    expect(collectOutline("headings").map(({ key }) => key)).toEqual(first.map(({ key }) => key));
    expect(document.querySelectorAll("h2[id]")).toHaveLength(0);
  });

  it("retains a destination highlight across tool clicks and clears it on page interaction", () => {
    document.body.innerHTML = '<h1>College</h1><main>Page</main><button class="a11y-toolbar">Tool</button>';
    const heading = document.querySelector("h1")!;
    highlightOutline(heading, "headings");
    document.querySelector("button")!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(heading.getAttribute("data-structure-active")).toBe("true");
    document.querySelector("main")!.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    expect(heading.hasAttribute("data-structure-active")).toBe(false);
  });

  it("replaces earlier highlights and clears the current one with Escape", () => {
    document.body.innerHTML = '<h1>College</h1><main>Page</main>';
    const heading = document.querySelector("h1")!;
    const main = document.querySelector("main")!;
    highlightOutline(heading, "headings");
    highlightOutline(main, "landmarks");
    expect(heading.hasAttribute("data-structure-active")).toBe(false);
    expect(main.getAttribute("data-structure-active")).toBe("landmark");
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(main.hasAttribute("data-structure-active")).toBe(false);
  });
});
