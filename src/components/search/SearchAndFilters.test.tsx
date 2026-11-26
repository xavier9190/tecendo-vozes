import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CATEGORIES, type CategoryId } from "@/lib/theme/categories";
import { SearchAndFilters } from "./SearchAndFilters";

afterEach(cleanup);

describe("SearchAndFilters", () => {
  it("renders the top-left search bar alone in its row, clear button when non-empty, and omits result counter and List View toggle", () => {
    const onQueryChange = vi.fn();

    const { rerender } = render(
      <SearchAndFilters
        query=""
        onQueryChange={onQueryChange}
        selectedCategories={new Set<CategoryId>()}
        onToggleCategory={vi.fn()}
      />,
    );

    const searchRegion = screen.getByRole("search", { name: /busca e filtros/i });
    expect(searchRegion).toBeInTheDocument();
    expect(searchRegion.className).toContain("z-30");

    const searchRow = screen.getByTestId("search-bar-row");
    expect(within(searchRow).queryAllByRole("button")).toHaveLength(0);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByText(/locais encontrados/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /visão em lista/i })).not.toBeInTheDocument();

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
      />,
    );

    const clearBtn = screen.getByRole("button", { name: /limpar busca/i });
    expect(clearBtn.className).toContain("min-h-11");
    expect(clearBtn.className).toContain("min-w-11");
    fireEvent.click(clearBtn);
    expect(onQueryChange).toHaveBeenCalledWith("");
  });

  it("renders all 6 category chips with hidden scrollbar horizontal scroll, aria-pressed, icon, label, and multi-select", () => {
    const onToggleCategory = vi.fn();

    render(
      <SearchAndFilters
        query=""
        onQueryChange={vi.fn()}
        selectedCategories={new Set<CategoryId>(["saude", "artesanato"])}
        onToggleCategory={onToggleCategory}
      />,
    );

    const filterGroup = screen.getByRole("group", { name: /filtrar por categoria/i });
    expect(filterGroup.className).toContain("overflow-x-auto");
    expect(filterGroup.className).toContain("no-scrollbar");

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
});
