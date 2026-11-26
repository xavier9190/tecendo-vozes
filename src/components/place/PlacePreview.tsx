"use client";

import { Clock, MapPin, X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { Local } from "@/lib/data/schema";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";
import { getCategoryToken } from "@/lib/theme/categories";
import { PlaceBadges } from "./place-helpers";

export interface PlacePreviewProps {
  place: Local;
  onClose: () => void;
  onOpenDetails: (place: Local) => void;
  handleEscape?: boolean;
}

/**
 * Responsive place preview: Bottom Sheet on mobile (< md) and Google Maps-style ~1/3 left drawer on desktop (>= md).
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

  const firstPhoto = place.midia?.fotos?.[0];
  const category = getCategoryToken(place.categoria);
  const CategoryIcon = category.icon;

  return (
    <section
      ref={panelRef}
      tabIndex={-1}
      role="region"
      aria-label={`Pré-visualização de ${place.nome}`}
      className="animate-tv-place-panel pointer-events-auto flex flex-col overflow-hidden border-2 border-tv-purple-deep bg-tv-cream-mint text-tv-purple-deep shadow-2xl focus:outline-none max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:max-h-[48dvh] max-md:min-h-[240px] max-md:rounded-t-2xl md:relative md:z-40 md:h-full md:max-h-full md:w-[32vw] md:min-w-[340px] md:max-w-[420px] md:rounded-2xl"
    >
      <div className="relative shrink-0 border-b border-tv-lavender/60 bg-tv-cream-warm">
        {firstPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            data-testid="place-preview-image"
            src={firstPhoto.url}
            alt={firstPhoto.alt}
            className="h-32 w-full object-cover md:h-48"
          />
        ) : (
          <div
            data-testid="place-preview-image-placeholder"
            style={{
              backgroundColor: category.badgeBg,
              color: category.badgeText,
            }}
            className="flex h-28 w-full flex-col items-center justify-center gap-1.5 px-4 text-center md:h-40"
          >
            <span
              style={{
                backgroundColor: category.markerBg,
                color: category.markerIconColor,
              }}
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-tv-purple-deep shadow-sm"
            >
              <CategoryIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-extrabold uppercase tracking-wide">
              {category.label} · {place.distrito}
            </span>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar pré-visualização"
          className="absolute top-3 right-3 inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-tv-purple-deep bg-tv-cream-mint/95 text-tv-purple-deep shadow-md transition-colors hover:bg-tv-cream-butter"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-between gap-4 overflow-y-auto p-4 md:p-5">
        <div className="space-y-3">
          <PlaceBadges place={place} />

          <h2 className="text-lg font-extrabold leading-snug text-tv-purple-deep md:text-xl">
            {place.nome}
          </h2>

          <p className="text-sm leading-relaxed text-tv-purple-dark">
            {place.descricaoCurta}
          </p>

          <div className="space-y-2 border-t border-tv-lavender/50 pt-3">
            <p className="flex items-start gap-2 text-xs font-medium text-tv-purple-deep md:text-sm">
              <MapPin
                className="mt-0.5 h-4 w-4 shrink-0 text-tv-coral"
                aria-hidden="true"
              />
              <span>
                <strong className="font-bold">{place.distrito}</strong> —{" "}
                {place.endereco}
              </span>
            </p>

            {place.horarioFuncionamento ? (
              <p className="flex items-start gap-2 text-xs font-medium text-tv-purple-dark md:text-sm">
                <Clock
                  className="mt-0.5 h-4 w-4 shrink-0 text-tv-purple-mid"
                  aria-hidden="true"
                />
                <span>{place.horarioFuncionamento}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0 pt-1">
          <button
            type="button"
            onClick={() => onOpenDetails(place)}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-tv-purple-deep px-4 py-3 text-sm font-bold text-tv-cream-mint shadow-sm transition-colors hover:bg-tv-purple-dark"
          >
            Conhecer mais
          </button>
        </div>
      </div>
    </section>
  );
}
