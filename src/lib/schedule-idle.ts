/** Returns a cancellation function for idle work, with a fallback for browsers without idle callbacks. */
export function scheduleIdle(callback: () => void): () => void {
  if ("requestIdleCallback" in window) {
    const id = requestIdleCallback(callback, { timeout: 5000 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(callback, 2000);
  return () => clearTimeout(id);
}
