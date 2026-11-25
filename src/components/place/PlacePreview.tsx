"use client";

import { MapPin, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Local } from "@/lib/data/schema";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";
import { PlaceBadges } from "./place-helpers";

export interface PlacePreviewProps {
  place: Local;
  onClose: () => void;
  onOpenDetails: (place: Local) => void;
  handleEscape?: boolean;
}

/**
 * Responsive place preview: Bottom Sheet (~1/3) on mobile (< md) and left side panel (~1/4) on desktop (>= md).
 */
export function PlacePreview({
  place,
  onClose,
  onOpenDetails,
  handleEscape = true,
}: PlacePreviewProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useFocusRestore(true, panelRef);

  useEffect(() => {
    if (!handleEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleEscape]);

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label={`Pré-visualização de ${place.nome}`}
      className="pointer-events-auto flex flex-col justify-between gap-3 overflow-y-auto border-2 border-tv-purple-deep bg-tv-cream-mint p-4 text-tv-purple-deep shadow-xl focus:outline-none max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:h-[34dvh] max-md:min-h-[220px] max-md:rounded-t-2xl md:relative md:z-40 md:max-h-full md:w-[25vw] md:min-w-[300px] md:max-w-[380px] md:rounded-2xl"
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
      </div>
    </section>
  );
}
