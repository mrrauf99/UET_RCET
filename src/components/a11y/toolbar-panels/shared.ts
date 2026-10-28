"use client";

import type { A11yPrefs } from "@/lib/a11y/prefs";
import { updatePrefs } from "@/lib/a11y/store";

export type Announce = (message: string) => void;

export interface PrefsPanelProps {
  prefs: A11yPrefs;
  announce: Announce;
}

export function updatePreference(update: Partial<A11yPrefs>, announce: Announce, message: string) {
  updatePrefs(update);
  announce(message);
}

export const onOff = (on: boolean) => (on ? "on" : "off");
