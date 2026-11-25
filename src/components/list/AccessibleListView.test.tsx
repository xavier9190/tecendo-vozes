import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Local } from "@/lib/data/schema";
import { AccessibleListView } from "./AccessibleListView";

afterEach(cleanup);

const SAMPLE_PLACES: readonly Local[] = [
  {
    id: "ubs-centro",
    nome: "UBS Centro — Saúde da Mulher",
    categoria: "saude",
    descricaoCurta: "Atendimento integral à saúde da mulher.",
    distrito: "Sede",
    endereco: "Rua Coronel Antônio Marinho, 145",
    coordinates: [-36.424, -8.3358],
    verificado: true,
  },
  {
    id: "biblioteca-tecer",
    nome: "Biblioteca Comunitária Tecer",
    categoria: "arte-cultura",
    descricaoCurta: "Clube de leitura feminino e oficinas de escrita.",
    distrito: "Sede",
    endereco: "Rua Siqueira Campos, 77",
    coordinates: [-36.4268, -8.3349],
    verificado: false,
  },
];

describe("AccessibleListView", () => {
  it("renders a semantic list of places with category badges, verification badge, and keyboard-activatable detail buttons", async () => {
    const user = userEvent.setup();
    const onSelectPlace = vi.fn();

    render(
      <AccessibleListView
        places={SAMPLE_PLACES}
        selectedPlaceId="ubs-centro"
        onSelectPlace={onSelectPlace}
        onClearFilters={vi.fn()}
      />,
    );

    const list = screen.getByRole("list", { name: /lista de locais/i });
    const items = within(list).getAllByRole("listitem");
    expect(items).toHaveLength(2);

    expect(within(items[0]).getByText("Saúde")).toBeInTheDocument();
    expect(within(items[0]).getByText("Verificado")).toBeInTheDocument();
    expect(within(items[0]).getByText(/Atendimento integral/i)).toBeInTheDocument();
    expect(within(items[0]).getByText(/Rua Coronel Antônio Marinho, 145/i)).toBeInTheDocument();

    expect(within(items[1]).getByText("Arte e cultura")).toBeInTheDocument();
    expect(within(items[1]).queryByText("Verificado")).not.toBeInTheDocument();

    const firstButton = within(items[0]).getByRole("button", {
      name: /ver detalhes de UBS Centro — Saúde da Mulher/i,
    });
    expect(firstButton).toHaveAttribute("aria-pressed", "true");
    expect(firstButton.className).toContain("min-h-11");

    const secondButton = within(items[1]).getByRole("button", {
      name: /ver detalhes de Biblioteca Comunitária Tecer/i,
    });
    expect(secondButton).toHaveAttribute("aria-pressed", "false");

    secondButton.focus();
    await user.keyboard("{Enter}");
    expect(onSelectPlace).toHaveBeenCalledWith(SAMPLE_PLACES[1]);
  });

  it("renders an accessible empty state with a Limpar filtros button when no places match", async () => {
    const user = userEvent.setup();
    const onClearFilters = vi.fn();

    render(
      <AccessibleListView
        places={[]}
        selectedPlaceId={null}
        onSelectPlace={vi.fn()}
        onClearFilters={onClearFilters}
      />,
    );

    expect(screen.getByText(/nenhum local encontrado/i)).toBeInTheDocument();
    const clearButton = screen.getByRole("button", { name: /limpar filtros/i });
    expect(clearButton.className).toContain("min-h-11");
    expect(clearButton.className).toContain("min-w-11");

    await user.click(clearButton);
    expect(onClearFilters).toHaveBeenCalledTimes(1);
  });

  it("renders accessible footer links to /privacidade and /termos with >= 44px touch targets", () => {
    render(
      <AccessibleListView
        places={SAMPLE_PLACES}
        selectedPlaceId={null}
        onSelectPlace={vi.fn()}
        onClearFilters={vi.fn()}
      />,
    );

    const footer = screen.getByRole("contentinfo");
    const privacyLink = within(footer).getByRole("link", {
      name: /política de privacidade/i,
    });
    expect(privacyLink).toHaveAttribute("href", "/privacidade");
    expect(privacyLink.className).toContain("min-h-11");
    expect(privacyLink.className).toContain("min-w-11");

    const termsLink = within(footer).getByRole("link", { name: /termos de uso/i });
    expect(termsLink).toHaveAttribute("href", "/termos");
    expect(termsLink.className).toContain("min-h-11");
    expect(termsLink.className).toContain("min-w-11");
  });
});
