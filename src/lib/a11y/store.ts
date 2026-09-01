"use client";

import { useSyncExternalStore } from "react";
import { applyPreferences, DEFAULT_PREFS, STORAGE_KEY, TOOLBAR_STORAGE_KEY, toStored, type A11yPrefs } from "./prefs";

interface A11yState {
  prefs: A11yPrefs;
  toolbarOpen: boolean;
}

const SERVER_STATE: A11yState = { prefs: DEFAULT_PREFS, toolbarOpen: false };
const MEDIA_QUERIES = ["(prefers-color-scheme: dark)", "(prefers-contrast: more)", "(prefers-reduced-motion: reduce)"];

let state: A11yState | null = null;
let returnFocusTo: HTMLElement | null = null;
const listeners = new Set<() => void>();

function readStored(): unknown {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writeStored(prefs: A11yPrefs) {
  try {
    const stored = toStored(prefs);
    if (Object.keys(stored).length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Storage can be unavailable (private mode, quota); preferences still apply for this visit.
  }
}

function getState(): A11yState {
  if (!state) {
    let toolbarOpen = false;
    try { toolbarOpen = localStorage.getItem(TOOLBAR_STORAGE_KEY) === "open"; } catch { /* Preferences still work when storage is blocked. */ }
    state = { prefs: applyPreferences(readStored()), toolbarOpen };
  }
  return state;
}

function persistToolbar(open: boolean) {
  try {
    if (open) localStorage.setItem(TOOLBAR_STORAGE_KEY, "open");
    else localStorage.removeItem(TOOLBAR_STORAGE_KEY);
  } catch { /* Closing the toolbar must always work. */ }
}

function emit(next: A11yState) {
  state = next;
  for (const listener of listeners) listener();
}

// "System" preferences must follow OS changes while the page is open.
function onMediaChange() {
  applyPreferences(getState().prefs);
  emit({ ...getState() });
}

function onStorageChange(event: StorageEvent) {
  if (event.key !== STORAGE_KEY && event.key !== null) return;
  emit({ ...getState(), prefs: applyPreferences(readStored()) });
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) {
    for (const query of MEDIA_QUERIES) window.matchMedia(query).addEventListener("change", onMediaChange);
    window.addEventListener("storage", onStorageChange);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      for (const query of MEDIA_QUERIES) window.matchMedia(query).removeEventListener("change", onMediaChange);
      window.removeEventListener("storage", onStorageChange);
    }
  };
}

export function useA11yState(): A11yState {
  return useSyncExternalStore(subscribe, getState, () => SERVER_STATE);
}

export function updatePrefs(update: Partial<A11yPrefs>) {
  const next = { ...getState().prefs, ...update };
  if (update.grayscale === true) next.colorPreset = "none";
  else if (update.colorPreset && update.colorPreset !== "none") next.grayscale = false;
  const prefs = applyPreferences(next);
  writeStored(prefs);
  emit({ ...getState(), prefs });
}

export function resetPrefs() {
  const prefs = applyPreferences({});
  writeStored(prefs);
  emit({ ...getState(), prefs });
}

export function openToolbar(trigger: HTMLElement | null) {
  if (getState().toolbarOpen) {
    document.querySelector<HTMLElement>(".a11y-toolbar [data-tool]")?.focus();
    return;
  }
  returnFocusTo = trigger;
  // Pushes the sticky header and page content below the fixed toolbar.
  document.documentElement.setAttribute("data-toolbar", "open");
  persistToolbar(true);
  emit({ ...getState(), toolbarOpen: true });
}

export function closeToolbar() {
  document.documentElement.removeAttribute("data-toolbar");
  persistToolbar(false);
  emit({ ...getState(), toolbarOpen: false });
  const trigger = returnFocusTo?.isConnected ? returnFocusTo : document.querySelector<HTMLElement>("[data-a11y-trigger]");
  trigger?.focus();
  returnFocusTo = null;
}

/** Effective values after resolving "system" against the OS, read from <html>. */
export function resolvedAttribute(name: "data-theme" | "data-contrast" | "data-motion") {
  return typeof document === "undefined" ? null : document.documentElement.getAttribute(name);
}
