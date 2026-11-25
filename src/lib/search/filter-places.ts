import type { Local } from "@/lib/data/schema";
import type { CategoryId } from "@/lib/theme/categories";

export interface PlaceFilterCriteria {
  query: string;
  selectedCategories: ReadonlySet<CategoryId> | readonly CategoryId[];
}

/**
 * Normalizes text for accent- and case-insensitive client-side matching.
 */
export function normalizeText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function toCategorySet(
  selectedCategories: ReadonlySet<CategoryId> | readonly CategoryId[],
): ReadonlySet<CategoryId> {
  return selectedCategories instanceof Set
    ? selectedCategories
    : new Set(selectedCategories);
}

/**
 * Filters places strictly on the client using normalized name search and multi-select categories.
 */
export function filterPlaces(
  places: readonly Local[],
  criteria: PlaceFilterCriteria,
): Local[] {
  const normalizedQuery = normalizeText(criteria.query);
  const categorySet = toCategorySet(criteria.selectedCategories);
  const hasCategoryFilter = categorySet.size > 0;

  if (!normalizedQuery && !hasCategoryFilter) {
    return [...places];
  }

  return places.filter((place) => {
    if (hasCategoryFilter && !categorySet.has(place.categoria)) {
      return false;
    }

    if (normalizedQuery) {
      return normalizeText(place.nome).includes(normalizedQuery);
    }

    return true;
  });
}
