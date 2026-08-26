import type { CSSProperties } from "react";
import { GirihSeam } from "@/components/layout/GirihSeam";
import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import { ADMISSIONS_PORTAL_URL } from "@/lib/site";
import type { ImageAsset } from "@/types/content";

interface HeroProps {
  image: ImageAsset | null;
}

export function Hero({ image }: HeroProps) {
  return (
    <section aria-labelledby="hero-title" className="band relative">
      <Container width="wide" className="grid items-center gap-8 py-12 md:gap-12 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:py-24">
        <div>
          <h1 id="hero-title" className="hero-enter max-w-[18ch] text-display">
            Study engineering and computing in Gujranwala
          </h1>
          <p className="hero-enter mt-6 max-w-prose text-lg text-on-band-muted" style={{ "--i": 1 } as CSSProperties}>
            Explore undergraduate and postgraduate programs at RCET, a constituent college of UET Lahore.
          </p>
          <div className="hero-enter mt-10 flex flex-wrap gap-3" style={{ "--i": 2 } as CSSProperties}>
            <LinkButton href="#programs" size="lg" icon="arrow-right">
              Find your program
            </LinkButton>
            <LinkButton href={ADMISSIONS_PORTAL_URL} external variant="on-band" size="lg">
              Apply via UET portal
            </LinkButton>
          </div>
        </div>
        <div className="hero-wipe">
          <ImageFrame
            image={image}
            ratio="4/3"
            preload
            sizes="(min-width: 1024px) 45vw, 100vw"
          />
        </div>
      </Container>
      <GirihSeam animate />
    </section>
  );
}
