"use client";

import type { Ref } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
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
      className="fixed right-4 bottom-[calc(2.5rem+env(safe-area-inset-bottom))] z-40 flex items-center rounded-full transition-[scale] duration-(--dur-fast) ease-(--ease-out) active:scale-[0.96] [view-transition-class:chrome] [view-transition-name:chat-launcher]"
    >
      <span className="band -me-5 inline-flex items-center gap-2 rounded-full py-2 ps-3.5 pe-8 text-sm font-semibold shadow-lg ring-1 ring-on-band/30">
        <Icon name="chat" className="size-4.5 shrink-0" />
        {rachnaGpt.name}
      </span>
      <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-white shadow-lg ring-2 ring-white">
        <Image
          src="/images/rcet-logo.png"
          alt=""
          width={512}
          height={512}
          className="absolute -top-[20.2%] -left-[28.3%] size-auto max-w-none w-[159.5%]"
        />
      </span>
    </button>
  );
}
