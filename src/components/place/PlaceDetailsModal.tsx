"use client";

import {
  AtSign,
  Clock,
  Globe,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Play,
  X,
} from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import type { Local } from "@/lib/data/schema";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";
import { PROJECT_INFO } from "@/lib/project-info";
import { getCategoryToken } from "@/lib/theme/categories";
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
  const secondaryPhoto =
    fotos.length > 1 ? fotos[(activePhotoIndex + 1) % fotos.length] : null;
  const youtubeVideoId = place.midia?.youtubeVideoId;
  const directionsUrl = buildOsmDirectionsUrl(place.coordinates);
  const hasAnyContact = Boolean(
    place.telefone || place.whatsapp || place.instagram || place.site,
  );
  const category = getCategoryToken(place.categoria);
  const CategoryIcon = category.icon;
  const hasDistinctFullDescription = Boolean(
    place.descricaoCompleta && place.descricaoCompleta !== place.descricaoCurta,
  );

  return (
    <div
      data-testid="place-details-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-tv-purple-deep/70 p-0 backdrop-blur-xs md:p-6"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden rounded-none border-0 border-tv-purple-deep bg-[#ede7f2] text-tv-purple-deep shadow-2xl md:h-auto md:max-h-[92dvh] md:w-[60vw] md:min-w-[600px] md:rounded-2xl md:border-2"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-2 sm:px-8 sm:pt-5">
          <PlaceBadges place={place} showVerificationDate />

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes"
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-tv-purple-dark/40 bg-tv-cream-mint/95 text-tv-purple-deep shadow-xs transition-colors hover:bg-tv-cream-butter"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-8 overflow-y-auto px-5 pt-2 pb-6 sm:px-8 sm:pb-8">
          {/* Bloco 1: Vídeo de apresentação no topo em largura total */}
          <section
            data-testid="place-details-video-section"
            aria-label="Vídeo de apresentação"
            className="space-y-2"
          >
            {youtubeVideoId ? (
              <>
                <div className="overflow-hidden rounded-xl border-2 border-tv-purple-deep bg-tv-purple-dark shadow-md">
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}`}
                    title={`Vídeo de apresentação: ${place.nome}`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="aspect-video w-full border-0"
                  />
                </div>
                <p className="text-xs font-medium text-tv-purple-dark">
                  Reprodução via youtube-nocookie.com (modo de privacidade avançada).
                </p>
              </>
            ) : (
              <div className="flex aspect-[21/8] min-h-40 w-full flex-col items-center justify-center gap-3 rounded-xl bg-tv-purple-dark px-6 text-center text-tv-cream-mint shadow-md">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-tv-cream-warm/90 shadow-inner">
                  <Play
                    className="h-8 w-8 translate-x-0.5 text-tv-purple-deep"
                    aria-hidden="true"
                  />
                </span>
                <p className="text-sm font-semibold text-tv-cream-warm">
                  Breve vídeo de apresentação em produção
                </p>
              </div>
            )}
          </section>

          {/* Blocos 2 e 3: Grade editorial alternada (texto + imagem lado a lado) */}
          <div
            data-testid="place-details-editorial-grid"
            className="space-y-8"
          >
            {/* Linha 1: Título e história à esquerda | Foto/galeria principal à direita */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
              <div className="space-y-4 md:col-span-6">
                <header className="space-y-3">
                  <h2
                    id={titleId}
                    className="text-2xl font-extrabold leading-tight tracking-tight text-tv-purple-deep sm:text-3xl"
                  >
                    {place.nome}
                  </h2>
                  <div
                    aria-hidden="true"
                    className="h-1 w-20 rounded-full bg-tv-purple-deep"
                  />
                </header>

                <p className="text-base leading-relaxed text-tv-purple-deep">
                  {place.descricaoCompleta ?? place.descricaoCurta}
                </p>

                <div
                  aria-hidden="true"
                  className="mx-auto h-px w-2/3 bg-tv-purple-deep/30 pt-0"
                />
              </div>

              <div className="space-y-3 md:col-span-6">
                {activePhoto ? (
                  <section aria-label="Galeria de fotos" className="space-y-3">
                    <figure className="overflow-hidden rounded-xl border border-tv-lavender bg-tv-cream-mint shadow-xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activePhoto.url}
                        alt={activePhoto.alt}
                        className="aspect-[16/10] w-full object-cover"
                      />
                      <figcaption className="border-t border-tv-lavender/60 bg-tv-cream-warm px-3.5 py-2 text-xs font-medium text-tv-purple-dark">
                        {activePhoto.alt}
                      </figcaption>
                    </figure>

                    {fotos.length > 1 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide text-tv-purple-dark">
                            Fotos do espaço
                          </span>
                          <span className="text-xs font-semibold text-tv-purple-dark">
                            Foto {activePhotoIndex + 1} de {fotos.length}
                          </span>
                        </div>
                        <div
                          className="flex flex-wrap gap-2"
                          role="group"
                          aria-label="Miniaturas da galeria"
                        >
                          {fotos.map((foto, index) => {
                            const isSelected = index === activePhotoIndex;
                            return (
                              <button
                                key={`${place.id}-foto-${index}`}
                                type="button"
                                aria-pressed={isSelected}
                                aria-label={`Ver foto ${index + 1} de ${fotos.length}: ${foto.alt}`}
                                onClick={() =>
                                  setPhotoSelection({ placeId: place.id, index })
                                }
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
                      </div>
                    ) : null}
                  </section>
                ) : (
                  <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border border-tv-lavender/80 bg-tv-cream-warm/80 p-6 text-center">
                    <span
                      style={{
                        backgroundColor: category.markerBg,
                        color: category.markerIconColor,
                      }}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-tv-purple-deep shadow-xs"
                    >
                      <CategoryIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <p className="text-sm font-bold text-tv-purple-deep">
                      {category.label} · {place.distrito}
                    </p>
                    <p className="text-xs font-medium text-tv-purple-dark">
                      Imagens do espaço em breve
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Linha 2 (alternada): Imagem/contexto visual à esquerda | Informações, contatos e rota à direita */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
              <div className="md:col-span-5">
                {secondaryPhoto ? (
                  <figure className="overflow-hidden rounded-xl border border-tv-lavender bg-tv-cream-mint shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={secondaryPhoto.url}
                      alt=""
                      aria-hidden="true"
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <figcaption className="border-t border-tv-lavender/60 bg-tv-cream-warm px-3.5 py-2 text-xs font-medium text-tv-purple-dark">
                      {secondaryPhoto.alt}
                    </figcaption>
                  </figure>
                ) : (
                  <div className="space-y-3 rounded-xl border border-tv-lavender/80 bg-tv-cream-warm/80 p-5">
                    <div className="flex items-center gap-2.5">
                      <span
                        style={{
                          backgroundColor: category.markerBg,
                          color: category.markerIconColor,
                        }}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-tv-purple-deep"
                      >
                        <CategoryIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wide text-tv-purple-dark">
                          {category.label}
                        </p>
                        <p className="text-xs font-semibold text-tv-purple-deep">
                          {place.distrito} · Belo Jardim – PE
                        </p>
                      </div>
                    </div>

                    <p className="text-xs leading-relaxed text-tv-purple-dark">
                      {category.shortDescription}
                    </p>

                    {place.tags && place.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {place.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-tv-lavender bg-tv-cream-mint px-2.5 py-0.5 text-[0.7rem] font-semibold text-tv-purple-deep"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <div className="space-y-4 md:col-span-7">
                {hasDistinctFullDescription ? (
                  <p className="border-l-3 border-tv-purple-mid pl-3.5 text-sm leading-relaxed text-tv-purple-dark">
                    {place.descricaoCurta}
                  </p>
                ) : null}

                <dl className="grid gap-3 rounded-xl border border-tv-lavender bg-tv-cream-warm/90 p-4 text-sm sm:grid-cols-2">
                  <div className="flex items-start gap-2">
                    <MapPin
                      className="mt-0.5 h-4 w-4 shrink-0 text-tv-coral"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="font-bold text-tv-purple-deep">Endereço</dt>
                      <dd className="text-tv-purple-dark">
                        {place.distrito} — {place.endereco}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Clock
                      className="mt-0.5 h-4 w-4 shrink-0 text-tv-purple-dark"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="font-bold text-tv-purple-deep">
                        Horário de funcionamento
                      </dt>
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
                          <Phone
                            className="h-4 w-4 shrink-0 text-tv-coral"
                            aria-hidden="true"
                          />
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
                          <AtSign
                            className="h-4 w-4 shrink-0 text-tv-coral"
                            aria-hidden="true"
                          />
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
                          <Globe
                            className="h-4 w-4 shrink-0 text-tv-purple-dark"
                            aria-hidden="true"
                          />
                          <span>Site oficial</span>
                        </a>
                      ) : null}
                    </div>
                  </section>
                ) : null}

                <div className="flex flex-wrap items-center justify-end pt-1">
                  <a
                    href={directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-tv-purple-deep px-5 py-2.5 text-sm font-bold text-tv-cream-mint shadow-xs transition-colors hover:bg-tv-purple-dark"
                  >
                    <Navigation
                      className="h-4 w-4 shrink-0 text-tv-amber"
                      aria-hidden="true"
                    />
                    <span>Como chegar</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bloco 4: Régua de logo no fim da página */}
          <footer
            data-testid="place-details-logo-strip"
            aria-label="Régua de logos e realização"
            className="rounded-xl border border-tv-lavender/80 bg-tv-cream-warm/95 px-5 py-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tv-purple-deep text-xs font-extrabold text-tv-cream-mint"
                >
                  TV
                </span>
                <div>
                  <p className="text-sm font-extrabold leading-tight text-tv-purple-deep">
                    {PROJECT_INFO.name}
                  </p>
                  <p className="text-xs font-medium text-tv-purple-dark">
                    {PROJECT_INFO.subtitle}
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-tv-lavender bg-tv-cream-mint px-3 py-1 text-xs font-semibold text-tv-purple-dark">
                Realização e Apoio · Régua de logos
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
