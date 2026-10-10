"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { openToolbar, useA11yState } from "@/lib/a11y/store";

interface A11yTriggerProps {
  placement: "header" | "floating";
}

export function A11yTrigger({ placement }: A11yTriggerProps) {
  const { toolbarOpen } = useA11yState();

  return (
    <button
      type="button"
      data-a11y-trigger={placement}
      title="Open accessibility toolbar"
      aria-expanded={toolbarOpen}
      aria-controls={toolbarOpen ? "accessibility-toolbar" : undefined}
      onClick={(event) => openToolbar(event.currentTarget)}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold",
        placement === "header"
          ? "min-h-11 rounded-sm px-2 text-sm text-on-band hover:underline"
          : "fixed left-4 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full border-0 bg-[#0546ff] text-white shadow-lg transition-[scale] duration-(--dur-fast) ease-(--ease-out) active:scale-[0.94] large-text:hidden! [view-transition-class:chrome] [view-transition-name:a11y-trigger]",
      )}
    >
      {placement === "floating" ? <span aria-hidden="true" className="pointer-events-none absolute inset-[3px] rounded-full border-2 border-white" /> : null}
      <Icon name="accessibility" className={placement === "header" ? "size-5" : "size-9 [&_path]:stroke-[2.5]"} />
      {placement === "header" ? (
        <span>
          Accessibility<span className="sr-only"> toolbar</span>
        </span>
      ) : (
        <span className="sr-only">Accessibility toolbar</span>
      )}
    </button>
  );
}
