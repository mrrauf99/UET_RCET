"use client";

import type { Ref } from "react";
import Image from "next/image";
import { rachnaGpt } from "@/content/rachna-gpt";

interface ChatLauncherProps {
  ref?: Ref<HTMLButtonElement>;
  onOpen: () => void;
  onWarm: () => void;
}

export function ChatLauncher({ ref, onOpen, onWarm }: ChatLauncherProps) {
  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="dialog"
      aria-expanded={false}
      onClick={onOpen}
      onPointerEnter={onWarm}
      onFocus={onWarm}
      className="fixed right-4 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] z-40 flex items-end gap-2 border-0 rounded-full transition-[scale] duration-(--dur-fast) ease-(--ease-out) active:scale-[0.96] [view-transition-class:chrome] [view-transition-name:chat-launcher]"
    >
      <span className="mb-1 inline-flex min-h-9 items-center rounded-s-full rounded-ee-2xl bg-[#fff8ed] px-4 py-2 text-sm font-semibold text-[#0a1f55] shadow-[0_8px_14px_rgb(0_0_0/22%)]">
        {rachnaGpt.name}
      </span>
      <span className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-full bg-[#fff8ed] shadow-[0_8px_14px_rgb(0_0_0/22%)]">
        <Image
          src="/images/rcet-logo.png"
          alt=""
          width={512}
          height={512}
          className="absolute -top-[6%] -left-[12.5%] h-auto w-[125%] max-w-none"
        />
      </span>
    </button>
  );
}
