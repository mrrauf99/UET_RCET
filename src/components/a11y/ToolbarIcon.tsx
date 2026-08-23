import type { ReactNode } from "react";

// In-house icons on a 24px grid.
const icons = {
  speak: (
    <>
      <path d="M4 5h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9l-4 4v-4H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      <path d="M19.5 7.5a5 5 0 0 1 0 5M21.8 5.2a8.5 8.5 0 0 1 0 9.6" />
    </>
  ),
  music: (
    <>
      <path d="M9 18V6l11-2v12" />
      <circle cx="6.5" cy="18" r="2.5" />
      <circle cx="17.5" cy="16" r="2.5" />
    </>
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  translate: (
    <>
      <path d="M3 5h9M7.5 3v2M5 5c.7 3 2.6 5.4 5 6.6M10 5c-.7 3.2-2.7 5.8-6 7.4" />
      <path d="M12.5 21l4-9 4 9M14 17.8h5" />
    </>
  ),
  // Six filled segments make a colour wheel; it stays legible in monochrome because of the white dividers.
  palette: (
    <>
      <path d="M12 12V3a9 9 0 0 1 7.8 4.5z" fill="#e53935" stroke="none" />
      <path d="M12 12l7.8-4.5a9 9 0 0 1 0 9z" fill="#fb8c00" stroke="none" />
      <path d="M12 12l7.8 4.5A9 9 0 0 1 12 21z" fill="#fdd835" stroke="none" />
      <path d="M12 12v9a9 9 0 0 1-7.8-4.5z" fill="#43a047" stroke="none" />
      <path d="M12 12l-7.8 4.5a9 9 0 0 1 0-9z" fill="#1e88e5" stroke="none" />
      <path d="M12 12L4.2 7.5A9 9 0 0 1 12 3z" fill="#8e24aa" stroke="none" />
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9" />
      <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
    </>
  ),
  ruler: (
    <>
      <rect x="2" y="8" width="20" height="8" rx="1" />
      <path d="M6 8v3M10 8v4M14 8v3M18 8v4" />
    </>
  ),
  cursor: <path d="M5 3v15l4-3.7 2.7 6 2.7-1.2-2.6-5.9h5.6z" />,
  mask: (
    <>
      <path d="M3 4h18M3 7h18" />
      <rect x="2" y="10" width="20" height="4" rx="1" />
      <path d="M3 17h18M3 20h18" />
    </>
  ),
  options: (
    <>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
      <circle cx="16" cy="6" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="18" r="2" />
    </>
  ),
  structure: (
    <>
      <path d="M4 5h6M4 10h4M4 15h4M4 20h6" />
      <path d="M8 5v15" />
      <rect x="13" y="3" width="8" height="4" rx="1" />
      <rect x="13" y="10" width="8" height="4" rx="1" />
      <rect x="13" y="17" width="8" height="4" rx="1" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  close: <path d="M6 6l12 12M18 6L6 18" />,
  reset: <path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" />,
  "skip-back": (
    <>
      <path d="M18 6l-8 6 8 6z" />
      <path d="M6 6v12" />
    </>
  ),
  "skip-forward": (
    <>
      <path d="M6 6l8 6-8 6z" />
      <path d="M18 6v12" />
    </>
  ),
  rewind: <path d="M12 6l-8 6 8 6zM21 6l-8 6 8 6z" />,
  forward: <path d="M3 6l8 6-8 6zM12 6l8 6-8 6z" />,
  grip: (
    <>
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </>
  ),
  play: <path d="M7 4.5v15l12-7.5z" />,
  pause: <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />,
} satisfies Record<string, ReactNode>;

export type ToolbarIconName = keyof typeof icons;

const filled = new Set<ToolbarIconName>(["play", "pause", "skip-back", "skip-forward", "rewind", "forward", "grip"]);

export function ToolbarIcon({ name, className = "size-6" }: { name: ToolbarIconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={filled.has(name) ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {icons[name]}
    </svg>
  );
}
