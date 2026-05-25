import { useId, useMemo } from "react";

import { sparkData, toPaths } from "@/lib/sparkline";
import { cn } from "@/lib/utils";

type Props = {
  seed: string;
  trend: string;
  width?: number;
  height?: number;
  className?: string;
  /** Render axis labels (year markers). Use only on the detail page. */
  showAxis?: boolean;
};

export default function Sparkline({
  seed, trend, width = 140, height = 44, className, showAxis = false,
}: Props) {
  const gradId = useId();
  const { line, area } = useMemo(() => {
    return toPaths(sparkData(seed, trend), width, height);
  }, [seed, trend, width, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={cn("overflow-visible", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="hsl(150 50% 30%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(150 50% 30%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke="hsl(150 50% 28%)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {showAxis && (
        <g className="font-mono" fontSize="9" fill="hsl(150 8% 55%)">
          <text x={2} y={height - 1}>2023</text>
          <text x={width / 2 - 10} y={height - 1}>2024</text>
          <text x={width - 22} y={height - 1}>2026</text>
        </g>
      )}
    </svg>
  );
}
