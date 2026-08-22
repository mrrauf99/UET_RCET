import { cn } from "@/lib/cn";
import { GirihPattern } from "./GirihPattern";

interface GirihSeamProps {
  /** Plays the one-time draw-in; use on the hero only. */
  animate?: boolean;
}

export function GirihSeam({ animate = false }: GirihSeamProps) {
  return (
    <div aria-hidden="true" className="band h-4 overflow-hidden">
      <GirihPattern className={cn("block size-full text-on-band-muted", animate && "girih-draw")} scale={0.34} />
    </div>
  );
}
