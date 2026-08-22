import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary" | "on-band";
export type ButtonSize = "md" | "lg";

const base =
  "group/button inline-flex items-center justify-center gap-2 rounded-md font-body font-bold transition-[color,background-color,border-color,scale] duration-(--dur-fast) ease-(--ease-out) active:scale-[0.97]";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover",
  secondary: "border-2 border-fg text-fg hover:bg-muted",
  "on-band": "bg-on-band text-band hover:bg-on-band-muted",
};

const sizes: Record<ButtonSize, string> = {
  md: "min-h-11 px-5 text-sm",
  lg: "min-h-13 px-6 text-base",
};

export function buttonClasses(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}
