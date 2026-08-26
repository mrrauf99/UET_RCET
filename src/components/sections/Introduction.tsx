import { Container } from "@/components/ui/Container";
import { ImageFrame } from "@/components/ui/ImageFrame";
import { LinkButton } from "@/components/ui/LinkButton";
import type { ImageAsset, IntroductionContent } from "@/types/content";

interface IntroductionProps {
  content: IntroductionContent;
  image: ImageAsset | null;
}

export function Introduction({ content, image }: IntroductionProps) {
  return (
    <section aria-labelledby="introduction-title" className="py-(--space-section)">
      <Container className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
        <ImageFrame image={image} ratio="16/9" sizes="(min-width: 1024px) 40vw, 100vw" className="reveal hidden lg:block" />
        <div>
          <h2 id="introduction-title" className="text-3xl">
            About RCET
          </h2>
          <p className="mt-6 max-w-prose text-lg">{content.body}</p>
          <LinkButton href="/about" variant="secondary" icon="arrow-right" className="mt-8">
            More about RCET
          </LinkButton>
        </div>
      </Container>
    </section>
  );
}
