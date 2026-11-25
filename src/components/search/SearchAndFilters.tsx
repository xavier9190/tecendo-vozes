"use client";

import { List, Map as MapIcon, Search, X } from "lucide-react";
import { useId } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/theme/categories";
import { PALETTE_TOKENS } from "@/lib/theme/palette";

export interface SearchAndFiltersProps {
  query: string;
  onQueryChange: (nextQuery: string) => void;
  selectedCategories: ReadonlySet<CategoryId>;
  onToggleCategory: (categoryId: CategoryId) => void;
  viewMode: "map" | "list";
  onViewModeChange: (mode: "map" | "list") => void;
  resultCount: number;
  totalCount: number;
}

export function SearchAndFilters({
  query,
  onQueryChange,
  selectedCategories,
  onToggleCategory,
  viewMode,
  onViewModeChange,
  resultCount,
  totalCount,
}: SearchAndFiltersProps) {
  const searchInputId = useId();
  const isListView = viewMode === "list";

  const countLabel =
    resultCount === 1
      ? "1 local encontrado"
      : `${resultCount} locais encontrados`;

  const fullCountAnnouncement =
    resultCount !== totalCount
      ? `${countLabel} de ${totalCount}`
      : countLabel;

  const containerPositionClasses = isListView
    ? "relative z-30 w-full shrink-0 px-3 pt-3 md:px-6 md:pt-4"
    : "pointer-events-none relative z-30 w-full shrink-0";

  const searchRowClearanceClasses = "w-full md:max-w-[27rem]";

  return (
    <div
      role="search"
      aria-label="Busca e filtros de locais"
      className={`flex flex-col gap-2 ${containerPositionClasses}`}
    >
      {/* Top-left search bar alone in its row (no extra sibling controls beside it) */}
      <div
        data-testid="search-bar-row"
        className={`pointer-events-auto ${searchRowClearanceClasses}`}
      >
        <div className="relative flex min-h-11 items-center rounded-xl border-2 border-tv-purple-deep bg-tv-cream-mint/95 shadow-md focus-within:ring-2 focus-within:ring-tv-coral">
          <label htmlFor={searchInputId} className="sr-only">
            Buscar locais por nome
          </label>
          <Search
            className="pointer-events-none ml-3 h-4 w-4 shrink-0 text-tv-purple-dark"
            aria-hidden="true"
          />
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar local por nome..."
            autoComplete="off"
            className="min-h-11 w-full bg-transparent px-2.5 py-2 text-sm font-medium text-tv-purple-deep placeholder:text-tv-purple-dark/75 focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Limpar busca"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-r-lg text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Map ↔ Accessible List View toggle and live result count */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onViewModeChange(isListView ? "map" : "list")}
          aria-pressed={isListView}
          className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-3.5 py-2 text-sm font-bold text-tv-cream-mint shadow-md transition-colors hover:bg-tv-purple-dark"
        >
          {isListView ? (
            <>
              <MapIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Ver no Mapa</span>
            </>
          ) : (
            <>
              <List className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Visão em Lista</span>
            </>
          )}
        </button>

        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-tv-lavender bg-tv-cream-mint/95 px-2.5 py-1.5 text-xs font-bold text-tv-purple-deep shadow-xs"
        >
          {fullCountAnnouncement}
        </p>
      </div>

      {/* Multi-select category filter chips (horizontal scroll on mobile, wrapped on desktop) */}
      <div
        role="group"
        aria-label="Filtrar por categoria"
        className="pointer-events-auto flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible md:pb-0"
      >
        {CATEGORIES.map((category) => {
          const isSelected = selectedCategories.has(category.id);
          const CategoryIcon = category.icon;

          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggleCategory(category.id)}
              aria-pressed={isSelected}
              style={{
                borderColor: isSelected
                  ? PALETTE_TOKENS.coral
                  : category.borderColor,
              }}
              className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border-2 px-3 py-1.5 text-xs font-bold shadow-xs transition-colors ${
                isSelected
                  ? "bg-tv-purple-deep text-tv-cream-mint"
                  : "bg-tv-cream-mint/95 text-tv-purple-deep hover:bg-tv-cream-butter"
              }`}
            >
              <span
                aria-hidden="true"
                style={{
                  backgroundColor: category.markerBg,
                  color: category.markerIconColor,
                }}
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
              >
                <CategoryIcon className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
