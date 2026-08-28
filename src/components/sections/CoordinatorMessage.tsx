import Image from "next/image";
import { GirihPattern } from "@/components/layout/GirihPattern";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import type { CoordinatorMessage as CoordinatorMessageContent, ImageAsset } from "@/types/content";

interface CoordinatorMessageProps {
  message: CoordinatorMessageContent;
  portrait: ImageAsset | null;
}

export function CoordinatorMessage({ message, portrait }: CoordinatorMessageProps) {
  if (message.source.status !== "observed" || !message.fullMessage) return null;

  // The live site wraps the excerpt in stray quote marks and truncates it with "...".
  const excerpt = message.excerpt
    .replace(/^[\s"“]+|[\s"”]+$/g, "")
    .replace(/\.{3}$/, "…");

  return (
    <section aria-labelledby="coordinator-title" className="band relative overflow-hidden py-(--space-section)">
      <GirihPattern className="absolute inset-y-0 left-0 hidden w-1/4 text-on-band-muted md:block [mask-image:linear-gradient(to_right,black,transparent)]" />
      <Container width="prose" className="relative">
        <h2 id="coordinator-title" className="text-2xl">
          Message from the Campus Coordinator
        </h2>
        <figure className="mt-8">
          <Icon name="quote" className="size-10 text-on-band-muted" />
          <blockquote className="pull-quote mt-4 font-display text-xl leading-relaxed">
            <p>{excerpt}</p>
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-4 border-t border-on-band/25 pt-6">
            {portrait?.approvedLocalPath ? (
              <Image
                src={portrait.approvedLocalPath}
                alt=""
                width={72}
                height={72}
                className="size-18 shrink-0 rounded-full object-cover ring-2 ring-on-band-muted"
              />
            ) : null}
            <span className="flex flex-col">
              <span className="font-bold">{message.name}</span>
              <span className="text-on-band-muted">{message.role}</span>
            </span>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
