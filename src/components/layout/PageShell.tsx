import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { GirihSeam } from "./GirihSeam";

interface PageShellProps {
  title: string;
  lead?: string;
  /** Decorative photo behind the banner, under a navy wash so the heading keeps its contrast. */
  banner?: string | null;
  /** False when the page lays out its own full-width bands (e.g. a sticky tab bar). */
  contained?: boolean;
  children: ReactNode;
}

export function PageShell({ title, lead, banner, contained = true, children }: PageShellProps) {
  return (
    <>
      <div className="band relative isolate overflow-hidden">
        {banner ? (
          <div data-banner-photo aria-hidden="true" className="absolute inset-0 -z-10">
            <Image src={banner} alt="" fill priority sizes="100vw" className="object-cover" />
            {/* Solid behind the text column, easing off to the right so the photo still reads. */}
            <div className="absolute inset-0 bg-linear-to-r from-band via-band/90 to-band/55" />
          </div>
        ) : null}
        <Container className={banner ? "pt-12 pb-20 md:pb-28" : "pt-12 pb-14 md:pb-16"}>
          <h1 className="max-w-[20ch] text-3xl">{title}</h1>
          {lead ? <p className="mt-4 max-w-prose text-lg text-on-band-muted">{lead}</p> : null}
        </Container>
        <GirihSeam />
      </div>
      {contained ? <Container className="flex flex-col gap-16 py-(--space-section)">{children}</Container> : children}
    </>
  );
}

export function PageSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8">
      <h2 id={`${id}-title`} className="text-2xl">
        {title}
      </h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
