"use client";

import { Icon } from "@/components/ui/Icon";
import { rachnaGpt } from "@/content/rachna-gpt";
import { cn } from "@/lib/cn";
import { send } from "@/lib/rachna-gpt/store";
import { COMPOSER_ID } from "./Composer";

function pick(prompt: string) {
  send(prompt);
  // The prompts disappear once a conversation starts, so focus moves to the composer instead of the page.
  document.getElementById(COMPOSER_ID)?.focus();
}

interface SuggestedPromptsProps {
  variant: "chips" | "cards";
  prompts?: readonly string[];
  limit?: number;
}

export function SuggestedPrompts({ variant, prompts = rachnaGpt.suggestedPrompts, limit = 4 }: SuggestedPromptsProps) {
  return (
    <ul aria-label="Suggested questions" className={cn(variant === "cards" ? "grid gap-3 sm:grid-cols-2" : "grid grid-cols-2 gap-2")}>
      {prompts.slice(0, limit).map((prompt) => (
        <li key={prompt} className="flex">
          <button
            type="button"
            onClick={() => pick(prompt)}
            className={cn(
              "group flex flex-1 items-center gap-3 border border-border-strong text-start font-medium text-fg transition-[border-color,background-color,scale] duration-(--dur-fast) ease-(--ease-out) hover:border-fg hover:bg-muted active:scale-[0.98]",
              variant === "cards" ? "min-h-16 rounded-lg px-4 py-3" : "min-h-11 rounded-lg px-3 py-2 text-sm leading-snug",
            )}
          >
            <span className="flex-1">{prompt}</span>
            {variant === "cards" ? (
              <Icon
                name="arrow-right"
                className="size-5 text-fg-muted transition-transform duration-(--dur-fast) group-hover:translate-x-0.5"
              />
            ) : null}
          </button>
        </li>
      ))}
    </ul>
  );
}
