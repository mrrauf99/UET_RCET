"use client";

import { AccessibilityToolbar } from "accessibility-toolbar/react";
import type { ToolbarOptions } from "accessibility-toolbar";

const options: ToolbarOptions = {
  storageKey: "rcet:a11y:v1",
  sourceLanguage: "en",
  trigger: false,
  pageEffects: "host",
  theme: { displayFontFamily: "var(--font-jost)" },
  focusAudio: { focus: "/audio/focus.wav", deeper: "/audio/deeper.wav" },
  branding: { name: "RCET", label: "Accessibility" },
  audio: { endpoint: "/api/a11y/audio", filename: "RCET-Audio.mp3" },
};

export function ToolbarHost() {
  return <AccessibilityToolbar options={options} />;
}
