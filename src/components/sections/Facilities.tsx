import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { capitalize } from "@/lib/format";
import type { Facility, ImageAsset } from "@/types/content";

export interface FacilityGroup {
  id: string;
  title: string;
  facilities: readonly Facility[];
}

interface FacilitiesProps {
  groups: readonly FacilityGroup[];
  labCount: number;
  image: ImageAsset | null;
}

export function Facilities({ groups, labCount, image }: FacilitiesProps) {
  return (
    <section aria-labelledby="facilities-title" className="py-(--space-section)">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.6fr]">
        <div className="flex flex-col items-start gap-8">
          <SectionHeading
            id="facilities-title"
            title="Facilities"
            lead="Shared spaces for study, worship and sport sit alongside the labs each department runs."
          />
          <p className="flex items-baseline gap-3 border-t-2 border-fg pt-4">
            <span className="font-display text-3xl font-semibold tabular-nums">{labCount}</span>
            <span className="font-bold">laboratory listings across five departments</span>
          </p>
          <LinkButton href="/facilities" variant="secondary" icon="arrow-right">
            Explore facilities
          </LinkButton>
        </div>

        <div className="grid gap-10 sm:grid-cols-2">
          {image ? (
            <ImageFrame image={image} ratio="16/9" sizes="(min-width: 1024px) 60vw, 100vw" className="reveal sm:col-span-2" />
          ) : null}
          {groups.map((group) => (
            <div key={group.id}>
              <h3 className="text-xl">{group.title}</h3>
              <ul className="mt-4 divide-y divide-border border-y border-border">
                {group.facilities.map((facility) => (
                  <li key={facility.id} className="flex min-h-12 items-center py-2">
                    {capitalize(facility.name)}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
