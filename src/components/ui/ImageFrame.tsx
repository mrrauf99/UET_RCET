import Image from "next/image";
import { GirihPattern } from "@/components/layout/GirihPattern";
import { cn } from "@/lib/cn";
import type { ImageAsset } from "@/types/content";

interface ImageFrameProps {
  image: ImageAsset | null;
  sizes: string;
  ratio?: "4/3" | "16/9" | "4/5";
  preload?: boolean;
  /** Empty alt where adjacent text already names the subject, so it isn't announced twice. */
  decorative?: boolean;
  className?: string;
}

const ratios = { "4/3": "aspect-4/3", "16/9": "aspect-video", "4/5": "aspect-4/5" } as const;

/** Approved photo when one exists; otherwise a decorative girih panel (no hotlinked or stock images). */
export function ImageFrame({ image, sizes, ratio = "4/3", preload = false, decorative = false, className }: ImageFrameProps) {
  return (
    <div
      className={cn(
        "band relative overflow-hidden",
        ratios[ratio],
        className,
      )}
    >
      {image?.approvedLocalPath ? (
        <Image
          src={image.approvedLocalPath}
          alt={decorative ? "" : (image.approvedAlt ?? "")}
          fill
          sizes={sizes}
          quality={90}
          preload={preload}
          className="object-cover"
        />
      ) : (
        <GirihPattern className="absolute inset-0 size-full text-on-band-muted" scale={1.25} />
      )}
    </div>
  );
}
