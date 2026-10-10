"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useRef, useState, type CSSProperties } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { closeToolbar, openToolbar } from "@/lib/a11y/store";
import { openPanel } from "@/lib/rachna-gpt/store";
import { childHrefs, isCurrentAmong, isCurrentPath } from "@/lib/nav";
import type { ContentLink, NavItem } from "@/types/content";

interface MobileNavProps {
  items: readonly NavItem[];
  utilityLinks: readonly ContentLink[];
}

const iconButtonClasses =
  "grid size-11 place-items-center rounded-sm text-on-band transition-[background-color,scale] duration-(--dur-fast) ease-(--ease-out) hover:bg-on-band/10 active:scale-[0.94]";

export function MobileNav({ items, utilityLinks }: MobileNavProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const titleId = useId();

  const openMenu = () => {
    // showModal gives a focus trap, Escape handling and an inert background natively.
    dialogRef.current?.showModal();
    setOpen(true);
  };

  const closeMenu = () => dialogRef.current?.close();
  const openAccessibility = () => {
    const trigger = toggleRef.current;
    closeMenu();
    window.setTimeout(() => openToolbar(trigger), 0);
  };
  const openChat = () => {
    const trigger = toggleRef.current;
    closeMenu();
    window.setTimeout(() => {
      closeToolbar();
      openPanel(trigger);
    }, 0);
  };

  return (
    <div className="lg:hidden large-text:block!">
      <button
        ref={toggleRef}
        type="button"
        className={iconButtonClasses}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={openMenu}
      >
        <Icon name="menu" className="size-6" />
        <span className="sr-only">Menu</span>
      </button>

      {/* oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- backdrop tap is a pointer shortcut; Escape and the Close button cover keyboard */}
      <dialog
        ref={dialogRef}
        id="mobile-menu"
        aria-labelledby={titleId}
        className="nav-sheet surface my-0 ms-auto me-0 h-dvh max-h-none w-[min(24rem,calc(100%-3rem))] max-w-none overflow-y-auto p-0 shadow-lg"
        // A click on the dialog element itself lands on the dimmed backdrop, which closes the sheet.
        onClick={(event) => {
          if (event.target === event.currentTarget) closeMenu();
        }}
        onClose={() => {
          setOpen(false);
          toggleRef.current?.focus();
        }}
      >
        <div className="band sticky top-0 z-10 flex min-h-(--header-height) items-center justify-between px-(--space-gutter)">
          <h2 id={titleId} className="text-lg">
            Menu
          </h2>
          <button
            type="button"
            className={iconButtonClasses}
            onClick={closeMenu}
          >
            <Icon name="close" className="size-6" />
            <span className="sr-only">Close menu</span>
          </button>
        </div>

        <div className="grid gap-2 px-(--space-gutter) pt-4">
          <button
            type="button"
            onClick={openAccessibility}
            className="flex min-h-12 items-center gap-3 rounded-sm border border-border px-3 text-start font-bold hover:bg-muted focus-visible:bg-muted"
          >
            <Icon name="accessibility" className="size-5" />
            Accessibility tools
          </button>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={openChat}
            className="flex min-h-12 items-center gap-3 rounded-sm border border-border px-3 text-start font-bold hover:bg-muted focus-visible:bg-muted"
          >
            <Icon name="chat" className="size-5" />
            Open RachnaGPT chat
          </button>
        </div>

        <nav aria-label="Main" className="px-(--space-gutter) py-4">
          <ul className="divide-y divide-border">
            {items.map((item, index) =>
              item.kind === "link" ? (
                <li key={item.id} className="nav-sheet-item" style={{ "--i": index } as CSSProperties}>
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className="flex min-h-14 items-center rounded-sm px-3 text-lg font-bold transition-[color,background-color] duration-(--dur-fast) hover:bg-muted hover:text-accent focus-visible:bg-muted focus-visible:text-accent aria-[current=page]:bg-muted aria-[current=page]:text-accent"
                    aria-current={isCurrentPath(pathname, item.href) ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.id} className="nav-sheet-item" style={{ "--i": index } as CSSProperties}>
                  <button
                    type="button"
                    className="flex min-h-14 w-full items-center justify-between rounded-sm px-3 text-start text-lg font-bold transition-[color,background-color] duration-(--dur-fast) hover:bg-muted hover:text-accent focus-visible:bg-muted focus-visible:text-accent"
                    aria-expanded={expanded === item.id}
                    aria-controls={`mobile-group-${item.id}`}
                    onClick={() => setExpanded((current) => (current === item.id ? null : item.id))}
                  >
                    {item.label}
                    <Icon
                      name="chevron-down"
                      className={cn("size-5 transition-transform duration-(--dur-base) ease-(--ease-out)", expanded === item.id && "rotate-180")}
                    />
                  </button>
                  {/* The wrapper animates its height; padding lives on the list so the collapsed height can reach zero. */}
                  <div id={`mobile-group-${item.id}`} hidden={expanded !== item.id} className="accordion">
                    <ul className="pb-3">
                      {item.children.map((child) =>
                        child.kind === "link" ? (
                          <li key={child.id}>
                            <Link
                              href={child.href}
                              onClick={closeMenu}
                              className="flex min-h-11 items-center rounded-sm px-3 ps-7 text-base transition-[color,background-color] duration-(--dur-fast) hover:bg-muted hover:text-accent focus-visible:bg-muted focus-visible:text-accent aria-[current=page]:bg-muted aria-[current=page]:font-bold aria-[current=page]:text-accent"
                              aria-current={isCurrentAmong(pathname, child.href, childHrefs(item.children)) ? "page" : undefined}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                </li>
              ),
            )}
          </ul>
        </nav>

        <ul className="flex flex-col gap-2 border-t border-border px-(--space-gutter) py-6 text-base">
          {utilityLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="flex min-h-11 items-center gap-2 rounded-sm px-3 text-link underline transition-colors duration-(--dur-fast) hover:text-accent focus-visible:text-accent"
              >
                {link.label}
                {link.external ? (
                  <>
                    <Icon name="external" className="size-4" />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      </dialog>
    </div>
  );
}
