/**
 * Fades lazy images in as they finish loading. A capture listener installed before first paint catches every
 * image (server-rendered or added by navigation) without a client component, and it never hides anything:
 * if it doesn't run, or motion is reduced, images simply appear. Eager (preloaded) images are skipped so
 * the hero and banners aren't delayed as LCP candidates.
 */
function fadeInLoadedImages() {
  const root = document.documentElement;
  document.addEventListener(
    "load",
    (event) => {
      const image = event.target;
      if (!(image instanceof HTMLImageElement) || image.loading !== "lazy") return;
      if (root.dataset.motion === "reduce" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      image.animate(
        { opacity: [0, 1] },
        { duration: parseFloat(getComputedStyle(root).getPropertyValue("--dur-base")) || 200, easing: "ease-out" },
      );
    },
    true,
  );
}

export const IMAGE_FADE_SCRIPT = `(${fadeInLoadedImages.toString()})();`;
