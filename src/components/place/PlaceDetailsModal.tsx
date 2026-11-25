"use client";

import {
  AtSign,
  Clock,
  Globe,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Local } from "@/lib/data/schema";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";
import {
  PlaceBadges,
  buildInstagramUrl,
  buildOsmDirectionsUrl,
  buildTelHref,
  buildWhatsAppUrl,
} from "./place-helpers";

export interface PlaceDetailsModalProps {
  place: Local | null;
  isOpen: boolean;
  onClose: () => void;
  handleEscape?: boolean;
}

/**
 * Accessible full-details dialog for a selected place.
 */
export function PlaceDetailsModal({
  place,
  isOpen,
  onClose,
  handleEscape = true,
}: PlaceDetailsModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [photoSelection, setPhotoSelection] = useState<{ placeId: string; index: number }>({
    placeId: "",
    index: 0,
  });

  const active = isOpen && Boolean(place);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useFocusRestore(active, closeButtonRef);

  useEffect(() => {
    if (!active) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (handleEscape && event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) {
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [active, handleEscape]);

  if (!isOpen || !place) {
    return null;
  }

  const fotos = place.midia?.fotos ?? [];
  const activePhotoIndex =
    photoSelection.placeId === place.id && photoSelection.index < fotos.length
      ? photoSelection.index
      : 0;
  const activePhoto = fotos[activePhotoIndex];
  const youtubeVideoId = place.midia?.youtubeVideoId;
  const directionsUrl = buildOsmDirectionsUrl(place.coordinates);
  const hasAnyContact = Boolean(
    place.telefone || place.whatsapp || place.instagram || place.site,
  );

  return (
    <div
      data-testid="place-details-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-tv-purple-deep/70 p-3 backdrop-blur-xs sm:p-6"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-tv-purple-deep bg-tv-cream-mint text-tv-purple-deep shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-tv-lavender bg-tv-cream-warm px-4 py-3.5 sm:px-6">
          <div className="space-y-2">
            <PlaceBadges place={place} showVerificationDate />
            <h2
              id={titleId}
              className="text-xl font-extrabold leading-snug text-tv-purple-deep sm:text-2xl"
            >
              {place.nome}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-tv-purple-dark bg-tv-cream-mint text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <p className="text-base leading-relaxed text-tv-purple-deep">
            {place.descricaoCompleta ?? place.descricaoCurta}
          </p>

          {activePhoto ? (
            <section aria-label="Galeria de fotos" className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-tv-purple-dark">
                  Fotos do espaço
                </h3>
                {fotos.length > 1 ? (
                  <span className="text-xs font-semibold text-tv-purple-dark">
                    Foto {activePhotoIndex + 1} de {fotos.length}
                  </span>
                ) : null}
              </div>

              <figure className="overflow-hidden rounded-xl border-2 border-tv-purple-dark bg-tv-cream-warm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activePhoto.url}
                  alt={activePhoto.alt}
                  className="aspect-video w-full object-cover"
                />
                <figcaption className="border-t border-tv-lavender px-3 py-2 text-xs font-medium text-tv-purple-dark">
                  {activePhoto.alt}
                </figcaption>
              </figure>

              {fotos.length > 1 ? (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Miniaturas da galeria">
                  {fotos.map((foto, index) => {
                    const isSelected = index === activePhotoIndex;
                    return (
                      <button
                        key={`${place.id}-foto-${index}`}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`Ver foto ${index + 1} de ${fotos.length}: ${foto.alt}`}
                        onClick={() => setPhotoSelection({ placeId: place.id, index })}
                        className={`min-h-11 min-w-11 overflow-hidden rounded-lg border-2 p-0.5 transition-colors ${
                          isSelected
                            ? "border-tv-coral bg-tv-cream-butter"
                            : "border-tv-lavender bg-tv-cream-warm hover:border-tv-purple-dark"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={foto.url}
                          alt=""
                          aria-hidden="true"
                          className="h-10 w-16 rounded object-cover"
                        />
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </section>
          ) : null}

          {youtubeVideoId ? (
            <section aria-label="Vídeo de apresentação" className="space-y-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-tv-purple-dark">
                Vídeo
              </h3>
              <div className="overflow-hidden rounded-xl border-2 border-tv-purple-dark bg-tv-purple-deep">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                  title={`Vídeo de apresentação: ${place.nome}`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  className="aspect-video w-full border-0"
                />
              </div>
              <p className="text-xs text-tv-purple-dark">
                Reprodução via youtube-nocookie.com (modo de privacidade avançada).
              </p>
            </section>
          ) : null}

          <dl className="grid gap-3 rounded-xl border border-tv-lavender bg-tv-cream-warm p-3.5 text-sm sm:grid-cols-2">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-tv-coral" aria-hidden="true" />
              <div>
                <dt className="font-bold text-tv-purple-deep">Endereço</dt>
                <dd className="text-tv-purple-dark">
                  {place.distrito} — {place.endereco}
                </dd>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-tv-purple-dark" aria-hidden="true" />
              <div>
                <dt className="font-bold text-tv-purple-deep">Horário de funcionamento</dt>
                <dd className="text-tv-purple-dark">
                  {place.horarioFuncionamento ?? "Horário não informado"}
                </dd>
              </div>
            </div>
          </dl>

          {hasAnyContact ? (
            <section aria-label="Contatos" className="space-y-2">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-tv-purple-dark">
                Contatos
              </h3>
              <div className="flex flex-wrap gap-2">
                {place.telefone ? (
                  <a
                    href={buildTelHref(place.telefone)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-tv-purple-dark bg-tv-cream-warm px-3.5 py-2 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-tv-coral" aria-hidden="true" />
                    <span>{place.telefone}</span>
                  </a>
                ) : null}

                {place.whatsapp ? (
                  <a
                    href={buildWhatsAppUrl(place.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-tv-purple-dark bg-tv-cream-warm px-3.5 py-2 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                  >
                    <MessageCircle
                      className="h-4 w-4 shrink-0 text-tv-purple-dark"
                      aria-hidden="true"
                    />
                    <span>WhatsApp</span>
                  </a>
                ) : null}

                {place.instagram ? (
                  <a
                    href={buildInstagramUrl(place.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-tv-purple-dark bg-tv-cream-warm px-3.5 py-2 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                  >
                    <AtSign className="h-4 w-4 shrink-0 text-tv-coral" aria-hidden="true" />
                    <span>{place.instagram}</span>
                  </a>
                ) : null}

                {place.site ? (
                  <a
                    href={place.site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-tv-purple-dark bg-tv-cream-warm px-3.5 py-2 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                  >
                    <Globe className="h-4 w-4 shrink-0 text-tv-purple-dark" aria-hidden="true" />
                    <span>Site oficial</span>
                  </a>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>

        <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-tv-lavender bg-tv-cream-warm px-4 py-3 sm:px-6">
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-tv-purple-deep px-4 py-2.5 text-sm font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
          >
            <Navigation className="h-4 w-4 shrink-0 text-tv-amber" aria-hidden="true" />
            <span>Como chegar</span>
          </a>
        </footer>
      </div>
    </div>
  );
}
