"use client";

import { List, WifiOff } from "lucide-react";
import { EmergencyBar } from "./EmergencyBar";

export interface MapOfflineFallbackProps {
  errorMessage?: string | null;
  onSwitchToList: () => void;
  className?: string;
}

export function MapOfflineFallback({
  errorMessage,
  onSwitchToList,
  className = "",
}: MapOfflineFallbackProps) {
  return (
    <section
      data-testid="map-offline-fallback"
      role="region"
      aria-label="Mapa indisponível — modo offline e Visão em Lista"
      className={`pointer-events-auto absolute inset-x-3 top-20 z-20 mx-auto max-h-[72dvh] max-w-lg overflow-y-auto rounded-3xl border-2 border-tv-purple-deep bg-tv-cream-mint/95 p-4 text-tv-purple-deep shadow-2xl backdrop-blur-xs md:top-1/2 md:-translate-y-1/2 md:p-6 ${className}`.trim()}
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
              Não foi possível carregar o mapa interativo (conexão lenta ou modo offline). Todos os
              locais e contatos de emergência continuam acessíveis na Visão em Lista.
            </p>
            {errorMessage ? (
              <p className="mt-1 text-xs text-tv-purple-mid">Detalhe: {errorMessage}</p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={onSwitchToList}
          className="inline-flex min-h-11 min-w-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-tv-purple-deep bg-tv-purple-deep px-5 py-3 text-sm font-bold text-tv-cream-mint shadow-sm transition-colors hover:bg-tv-purple-dark md:text-base"
        >
          <List className="h-5 w-5 shrink-0 text-tv-amber" aria-hidden="true" />
          <span>Ir para Visão em Lista</span>
        </button>

        <EmergencyBar variant="inline" />
      </div>
    </section>
  );
}
