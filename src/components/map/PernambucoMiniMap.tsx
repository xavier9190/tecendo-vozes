"use client";

import {
  PERNAMBUCO_OUTLINE_PATH,
  PERNAMBUCO_SVG_VIEWBOX,
  projectCoordsToPernambucoSvg,
} from "@/lib/geo/belo-jardim";
import { PALETTE_TOKENS } from "@/lib/theme/palette";

export interface PernambucoMiniMapProps {
  center: readonly [number, number];
  hidden?: boolean;
  className?: string;
}

export function PernambucoMiniMap({
  center,
  hidden = false,
  className = "",
}: PernambucoMiniMapProps) {
  if (hidden) {
    return null;
  }

  const point = projectCoordsToPernambucoSvg(center[0], center[1]);
  const formattedCoords = `${center[1].toFixed(3)}, ${center[0].toFixed(3)}`;

  return (
    <section
      data-testid="pernambuco-minimap"
      aria-label={`Mini-mapa de Pernambuco destacando a área visualizada em Belo Jardim – PE (${formattedCoords})`}
      className={`pointer-events-auto w-28 rounded-xl border-2 border-tv-purple-dark bg-tv-cream-mint/95 p-2 text-tv-purple-deep shadow-md backdrop-blur-xs md:w-44 md:p-2.5 ${className}`.trim()}
    >
      <div className="mb-1 flex items-center justify-between gap-1 text-[0.6875rem] font-bold leading-tight text-tv-purple-deep md:text-xs">
        <span>Pernambuco</span>
        <span className="hidden rounded-full bg-tv-cream-butter px-1.5 py-0.5 text-[0.625rem] font-semibold text-tv-purple-deep md:inline-block">
          Belo Jardim
        </span>
      </div>

      <svg
        viewBox={PERNAMBUCO_SVG_VIEWBOX}
        role="img"
        aria-hidden="true"
        className="block h-auto w-full overflow-visible"
      >
        <path
          d={PERNAMBUCO_OUTLINE_PATH}
          fill={PALETTE_TOKENS.butterCream}
          stroke={PALETTE_TOKENS.purpleDark}
          strokeWidth={2.5}
          strokeLinejoin="round"
        />

        <circle
          cx={point.x}
          cy={point.y}
          r={11}
          fill={PALETTE_TOKENS.coral}
          fillOpacity={0.25}
          className="motion-safe:animate-pulse"
        />

        <circle
          cx={point.x}
          cy={point.y}
          r={7.5}
          fill={PALETTE_TOKENS.mintCream}
          stroke={PALETTE_TOKENS.purpleDeep}
          strokeWidth={2}
        />

        <circle
          data-testid="minimap-marker-dot"
          cx={point.x}
          cy={point.y}
          r={4.2}
          fill={PALETTE_TOKENS.coral}
          stroke={PALETTE_TOKENS.purpleDeep}
          strokeWidth={1.2}
        />
      </svg>
    </section>
  );
}
