"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/cn";
import { childHrefs, isCurrentAmong, isCurrentPath } from "@/lib/nav";
import type { NavItem } from "@/types/content";

interface MainNavProps {
  items: readonly NavItem[];
}

const itemClasses =
  "flex min-h-11 items-center gap-1 rounded-sm px-3 text-sm font-bold whitespace-nowrap text-on-band underline-offset-8 decoration-2 decoration-transparent transition-[color,text-decoration-color,background-color] duration-(--dur-base) hover:bg-on-band/10 hover:text-on-band hover:underline hover:decoration-current aria-[current=page]:bg-on-band/10 aria-[current=page]:underline aria-[current=page]:decoration-accent";

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname();
  const [openId, setOpenId] = useState<string | null>(null);
  const [lastPathname, setLastPathname] = useState(pathname);
  const navRef = useRef<HTMLElement>(null);

  // Close any open group after navigation without an effect round-trip.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpenId(null);
  }

  useEffect(() => {
    if (!openId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpenId(null);
      navRef.current?.querySelector<HTMLButtonElement>(`[aria-controls="nav-group-${openId}"]`)?.focus();
    };
    const onOutside = (event: Event) => {
      if (!navRef.current?.contains(event.target as Node)) setOpenId(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onOutside);
    document.addEventListener("focusin", onOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onOutside);
      document.removeEventListener("focusin", onOutside);
    };
  }, [openId]);

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className="hidden lg:block large-text:hidden!"
    >
      <ul className="flex items-center gap-1">
        {items.map((item) =>
          item.kind === "link" ? (
            <li key={item.id}>
              <Link
                href={item.href}
                className={itemClasses}
                aria-current={isCurrentPath(pathname, item.href) ? "page" : undefined}
              >
                {item.label}
              </Link>
            </li>
          ) : (
            <li key={item.id} className="relative">
              <button
                type="button"
                className={itemClasses}
                aria-expanded={openId === item.id}
                aria-controls={`nav-group-${item.id}`}
                onClick={() => setOpenId((current) => (current === item.id ? null : item.id))}
              >
                {item.label}
                <Icon
                  name="chevron-down"
                  className={cn(
                    "size-4 transition-transform duration-(--dur-base) ease-(--ease-out)",
                    openId === item.id && "rotate-180",
                  )}
                />
              </button>
              <ul
                id={`nav-group-${item.id}`}
                hidden={openId !== item.id}
                className="pop-in absolute top-full left-0 z-40 mt-2 w-80 surface rounded-lg border border-border-strong p-2 shadow-lg"
              >
                {item.children.map((child) =>
                  child.kind === "link" ? (
                    <li key={child.id}>
                      <Link
                        href={child.href}
                        className="flex min-h-11 items-center rounded-sm px-3 py-2 text-sm transition-colors duration-(--dur-fast) hover:bg-band hover:text-on-band aria-[current=page]:font-bold"
                        aria-current={isCurrentAmong(pathname, child.href, childHrefs(item.children)) ? "page" : undefined}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ) : null,
                )}
              </ul>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}
