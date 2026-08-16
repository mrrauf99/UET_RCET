import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/LinkButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import type { UniversityInfo } from "@/types/content";

export function CampusMap({ university }: { university: UniversityInfo }) {
  const query = encodeURIComponent(university.address);

  return (
    <section id="visit" aria-labelledby="visit-title" className="bg-muted py-(--space-section)">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading id="visit-title" title="Find the campus" lead={university.address} />
          <LinkButton href={`https://www.google.com/maps/dir/?api=1&destination=${query}`} external variant="secondary">
            Get directions
          </LinkButton>
        </div>
        <div className="reveal mt-10 aspect-4/3 overflow-hidden border border-border bg-surface sm:aspect-video lg:aspect-21/9 [clip-path:polygon(0_0,calc(100%-1.5rem)_0,100%_1.5rem,100%_100%,0_100%)]">
          {/* Keyless embed; lazy loading keeps Google's scripts off the critical path until the map nears the viewport.
              No sandbox: the cross-origin map needs scripts, same-origin storage and popups to work. */}
          {/* oxlint-disable-next-line react/iframe-missing-sandbox */}
          <iframe
            src={`https://www.google.com/maps?q=${query}&z=15&output=embed`}
            title={`Map showing ${university.name}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
            className="size-full border-0"
          />
        </div>
      </Container>
    </section>
  );
}
