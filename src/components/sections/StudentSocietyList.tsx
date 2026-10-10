import { cn } from "@/lib/cn";
import type { StudentSociety } from "@/types/content";

interface StudentSocietyListProps {
  societies: readonly StudentSociety[];
  as?: "ul" | "ol";
  className?: string;
}

export function StudentSocietyList({ societies, as: Tag = "ul", className }: StudentSocietyListProps) {
  return (
    <Tag className={cn(className, "grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3")}>
      {societies.map((society) => (
        <li key={society.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-border py-4">
          <span className="min-w-0 font-bold">{society.name}</span>
          <span className="ms-auto text-end text-sm text-fg-muted tabular-nums">Since {society.foundedYear}</span>
        </li>
      ))}
    </Tag>
  );
}
