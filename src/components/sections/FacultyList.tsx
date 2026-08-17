import Image from "next/image";
import { facultyPhotos } from "@/content/faculty-photos";
import type { FacultyMember } from "@/lib/department-content";

function initials(name: string) {
  return name
    .replace(/^((engr|dr|mr|ms|mrs)\.?\s+)+/i, "")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function FacultyList({ people, headingLevel = 3 }: { people: readonly FacultyMember[]; headingLevel?: 3 | 4 }) {
  const Heading = headingLevel === 3 ? "h3" : "h4";
  return (
    <ul className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
      {people.map((person) => {
        const photo = facultyPhotos[person.name];
        return (
          <li key={person.email ?? person.name} className="flex gap-4 border-b border-border py-4">
            {photo ? (
              <Image
                src={photo}
                alt=""
                width={80}
                height={80}
                className="size-20 shrink-0 rounded-full border border-border object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex size-20 shrink-0 items-center justify-center rounded-full bg-muted font-display text-xl font-semibold text-fg-muted"
              >
                {initials(person.name)}
              </span>
            )}
            <div className="flex min-w-0 flex-col gap-1">
              <Heading className="text-lg">{person.name}</Heading>
              <p className="text-fg-muted">
                {person.role ? `${person.role}, ` : ""}
                {person.designation}
              </p>
              {person.qualification ? <p className="text-sm text-fg-muted">{person.qualification}</p> : null}
              {person.email ? (
                <a href={`mailto:${person.email}`} className="mt-1 inline-flex min-h-11 items-center text-sm break-all text-link underline">
                  {person.email}
                </a>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
