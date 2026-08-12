import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ContainerProps {
  width?: "content" | "wide" | "prose";
  className?: string;
  children: ReactNode;
}

const widths = {
  content: "max-w-content",
  wide: "max-w-wide",
  prose: "max-w-prose",
} as const;

export function Container({ width = "content", className, children }: ContainerProps) {
  return <div className={cn("mx-auto w-full px-(--space-gutter)", widths[width], className)}>{children}</div>;
}
