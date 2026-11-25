import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES, type CategoryId } from "@/lib/theme/categories";
import { SearchAndFilters } from "./SearchAndFilters";

afterEach(cleanup);

describe("SearchAndFilters", () => {
  it("renders the top-left search bar alone in its row, clear button when non-empty, and polite count", () => {
    const onQueryChange = vi.fn();

    const { rerender } = render(
      <SearchAndFilters
        query=""
        onQueryChange={onQueryChange}
        selectedCategories={new Set<CategoryId>()}
        onToggleCategory={vi.fn()}
        viewMode="map"
        onViewModeChange={vi.fn()}
        resultCount={12}
        totalCount={12}
      />,
    );

    const searchRegion = screen.getByRole("search", { name: /busca e filtros/i });
    expect(searchRegion.className).toContain("md:top-4");
    expect(searchRegion.className).toContain("md:left-4");

    const searchRow = screen.getByTestId("search-bar-row");
    expect(within(searchRow).queryAllByRole("button")).toHaveLength(0);

    const searchInput = screen.getByRole("searchbox", { name: /buscar locais por nome/i });
    expect(searchInput).toHaveValue("");
    expect(screen.queryByRole("button", { name: /limpar busca/i })).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: "Saude" } });
    expect(onQueryChange).toHaveBeenCalledWith("Saude");

    rerender(
      <SearchAndFilters
        query="Saude"
        onQueryChange={onQueryChange}
        selectedCategories={new Set<CategoryId>()}
        onToggleCategory={vi.fn()}
        viewMode="map"
        onViewModeChange={vi.fn()}
        resultCount={1}
        totalCount={12}
      />,
    );

    const clearBtn = screen.getByRole("button", { name: /limpar busca/i });
    expect(clearBtn.className).toContain("min-h-11");
    expect(clearBtn.className).toContain("min-w-11");
    fireEvent.click(clearBtn);
    expect(onQueryChange).toHaveBeenCalledWith("");

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent(/1 local encontrado/i);
  });

  it("renders all 6 category chips with aria-pressed, icon, label, and toggles multi-select", () => {
    const onToggleCategory = vi.fn();

    render(
      <SearchAndFilters
        query=""
        onQueryChange={vi.fn()}
        selectedCategories={new Set<CategoryId>(["saude", "artesanato"])}
        onToggleCategory={onToggleCategory}
        viewMode="map"
        onViewModeChange={vi.fn()}
        resultCount={4}
        totalCount={12}
      />,
    );

    const filterGroup = screen.getByRole("group", { name: /filtrar por categoria/i });
    expect(filterGroup.className).toContain("overflow-x-auto");

    for (const category of CATEGORIES) {
      const chip = within(filterGroup).getByRole("button", { name: category.label });
      const expectedPressed =
        category.id === "saude" || category.id === "artesanato" ? "true" : "false";
      expect(chip).toHaveAttribute("aria-pressed", expectedPressed);
      expect(chip.className).toContain("min-h-11");
      expect(chip.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    }

    fireEvent.click(within(filterGroup).getByRole("button", { name: "Proteção e apoio" }));
    expect(onToggleCategory).toHaveBeenCalledWith("protecao-apoio");
  });

  it("toggles between Mapa and Visão em Lista with accessible state", () => {
    const onViewModeChange = vi.fn();

    const { rerender } = render(
      <SearchAndFilters
        query=""
        onQueryChange={vi.fn()}
        selectedCategories={new Set<CategoryId>()}
        onToggleCategory={vi.fn()}
        viewMode="map"
        onViewModeChange={onViewModeChange}
        resultCount={12}
        totalCount={12}
      />,
    );

    const toListBtn = screen.getByRole("button", { name: /visão em lista/i });
    expect(toListBtn).toHaveAttribute("aria-pressed", "false");
    expect(toListBtn.className).toContain("min-h-11");
    fireEvent.click(toListBtn);
    expect(onViewModeChange).toHaveBeenCalledWith("list");

    rerender(
      <SearchAndFilters
        query=""
        onQueryChange={vi.fn()}
        selectedCategories={new Set<CategoryId>()}
        onToggleCategory={vi.fn()}
        viewMode="list"
        onViewModeChange={onViewModeChange}
        resultCount={12}
        totalCount={12}
      />,
    );

    const toMapBtn = screen.getByRole("button", { name: /ver no mapa/i });
    expect(toMapBtn).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(toMapBtn);
    expect(onViewModeChange).toHaveBeenCalledWith("map");
  });
});
