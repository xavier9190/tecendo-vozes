"use client";

import { WifiOff } from "lucide-react";
import { EmergencyBar } from "./EmergencyBar";

export interface MapOfflineFallbackProps {
  errorMessage?: string | null;
  className?: string;
}

export function MapOfflineFallback({
  errorMessage,
  className = "",
}: MapOfflineFallbackProps) {
  return (
    <section
      data-testid="map-offline-fallback"
      role="region"
      aria-label="Mapa indisponível — modo offline"
      className={`pointer-events-auto absolute inset-x-3 top-48 z-[35] mx-auto max-h-[calc(100dvh-13.5rem)] max-w-lg overflow-y-auto rounded-3xl border-2 border-tv-purple-deep bg-tv-cream-mint/95 p-4 text-tv-purple-deep shadow-2xl backdrop-blur-xs md:top-1/2 md:max-h-[75dvh] md:-translate-y-1/2 md:p-6 ${className}`.trim()}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-tv-cream-butter text-tv-coral">
            <WifiOff className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-extrabold text-tv-purple-deep md:text-lg">
              Mapa interativo indisponível no momento
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-tv-purple-dark">
              Não foi possível carregar o mapa interativo (conexão lenta ou modo offline). Os
              canais de emergência continuam acessíveis abaixo.
            </p>
            {errorMessage ? (
              <p className="mt-1 text-xs font-medium text-tv-purple-dark">
                Detalhe: {errorMessage}
              </p>
            ) : null}
          </div>
        </div>

        <EmergencyBar variant="inline" />
      </div>
    </section>
  );
}
