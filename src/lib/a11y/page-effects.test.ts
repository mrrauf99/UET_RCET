// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { observeImageDescriptions, pausePageMedia } from "./page-effects";

const cleanups: (() => void)[] = [];
const settle = () => new Promise<void>((resolve) => setTimeout(resolve, 30));

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup());
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

describe("page image descriptions", () => {
  it("labels informative images and clipped fill images without duplicating accessible names", () => {
    document.body.innerHTML = '<div><img alt="Campus" style="position:absolute"></div><picture><img alt="Library"></picture><img alt=""><div class="a11y-toolbar"><img alt="Tool"></div>';
    cleanups.push(observeImageDescriptions());
    const labels = [...document.querySelectorAll(".a11y-image-description")];
    expect(labels.map((label) => label.textContent)).toEqual(["Campus", "Library"]);
    expect(labels.every((label) => label.getAttribute("aria-hidden") === "true")).toBe(true);
    expect(labels[0].classList.contains("a11y-image-description-overlay")).toBe(true);
    expect(document.querySelector("picture")?.nextSibling).toBe(labels[1]);
  });

  it("follows lazy content, alt changes, image moves and removal, and cleans up on reset", async () => {
    const cleanup = observeImageDescriptions();
    cleanups.push(cleanup);
    const image = document.createElement("img");
    image.alt = "Original";
    document.body.append(image);
    await settle();
    expect(image.nextSibling?.textContent).toBe("Original");
    image.alt = "Updated";
    await settle();
    expect(image.nextSibling?.textContent).toBe("Updated");
    const section = document.createElement("section");
    document.body.append(section);
    section.append(image);
    await settle();
    expect(image.nextSibling?.textContent).toBe("Updated");
    expect(document.querySelectorAll(".a11y-image-description")).toHaveLength(1);
    image.remove();
    await settle();
    expect(document.querySelectorAll(".a11y-image-description")).toHaveLength(0);
    document.body.append(image);
    await settle();
    cleanup();
    expect(document.querySelectorAll(".a11y-image-description")).toHaveLength(0);
  });
});

describe("pausing page media", () => {
  it("pauses playing and newly inserted media, keeps toolbar audio independent, and resumes only interrupted media", async () => {
    const paused = new WeakMap<HTMLMediaElement, boolean>();
    vi.spyOn(HTMLMediaElement.prototype, "paused", "get").mockImplementation(function (this: HTMLMediaElement) { return paused.get(this) ?? false; });
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (this: HTMLMediaElement) { paused.set(this, true); });
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (this: HTMLMediaElement) { paused.set(this, false); return Promise.resolve(); });
    document.body.innerHTML = '<video id="playing"></video><video id="already-paused"></video><div class="a11y-toolbar"><audio></audio></div>';
    const alreadyPaused = document.querySelector<HTMLVideoElement>("#already-paused")!;
    paused.set(alreadyPaused, true);
    const cleanup = pausePageMedia();
    cleanups.push(cleanup);
    expect(pause).toHaveBeenCalledTimes(1);
    const inserted = document.createElement("video");
    document.body.append(inserted);
    await settle();
    expect(pause).toHaveBeenCalledTimes(2);
    paused.set(inserted, false);
    inserted.dispatchEvent(new Event("play"));
    expect(pause).toHaveBeenCalledTimes(3);
    inserted.remove();
    cleanup();
    expect(play).toHaveBeenCalledTimes(1);
    expect(alreadyPaused.paused).toBe(true);
    expect(document.querySelector("audio")?.paused).toBe(false);
  });
});
