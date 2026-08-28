/**
 * A pre-paint capture listener covers lazy images across navigation without a client component.
 * Images remain visible if it fails; eager images skip animation to avoid delaying LCP.
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
