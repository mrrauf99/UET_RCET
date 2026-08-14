import { cn } from "@/lib/cn";
import { GirihPattern } from "./GirihPattern";

interface GirihSeamProps {
  /** Plays the one-time draw-in; use on the hero only. */
  animate?: boolean;
  className?: string;
}

export function GirihSeam({ animate = false, className }: GirihSeamProps) {
  return (
    <div aria-hidden="true" className={cn("band h-4 overflow-hidden", className)}>
      <GirihPattern className={cn("block size-full text-on-band-muted", animate && "girih-draw")} scale={0.34} />
    </div>
  );
}
