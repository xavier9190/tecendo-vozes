"use client";

import { BadgeCheck, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";
import { PROJECT_INFO } from "@/components/emergency/EmergencyConstants";
import type { Local } from "@/lib/data/schema";
import { getCategoryToken } from "@/lib/theme/categories";

export interface AccessibleListViewProps {
  places: readonly Local[];
  selectedPlaceId: string | null;
  onSelectPlace: (place: Local) => void;
  onClearFilters: () => void;
}

export function AccessibleListView({
  places,
  selectedPlaceId,
  onSelectPlace,
  onClearFilters,
}: AccessibleListViewProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-3 pt-3 pb-56 md:px-6 md:pb-36">
      <section aria-label="Visão em Lista de locais">
        {places.length === 0 ? (
        <div
          role="status"
          className="mx-auto mt-6 flex max-w-lg flex-col items-center gap-4 rounded-2xl border-2 border-tv-purple-dark bg-tv-cream-mint p-6 text-center shadow-sm"
        >
          <p className="text-base font-bold text-tv-purple-deep">
            Nenhum local encontrado com os filtros atuais.
          </p>
          <p className="text-sm text-tv-purple-dark">
            Tente buscar outro nome ou limpar os filtros de categoria para ver todos os locais de Belo Jardim.
          </p>
          <button
            type="button"
            onClick={onClearFilters}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-5 py-2.5 text-sm font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <ul
          role="list"
          aria-label="Lista de locais filtrados"
          className="mx-auto grid max-w-5xl grid-cols-1 gap-3 md:grid-cols-2"
        >
          {places.map((place) => {
            const category = getCategoryToken(place.categoria);
            const CategoryIcon = category.icon;
            const isSelected = selectedPlaceId === place.id;

            return (
              <li key={place.id}>
                <article
                  className={`flex h-full flex-col justify-between gap-3 rounded-2xl border-2 bg-tv-cream-mint p-4 shadow-xs transition-colors ${
                    isSelected
                      ? "border-tv-coral ring-2 ring-tv-coral"
                      : "border-tv-lavender"
                  }`}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        style={{
                          backgroundColor: category.badgeBg,
                          color: category.badgeText,
                          borderColor: category.borderColor,
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            backgroundColor: category.markerBg,
                            color: category.markerIconColor,
                          }}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full"
                        >
                          <CategoryIcon className="h-3 w-3" aria-hidden="true" />
                        </span>
                        <span>{category.label}</span>
                      </span>

                      {place.verificado ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-tv-purple-dark bg-tv-cream-butter px-2.5 py-0.5 text-xs font-bold text-tv-purple-deep">
                          <BadgeCheck className="h-3.5 w-3.5 text-tv-purple-deep" aria-hidden="true" />
                          <span>Verificado</span>
                        </span>
                      ) : null}
                    </div>

                    <h2 className="text-base font-bold text-tv-purple-deep">
                      {place.nome}
                    </h2>

                    <p className="text-sm text-tv-purple-dark">
                      {place.descricaoCurta}
                    </p>

                    <p className="flex items-start gap-1.5 text-xs font-medium text-tv-purple-deep">
                      <MapPin
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tv-coral"
                        aria-hidden="true"
                      />
                      <span>
                        {place.distrito} — {place.endereco}
                      </span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onSelectPlace(place)}
                    aria-pressed={isSelected}
                    aria-label={`Ver detalhes de ${place.nome}`}
                    className="inline-flex min-h-11 min-w-11 items-center justify-between gap-2 rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-4 py-2 text-sm font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
                  >
                    <span>Ver detalhes</span>
                    <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      )}
      </section>

      <footer className="mx-auto mt-8 flex max-w-5xl flex-col gap-3 rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-4 text-tv-purple-deep shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-semibold text-tv-purple-dark">
          {PROJECT_INFO.name} — Privacidade zero-rastreamento · Responsável LGPD:{" "}
          {PROJECT_INFO.lgpdContactName}
        </p>
        <nav aria-label="Links legais" className="flex flex-wrap items-center gap-2">
          <Link
            href="/privacidade"
            prefetch={false}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-4 py-2 text-xs font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark sm:text-sm"
          >
            Política de Privacidade
          </Link>
          <Link
            href="/termos"
            prefetch={false}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-4 py-2 text-xs font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter sm:text-sm"
          >
            Termos de Uso
          </Link>
        </nav>
      </footer>
    </div>
  );
}
