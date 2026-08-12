import { cn } from "@/lib/cn";

interface SectionHeadingProps {
  id: string;
  title: string;
  lead?: string;
  level?: 2 | 3;
  align?: "start" | "center";
  tone?: "default" | "on-band";
  className?: string;
}

export function SectionHeading({
  id,
  title,
  lead,
  level = 2,
  align = "start",
  tone = "default",
  className,
}: SectionHeadingProps) {
  const Heading = level === 2 ? "h2" : "h3";

  return (
    <div className={cn("reveal max-w-prose", align === "center" && "mx-auto text-center", className)}>
      <Heading id={id} className={level === 2 ? "text-2xl" : "text-xl"}>
        {title}
      </Heading>
      {lead ? (
        <p className={cn("mt-4 text-lg", tone === "on-band" ? "text-on-band-muted" : "text-fg-muted")}>{lead}</p>
      ) : null}
    </div>
  );
}
