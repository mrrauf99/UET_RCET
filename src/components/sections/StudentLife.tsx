import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { cn } from "@/lib/cn";
import type { ImageAsset, StudentSociety } from "@/types/content";
import { StudentSocietyList } from "./StudentSocietyList";

interface StudentLifeProps {
  societies: readonly StudentSociety[];
  photos: readonly ImageAsset[];
}

export function StudentLife({ societies, photos }: StudentLifeProps) {
  const sorted = societies.toSorted((a, b) => a.foundedYear - b.foundedYear);

  return (
    <section aria-labelledby="student-life-title" className="py-(--space-section)">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            id="student-life-title"
            title="Student life"
            lead={`${societies.length} student societies cover technology, culture, media, sport and community service.`}
          />
          <LinkButton href="/facilities#societies" variant="secondary" icon="arrow-right">
            Societies and sport
          </LinkButton>
        </div>
        {photos.length > 0 ? (
          <ul className="student-life-gallery mt-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:grid-rows-2">
            {photos.map((photo, index) => (
              <li
                key={photo.id}
                className={cn(
                  "reveal relative aspect-4/3 overflow-hidden rounded-md",
                  index === 0 ? "col-span-2 md:row-span-2"
                    : index === 1 ? "md:col-span-2" : undefined,
                )}
              >
                <Image
                  src={photo.approvedLocalPath ?? ""}
                  alt={photo.approvedAlt ?? ""}
                  fill
                  sizes={index === 0 ? "(min-width: 768px) 50vw, 100vw" : index === 1 ? "50vw" : index === photos.length - 1 ? "(min-width: 768px) 25vw, 100vw" : "(min-width: 768px) 25vw, 50vw"}
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        ) : null}
        <StudentSocietyList societies={sorted} as="ol" className="mt-10" />
      </Container>
    </section>
  );
}
