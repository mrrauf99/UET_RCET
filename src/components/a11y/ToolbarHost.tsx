"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useA11yState } from "@/lib/a11y/store";
import { resumeTranslation } from "@/lib/a11y/translate";
import { scheduleIdle } from "@/lib/schedule-idle";

const loadToolbar = () => import("./A11yToolbar").then((mod) => mod.A11yToolbar);

// The toolbar (panels, speech, voice, translation) stays out of the page's startup JavaScript.
const A11yToolbar = dynamic(loadToolbar, { ssr: false });

export function ToolbarHost() {
  const { toolbarOpen } = useA11yState();

  useEffect(() => {
    resumeTranslation();
    // Warm the chunk once the page is idle so the first open doesn't wait on the network.
    return scheduleIdle(() => void loadToolbar());
  }, []);

  return toolbarOpen ? <A11yToolbar /> : null;
}
