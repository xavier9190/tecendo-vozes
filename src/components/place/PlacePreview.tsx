"use client";

import { MapPin, Navigation, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Local } from "@/lib/data/schema";
import { PlaceBadges, buildOsmDirectionsUrl } from "./place-helpers";

export interface PlacePreviewProps {
  place: Local;
  onClose: () => void;
  onOpenDetails: (place: Local) => void;
}

/**
 * Responsive place preview: Bottom Sheet (~1/3) on mobile (< md) and left side panel (~1/4) on desktop (>= md).
 */
export function PlacePreview({ place, onClose, onOpenDetails }: PlacePreviewProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const directionsUrl = buildOsmDirectionsUrl(place.coordinates);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    panelRef.current?.focus({ preventScroll: true });

    return () => {
      if (previousFocus && previousFocus.isConnected && previousFocus !== document.body) {
        previousFocus.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label={`Pré-visualização de ${place.nome}`}
      className="fixed z-40 flex flex-col justify-between gap-3 overflow-y-auto border-2 border-tv-purple-deep bg-tv-cream-mint p-4 text-tv-purple-deep shadow-xl focus:outline-none max-md:inset-x-0 max-md:bottom-0 max-md:h-[34dvh] max-md:min-h-[220px] max-md:rounded-t-2xl md:top-60 md:bottom-4 md:left-4 md:w-1/4 md:min-w-[300px] md:max-w-[380px] md:rounded-2xl"
    >
      <div className="space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <PlaceBadges place={place} />

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar pré-visualização"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-tv-purple-dark bg-tv-cream-warm text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <h2 className="text-lg font-extrabold leading-snug text-tv-purple-deep">
          {place.nome}
        </h2>

        <p className="text-sm leading-relaxed text-tv-purple-dark">{place.descricaoCurta}</p>

        <p className="flex items-start gap-1.5 text-xs font-medium text-tv-purple-deep">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tv-coral" aria-hidden="true" />
          <span>
            <strong className="font-bold">{place.distrito}</strong> — {place.endereco}
          </span>
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => onOpenDetails(place)}
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-tv-purple-deep px-4 py-2.5 text-sm font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
        >
          Ver detalhes
        </button>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-3.5 py-2.5 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
        >
          <Navigation className="h-4 w-4 shrink-0 text-tv-coral" aria-hidden="true" />
          <span>Como chegar</span>
        </a>
      </div>
    </section>
  );
}
