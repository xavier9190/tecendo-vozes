import type { Local } from "@/lib/data/schema";
import { normalizeText } from "@/lib/text/normalize";
import type { CategoryId } from "@/lib/theme/categories";

export { normalizeText };

export interface PlaceFilterCriteria {
  query: string;
  selectedCategories: ReadonlySet<CategoryId> | readonly CategoryId[];
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
