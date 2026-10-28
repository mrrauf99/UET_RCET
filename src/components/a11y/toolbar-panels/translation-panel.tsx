"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { LANGUAGES } from "@/lib/a11y/languages";
import { currentTranslation, selectedTranslation, showOriginal, translatePage } from "@/lib/a11y/translate";
import type { Announce } from "./shared";

export function TranslationPanel({ announce, onEnglishAvailability }: { announce: Announce; onEnglishAvailability: (available: boolean) => void }) {
  const [query, setQuery] = useState("");
  // Panels render only in the browser (the toolbar is closed during server rendering).
  const [active, setActive] = useState(() => selectedTranslation() ?? "en-GB");
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const visible = LANGUAGES.toSorted((a, b) => a.name.localeCompare(b.name)).filter((language) =>
    `${language.name} ${language.native}`.toLowerCase().includes(query.toLowerCase()),
  );

  const choose = async (language: (typeof LANGUAGES)[number]) => {
    if (pending) return;
    setPending(language.code);
    setError("");
    try {
      await translatePage(language.code);
      setActive(language.code);
      onEnglishAvailability(/^en(?:-|$)/i.test(language.code));
      announce(`Page translated to ${language.name}`);
    } catch {
      setError("Translation could not start. Check your connection and try again.");
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="a11y-translation-controls">
      <button type="button" className="a11y-panel-reset" aria-label="Reset translation to original English" aria-disabled={pending !== null || undefined} onClick={() => {
        if (pending) return;
        if (currentTranslation()) showOriginal();
        else {
          setQuery("");
          setError("");
          void translatePage("en-GB");
          setActive("en-GB");
          onEnglishAvailability(true);
          announce("Original English selected");
        }
      }}>Reset to default</button>
      {error ? (
        <p role="alert" className="rounded-md border-2 border-(--tb-accent) p-3 text-[14px]">
          {error}
        </p>
      ) : null}
      <label className="a11y-language-search">
        <span className="sr-only">Search languages</span>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5 shrink-0"><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></svg>
        <input
          ref={searchRef}
          type="search"
          placeholder={`Search ${LANGUAGES.length} Languages`}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <output aria-live="polite" className="sr-only">{visible.length} languages found</output>
      <ul className="a11y-language-list" aria-label="Languages">
        {visible.map((language) => (
          <li key={language.code}>
            <button
              type="button"
              aria-pressed={active === language.code}
              aria-label={`${language.name} (${language.native})`}
              aria-busy={pending === language.code || undefined}
              // aria-disabled keeps keyboard focus on the button; disabled would drop it to <body>.
              aria-disabled={pending !== null || undefined}
              onClick={() => choose(language)}
              className="a11y-language-option"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span>{language.name}</span>
                <span lang={language.code} dir="auto" className="text-[14px] italic">{language.native}</span>
              </span>
              {pending === language.code ? (
                <span className="text-[14px]">Translating…</span>
              ) : active === language.code ? <Icon name="check" /> : null}
            </button>
          </li>
        ))}
        {visible.length === 0 ? <li className="py-2 text-[14px]">No language matches “{query}”.</li> : null}
      </ul>
      <button type="button" className="a11y-language-top" onClick={() => {
        searchRef.current?.closest<HTMLElement>("[data-panel]")?.scrollTo({ top: 0 });
        searchRef.current?.focus({ preventScroll: true });
      }}><Icon name="send" className="size-4" />Back to top</button>
      <p className="text-[14px] text-(--tb-muted)">Translated with Google Translate. Machine translation can contain errors.</p>
      <p className="text-[14px] text-(--tb-muted)">Text to Speech and audio downloads are available only for English.</p>
    </div>
  );
}
