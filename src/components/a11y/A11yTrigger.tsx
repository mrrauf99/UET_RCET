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
      aria-expanded={toolbarOpen}
      onClick={(event) => openToolbar(event.currentTarget)}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-bold",
        placement === "header"
          ? "min-h-11 rounded-sm px-2 text-sm text-on-band hover:underline"
          : "band fixed left-4 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] z-40 size-14 rounded-full shadow-lg ring-2 ring-on-band transition-[scale] duration-(--dur-fast) ease-(--ease-out) active:scale-[0.94] [view-transition-class:chrome] [view-transition-name:a11y-trigger]",
      )}
    >
      <Icon name="accessibility" className={placement === "header" ? "size-5" : "size-7"} />
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
