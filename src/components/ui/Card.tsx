import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";

interface CardMedia {
  src: string;
  alt: string;
  sizes: string;
}

interface CardProps {
  as?: "article" | "li" | "div";
  title: string;
  titleLevel: 2 | 3 | 4;
  href?: string;
  meta?: ReactNode;
  media?: CardMedia | null;
  /** Shown in the media frame when no approved image exists. */
  placeholder?: ReactNode;
  ratio?: "4/3" | "16/9";
  children?: ReactNode;
}

const headingTags = { 2: "h2", 3: "h3", 4: "h4" } as const;

export function Card({
  as: Tag = "article",
  title,
  titleLevel,
  href,
  meta,
  media,
  placeholder,
  ratio = "4/3",
  children,
}: CardProps) {
  const Heading = headingTags[titleLevel];
  const hasMedia = Boolean(media || placeholder);

  return (
    <Tag
      className={cn(
        "reveal group relative flex flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-sm",
        href &&
          // Focus uses an outline because, unlike a shadow ring, it survives forced-colors mode.
          "transition-[translate,box-shadow] duration-(--dur-base) ease-(--ease-emphasized) hover:-translate-y-1 hover:shadow-lg has-focus-visible:outline-3 has-focus-visible:outline-offset-4 has-focus-visible:outline-focus",
      )}
    >
      {hasMedia ? (
        <div
          className={cn(
            "relative overflow-hidden bg-band",
            ratio === "16/9" ? "aspect-video" : "aspect-4/3",
          )}
        >
          {media ? (
            <Image
              src={media.src}
              alt={media.alt}
              fill
              sizes={media.sizes}
              quality={90}
              className={cn(
                "object-cover transition-transform duration-500 ease-(--ease-emphasized)",
                href && "group-hover:scale-[1.05] group-has-focus-visible:scale-[1.05]",
              )}
            />
          ) : (
            placeholder
          )}
          {/* Grounds the photo against the card body so the edge reads as intentional. */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-band/35 to-transparent" />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-6">
        {meta ? (
          <div className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-bold tracking-wide text-fg-muted uppercase">{meta}</div>
        ) : null}
        <Heading className="text-xl">
          {href ? (
            // Stretched ::after makes the whole card clickable while only the heading is announced.
            <Link
              href={href}
              className="transition-colors duration-(--dur-fast) after:absolute after:inset-0 focus-visible:outline-none group-hover:text-accent"
            >
              {title}
            </Link>
          ) : (
            title
          )}
        </Heading>
        {children ? <div className="text-fg-muted">{children}</div> : null}
        {href ? (
          <span aria-hidden="true" className="mt-auto inline-flex items-center gap-2 pt-2 text-sm font-bold text-accent">
            Explore
            <Icon name="arrow-right" className="size-4 transition-transform duration-(--dur-base) ease-(--ease-emphasized) group-hover:translate-x-1" />
          </span>
        ) : null}
      </div>
    </Tag>
  );
}
