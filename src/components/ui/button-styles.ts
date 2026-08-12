import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "on-band" | "ghost" | "icon";
export type ButtonSize = "md" | "lg";

const base =
  "group/button inline-flex items-center justify-center gap-2 rounded-md font-body font-bold transition-[color,background-color,border-color,scale] duration-(--dur-fast) ease-(--ease-out) not-aria-disabled:active:scale-[0.97] aria-disabled:cursor-not-allowed";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover aria-disabled:bg-muted aria-disabled:text-fg-muted",
  secondary: "border-2 border-fg text-fg hover:bg-muted aria-disabled:border-border-strong aria-disabled:text-fg-muted",
  "on-band": "bg-on-band text-band hover:bg-on-band-muted",
  ghost: "text-link underline-offset-4 hover:underline aria-disabled:text-fg-muted aria-disabled:no-underline",
  icon: "size-11 text-current hover:bg-muted",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-6 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], variant === "icon" ? undefined : sizes[size], className);
}
