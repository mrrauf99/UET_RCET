"use client";

import Link from "next/link";
import { useId, useState, type FormEvent, type KeyboardEvent, type Ref } from "react";
import { Icon } from "@/components/ui/Icon";
import { rachnaGpt } from "@/content/rachna-gpt";
import { LIMITS } from "@/lib/rachna-gpt/constants";
import { selectStatus, send, stop } from "@/lib/rachna-gpt/store";
import { useChat, useCooldownSeconds } from "@/lib/rachna-gpt/use-chat";

export const COMPOSER_ID = "rachna-gpt-input";
const COUNTER_FROM = 800;

export function Composer({ ref }: { ref?: Ref<HTMLTextAreaElement> }) {
  const status = useChat(selectStatus);
  const cooldown = useCooldownSeconds();
  const [value, setValue] = useState("");
  const hintId = useId();
  const streaming = status === "streaming";
  const blocked = cooldown > 0;
  const canSend = !blocked && value.trim() !== "";
  const showCounter = value.length >= COUNTER_FROM;
  const showHint = blocked || showCounter;

  // Announce only the start and end of a cooldown; a per-second countdown would flood screen readers.
  const [wasBlocked, setWasBlocked] = useState(blocked);
  const [announcement, setAnnouncement] = useState("");
  if (blocked !== wasBlocked) {
    setWasBlocked(blocked);
    setAnnouncement(blocked ? `Too many messages. You can send again in ${cooldown} seconds.` : "You can send messages again.");
  }

  function submit(event?: FormEvent) {
    event?.preventDefault();
    if (streaming) return stop();
    if (!canSend) return;
    send(value);
    setValue("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // isComposing: Enter confirms an IME candidate (Urdu, CJK input) rather than sending.
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (!streaming) submit();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5">
      <label htmlFor={COMPOSER_ID} className="sr-only">
        Message {rachnaGpt.name}
      </label>
      <div className="flex items-end gap-2 rounded-lg border-2 border-border-strong bg-surface p-1.5 transition-colors duration-(--dur-fast) focus-within:border-fg">
        {/* The wrapper border carries focus; the global halo on the textarea would notch its rounded corners. */}
        {/* readOnly rather than disabled during a cooldown, so focus is not thrown back to the page. */}
        <textarea
          ref={ref}
          id={COMPOSER_ID}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={onKeyDown}
          readOnly={blocked}
          aria-disabled={blocked}
          aria-describedby={showHint ? hintId : undefined}
          rows={1}
          maxLength={LIMITS.userChars}
          dir="auto"
          placeholder="Ask about fees or hostels…"
          className="field-sizing-content max-h-36 min-h-11 flex-1 resize-none bg-transparent px-2.5 py-2.5 leading-6 outline-none focus-visible:shadow-none placeholder:text-fg-muted aria-disabled:cursor-not-allowed"
        />
        {/* aria-disabled keeps the button focusable; disabling it after a send would drop focus. */}
        <button
          type="submit"
          aria-label={streaming ? "Stop generating" : "Send message"}
          aria-disabled={!streaming && !canSend}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md bg-accent text-on-accent transition-[background-color,scale] duration-(--dur-fast) ease-(--ease-out) hover:bg-accent-hover active:scale-[0.94] aria-disabled:cursor-not-allowed aria-disabled:bg-muted aria-disabled:text-fg-muted aria-disabled:active:scale-100"
        >
          <Icon name={streaming ? "stop" : "send"} />
        </button>
      </div>
      {showHint ? (
        <div id={hintId} className="flex justify-between gap-3 px-1 text-xs text-fg-muted">
          <span aria-hidden="true">{blocked ? `Too many messages. You can send again in ${cooldown} s.` : ""}</span>
          {showCounter ? (
            <span>
              {value.length}/{LIMITS.userChars}
            </span>
          ) : null}
        </div>
      ) : null}
      <output aria-live="polite" className="sr-only">
        {announcement}
      </output>
    </form>
  );
}

export function ChatDisclaimer() {
  const { text, linkLabel, href } = rachnaGpt.disclaimer;
  return (
    <p className="text-center text-xs text-fg-muted">
      {text}{" "}
      <Link href={href} className="text-link underline underline-offset-2">
        {linkLabel}
      </Link>
      .
    </p>
  );
}
