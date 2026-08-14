import { useId } from "react";
import { cn } from "@/lib/cn";

const TILE = 48;
const OUTER = 20;
// Inner radius where two overlapping squares cross, giving the classic 8-fold khatam star.
const INNER = (OUTER * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);

function starPath(cx: number, cy: number) {
  const points = Array.from({ length: 16 }, (_, index) => {
    const radius = index % 2 === 0 ? OUTER : INNER;
    const angle = (index * Math.PI) / 8 - Math.PI / 2;
    return `${(cx + radius * Math.cos(angle)).toFixed(2)} ${(cy + radius * Math.sin(angle)).toFixed(2)}`;
  });
  return `M${points.join("L")}Z`;
}

const STAR = starPath(TILE / 2, TILE / 2);
const HALF = TILE / 2;
// Diamonds at the tile corners close the gaps between neighbouring stars.
const DIAMOND = `M0 ${HALF - 4}L4 ${HALF}L0 ${HALF + 4}M${TILE} ${HALF - 4}L${TILE - 4} ${HALF}L${TILE} ${HALF + 4}M${HALF - 4} 0L${HALF} 4L${HALF + 4} 0M${HALF - 4} ${TILE}L${HALF} ${TILE - 4}L${HALF + 4} ${TILE}`;

interface GirihPatternProps {
  className?: string;
  scale?: number;
}

export function GirihPattern({ className, scale = 1 }: GirihPatternProps) {
  // React ids can contain characters that break url(#id) references.
  const id = `girih-${useId().replace(/[^\w-]/g, "")}`;
  const size = TILE * scale;

  return (
    <svg data-girih aria-hidden="true" focusable="false" className={cn("pointer-events-none", className)}>
      <defs>
        <pattern id={id} width={size} height={size} patternUnits="userSpaceOnUse">
          <g transform={`scale(${scale})`} fill="none" stroke="currentColor" strokeWidth={1 / scale}>
            <path d={STAR} />
            <path d={DIAMOND} />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
