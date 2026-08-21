import Image from "next/image";
import { GirihPattern } from "@/components/layout/GirihPattern";
import { cn } from "@/lib/cn";
import type { ImageAsset } from "@/types/content";

interface ImageFrameProps {
  image: ImageAsset | null;
  sizes: string;
  ratio?: "4/3" | "16/9" | "4/5";
  chamfer?: boolean;
  priority?: boolean;
  className?: string;
}

const ratios = { "4/3": "aspect-4/3", "16/9": "aspect-video", "4/5": "aspect-4/5" } as const;

/** Approved photo when one exists; otherwise a decorative girih panel (no hotlinked or stock images). */
export function ImageFrame({ image, sizes, ratio = "4/3", chamfer = false, priority = false, className }: ImageFrameProps) {
  return (
    <div
      className={cn(
        "band relative overflow-hidden",
        ratios[ratio],
        chamfer && "[clip-path:polygon(0_0,calc(100%-1.5rem)_0,100%_1.5rem,100%_100%,0_100%)]",
        className,
      )}
    >
      {image?.approvedLocalPath ? (
        <Image
          src={image.approvedLocalPath}
          alt={image.approvedAlt ?? ""}
          fill
          sizes={sizes}
          quality={90}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <GirihPattern className="absolute inset-0 size-full text-on-band-muted" scale={1.25} />
      )}
    </div>
  );
}
