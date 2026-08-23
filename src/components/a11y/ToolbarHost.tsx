"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useA11yState } from "@/lib/a11y/store";
import { resumeTranslation } from "@/lib/a11y/translate";

const loadToolbar = () => import("./A11yToolbar").then((mod) => mod.A11yToolbar);

// The toolbar (panels, speech, voice, translation) stays out of the page's startup JavaScript.
const A11yToolbar = dynamic(loadToolbar, { ssr: false });

export function ToolbarHost() {
  const { toolbarOpen } = useA11yState();

  useEffect(() => {
    resumeTranslation();
    // Warm the chunk once the page is idle so the first open doesn't wait on the network.
    const warm = () => void loadToolbar();
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(warm, { timeout: 5000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(warm, 2000);
    return () => clearTimeout(id);
  }, []);

  return toolbarOpen ? <A11yToolbar /> : null;
}
