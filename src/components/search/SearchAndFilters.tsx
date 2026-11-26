"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/theme/categories";
import { PALETTE_TOKENS } from "@/lib/theme/palette";

export interface SearchAndFiltersProps {
  query: string;
  onQueryChange: (nextQuery: string) => void;
  selectedCategories: ReadonlySet<CategoryId>;
  onToggleCategory: (categoryId: CategoryId) => void;
}

export function SearchAndFilters({
  query,
  onQueryChange,
  selectedCategories,
  onToggleCategory,
}: SearchAndFiltersProps) {
  const searchInputId = useId();

  return (
    <div
      role="search"
      aria-label="Busca e filtros de locais"
      className="pointer-events-none relative z-30 flex w-full shrink-0 flex-col gap-2"
    >
      {/* Top-left search bar alone in its row */}
      <div data-testid="search-bar-row" className="pointer-events-auto w-full">
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

      {/* Category filter chips (below search on mobile, beside search on desktop with hidden scrollbar) */}
      <div className="md:fixed md:top-4 md:left-[calc(clamp(340px,32vw,420px)+2rem)] md:right-52 md:z-30">
        <div
          role="group"
          aria-label="Filtrar por categoria"
          className="no-scrollbar pointer-events-auto flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0"
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
    </div>
  );
}
