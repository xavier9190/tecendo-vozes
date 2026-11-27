"use client";

import { ChevronUp, Clock, MapPin, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
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
  const [isExpanded, setIsExpanded] = useState(false);

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
      className={`animate-tv-place-panel pointer-events-auto flex flex-col border-2 border-tv-purple-deep bg-tv-cream-mint text-tv-purple-deep shadow-2xl focus:outline-none max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:overflow-visible max-md:transition-[height,max-height,border-radius] max-md:duration-350 max-md:ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isExpanded
          ? "max-md:h-[100dvh] max-md:max-h-[100dvh] max-md:rounded-none max-md:border-0"
          : "max-md:h-[48dvh] max-md:max-h-[48dvh] max-md:min-h-[240px] max-md:rounded-t-2xl"
      } md:relative md:z-40 md:h-full md:max-h-full md:w-[32vw] md:min-w-[340px] md:max-w-[420px] md:overflow-hidden md:rounded-2xl`}
    >
      <button
        type="button"
        data-testid="place-preview-expand-toggle"
        onClick={() => setIsExpanded((prev) => !prev)}
        aria-expanded={isExpanded}
        aria-label={
          isExpanded
            ? "Reduzir pré-visualização"
            : "Expandir pré-visualização para tela cheia"
        }
        className={`absolute left-1/2 z-20 inline-flex min-h-11 min-w-11 -translate-x-1/2 items-center justify-center rounded-full transition-[top,transform] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] md:hidden ${
          isExpanded ? "top-3 translate-y-0" : "top-0 -translate-y-1/2"
        }`}
      >
        <span className="inline-flex h-7 w-10 items-center justify-center rounded-full border border-tv-purple-deep/25 bg-[#ffffff] text-tv-purple-deep shadow-[0_2px_6px_rgba(0,0,0,0.2)] transition-colors hover:bg-tv-cream-butter">
          <ChevronUp
            className={`h-4 w-4 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </span>
      </button>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[inherit]">
        <div className="relative shrink-0 border-b border-tv-lavender/60 bg-tv-cream-warm">
          {firstPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              data-testid="place-preview-image"
              src={firstPhoto.url}
              alt={firstPhoto.alt}
              className={`w-full object-cover transition-[height] duration-350 md:h-48 ${
                isExpanded ? "h-48" : "h-32"
              }`}
            />
          ) : (
            <div
              data-testid="place-preview-image-placeholder"
              style={{
                backgroundColor: category.badgeBg,
                color: category.badgeText,
              }}
              className={`flex w-full flex-col items-center justify-center gap-1.5 px-4 text-center transition-[height] duration-350 md:h-40 ${
                isExpanded ? "h-40" : "h-28"
              }`}
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
      </div>
    </section>
  );
}
