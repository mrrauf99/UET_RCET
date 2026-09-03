const paths = {
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "M6 6l12 12M18 6L6 18",
  "chevron-down": "M6 9l6 6 6-6",
  "arrow-right": "M5 12h14M13 6l6 6-6 6",
  "arrow-up": "M12 20V4M5 11l7-7 7 7",
  external: "M15 3h6v6M21 3L10 14M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5",
  phone: "M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  "map-pin": "M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  accessibility: "M12 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM5 9l7 1.5L19 9M12 10.5V14M12 14l-3 6M12 14l3 6",
  plus: "M12 5v14M5 12h14",
  minus: "M5 12h14",
  quote: "M10 11H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4c0 3-1.5 5-4 6M19 11h-4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v4c0 3-1.5 5-4 6",
  reset: "M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4",
  check: "M5 12.5l4.5 4.5L19 7.5",
  chat: "M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 19.5l1.3-4.6A7.5 7.5 0 1 1 20 11.5zM8.5 11.5h.01M12.5 11.5h.01M16.5 11.5h.01",
  send: "M12 19V5M5.5 11.5L12 5l6.5 6.5",
  stop: "M7.5 7.5h9v9h-9z",
  expand: "M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7",
} as const;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  className?: string;
}

/** Decorative: pair it with visible text or an accessible name on its parent. */
export function Icon({ name, className = "size-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
