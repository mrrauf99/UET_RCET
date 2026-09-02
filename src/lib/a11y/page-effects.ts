export function observeImageDescriptions(): () => void {
  const labels = new Map<HTMLImageElement, HTMLSpanElement>();
  let frame = 0;
  const sync = () => {
    frame = 0;
    for (const [image, label] of labels) {
      if (!image.isConnected || !image.alt.trim()) { label.remove(); labels.delete(image); }
    }
    document.querySelectorAll<HTMLImageElement>("img[alt]").forEach((image) => {
      if (!image.alt.trim() || image.closest(".a11y-toolbar")) return;
      let label = labels.get(image);
      if (!label) {
        label = document.createElement("span");
        label.className = "a11y-image-description";
        // Next's fill images need an overlay inside their clipped frame.
        if (getComputedStyle(image).position === "absolute") label.classList.add("a11y-image-description-overlay");
        // Alt text is already exposed by the image to assistive technology.
        label.setAttribute("aria-hidden", "true");
        labels.set(image, label);
      }
      const anchor = image.closest("picture") ?? image;
      if (anchor.nextSibling !== label) anchor.after(label);
      if (label.textContent !== image.alt) label.textContent = image.alt;
    });
  };
  const observer = new MutationObserver((changes) => {
    const relevant = changes.some((change) => {
      const target = change.target instanceof Element ? change.target : change.target.parentElement;
      return !target?.closest(".a11y-toolbar, .a11y-image-description");
    });
    if (relevant && !frame) frame = requestAnimationFrame(sync);
  });
  sync();
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["alt"] });
  return () => {
    observer.disconnect();
    cancelAnimationFrame(frame);
    labels.forEach((label) => label.remove());
  };
}

export function pausePageMedia(): () => void {
  const playing = new Set<HTMLMediaElement>();
  const animations = (document.getAnimations?.() ?? []).filter((animation) => {
    const target = (animation.effect as KeyframeEffect | null)?.target;
    return animation.playState === "running" && target instanceof Element && !target.closest(".a11y-toolbar");
  });
  animations.forEach((animation) => animation.pause());
  const stop = (media: HTMLMediaElement) => {
    if (media.closest(".a11y-toolbar") || media.paused) return;
    playing.add(media);
    media.pause();
  };
  const scan = (node: Node) => {
    if (!(node instanceof Element)) return;
    if (node instanceof HTMLMediaElement) stop(node);
    node.querySelectorAll<HTMLMediaElement>("video, audio").forEach(stop);
  };
  const onPlay = (event: Event) => { if (event.target instanceof HTMLMediaElement) stop(event.target); };
  scan(document.body);
  document.addEventListener("play", onPlay, true);
  const observer = new MutationObserver((changes) => {
    for (const change of changes) change.addedNodes.forEach(scan);
  });
  observer.observe(document.body, { childList: true, subtree: true });
  return () => {
    document.removeEventListener("play", onPlay, true);
    observer.disconnect();
    animations.forEach((animation) => { if (animation.playState === "paused") animation.play(); });
    playing.forEach((media) => { if (media.isConnected) void media.play().catch(() => {}); });
  };
}
