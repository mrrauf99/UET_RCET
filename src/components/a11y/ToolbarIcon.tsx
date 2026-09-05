import type { ReactNode } from "react";

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
  download: <path d="M5 20h14v-2H5zM15 4H9v7H5l7 7 7-7h-4z" fill="currentColor" stroke="none" />,
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
  cursor: <path d="M4.9 4.5c-.7-.3-1.4.4-1.1 1.1l4.4 13c.4 1 1.7 1.1 2.2.1l2.1-4.7 4.3 4.3a1 1 0 0 0 1.4 0l.9-.9a1 1 0 0 0 0-1.4l-4.3-4.3 4.7-2.1c1-.5.9-1.8-.1-2.2z" fill="currentColor" stroke="none" />,
  mask: (
    <>
      <path d="M3 4h18M3 7.5h18M3 16.5h18M3 20h18" />
      <path d="M3 10.5h18M3 13.5h18" />
    </>
  ),
  options: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 8.5h18M6.5 12h6M6.5 15h4" />
      <path d="M12 17.5c1.5-2.2 3.2-3 5-3s3.5.8 5 3c-1.5 2.2-3.2 3-5 3s-3.5-.8-5-3z" fill="var(--tool-c, #fff)" />
      <circle cx="17" cy="17.5" r="1.2" />
    </>
  ),
  structure: (
    <>
      <path d="M12 3l9 4.5-9 4.5-9-4.5z" />
      <path d="M3 12l9 4.5 9-4.5M3 16.5l9 4.5 9-4.5" />
    </>
  ),
  "chevron-left": <path d="M15 5l-7 7 7 7" />,
  "chevron-right": <path d="M9 5l7 7-7 7" />,
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
  rewind: <path d="M4 8v6h6M4 14a9 9 0 0 1 16-3" />,
  forward: <path d="M20 8v6h-6M20 14a9 9 0 0 0-16-3" />,
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

const filled = new Set<ToolbarIconName>(["play", "pause", "skip-back", "skip-forward", "grip"]);

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
