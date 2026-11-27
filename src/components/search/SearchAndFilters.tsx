"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";
import { CATEGORIES, type CategoryId } from "@/lib/theme/categories";

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
        <div className="relative flex min-h-11 items-center rounded-full bg-[#ffffff] shadow-[0_2px_6px_rgba(0,0,0,0.16),0_1px_2px_rgba(0,0,0,0.08)] transition-shadow focus-within:shadow-[0_4px_12px_rgba(0,0,0,0.2)] focus-within:ring-2 focus-within:ring-[#dadce0]">
          <label htmlFor={searchInputId} className="sr-only">
            Buscar locais por nome
          </label>
          <Search
            className="pointer-events-none ml-3.5 h-4 w-4 shrink-0 text-[#5f6368]"
            aria-hidden="true"
          />
          <input
            id={searchInputId}
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Buscar local por nome..."
            autoComplete="off"
            className="min-h-11 w-full bg-transparent px-2.5 py-2 text-sm font-normal text-[#202124] placeholder:text-[#5f6368] focus:outline-none [&::-webkit-search-cancel-button]:appearance-none"
          />
          {query.length > 0 ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Limpar busca"
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-r-full text-[#5f6368] transition-colors hover:bg-[#f1f3f4] hover:text-[#202124]"
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
          className="no-scrollbar pointer-events-auto flex flex-nowrap items-center gap-1.5 overflow-x-auto pb-1.5"
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
                className={`inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-[#202124] text-[#ffffff] shadow-[0_2px_6px_rgba(0,0,0,0.22)] hover:bg-[#3c4043]"
                    : "bg-[#ffffff] text-[#202124] shadow-[0_1px_3px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.08)] hover:bg-[#f1f3f4]"
                }`}
              >
                <CategoryIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
