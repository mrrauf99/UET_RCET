import Image from "next/image";
import type { ReactNode } from "react";
import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/cn";
import { GirihSeam } from "./GirihSeam";

interface PageShellProps {
  title: string;
  lead?: string;
  /** Decorative artwork behind a centred title. It must carry no lettering: the h1 is the only title. */
  banner?: string | null;
  /** False when the page lays out its own full-width bands (e.g. a sticky tab bar). */
  contained?: boolean;
  children: ReactNode;
}

export function PageShell({ title, lead, banner, contained = true, children }: PageShellProps) {
  return (
    <>
      <div className="band relative isolate overflow-hidden bg-banner">
        {banner ? (
          <div data-banner-photo aria-hidden="true" className="absolute inset-0 -z-10">
            <Image src={banner} alt="" fill preload quality={90} sizes="100vw" className="object-cover" />
            {/* Dims the artwork's line work so the title keeps its contrast wherever it wraps. */}
            <div className="absolute inset-0 bg-band/35" />
          </div>
        ) : null}
        <Container className={banner ? "flex min-h-52 flex-col items-center justify-center py-12 text-center md:min-h-68" : "pt-12 pb-14 md:pb-16"}>
          <h1 className={cn("max-w-[20ch] text-3xl", banner && "mx-auto")}>{title}</h1>
          {lead ? <p className={cn("mt-4 max-w-prose text-lg text-on-band-muted", banner && "mx-auto")}>{lead}</p> : null}
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
