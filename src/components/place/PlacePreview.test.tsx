import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Local } from "@/lib/data/schema";
import { PlacePreview } from "./PlacePreview";

const VERIFIED_PLACE: Local = {
  id: "ubs-centro-saude-mulher",
  nome: "UBS Centro — Espaço Saúde da Mulher",
  categoria: "saude",
  descricaoCurta:
    "Pré-natal, exames preventivos, planejamento reprodutivo e acompanhamento ginecológico.",
  distrito: "Sede",
  endereco: "Rua Coronel Antônio Marinho, 145, Centro, Belo Jardim - PE",
  coordinates: [-36.424, -8.3358],
  verificado: true,
  dataVerificacao: "2026-10-18",
};

afterEach(cleanup);

describe("PlacePreview", () => {
  it("renders unified responsive preview content with category badge, verification, directions, details action, and >=44px close button", () => {
    render(
      <PlacePreview
        place={VERIFIED_PLACE}
        onClose={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    const preview = screen.getByRole("region", {
      name: /pré-visualização de ubs centro/i,
    });
    expect(preview).toBeInTheDocument();

    // Responsive presentation classes: mobile Bottom Sheet (~1/3) + desktop Left Side Panel (~1/4 below search bar and filters)
    expect(preview.className).toContain("max-md:h-[34dvh]");
    expect(preview.className).toContain("max-md:bottom-0");
    expect(preview.className).toContain("md:top-60");
    expect(preview.className).toContain("md:w-1/4");
    expect(preview.className).toContain("z-40");

    // Core content rendered once (same DOM in mobile and desktop)
    expect(
      screen.getByRole("heading", { level: 2, name: VERIFIED_PLACE.nome }),
    ).toBeInTheDocument();
    expect(screen.getByText("Saúde")).toBeInTheDocument();
    expect(screen.getByText(/verificado/i)).toBeInTheDocument();
    expect(screen.getByText(VERIFIED_PLACE.descricaoCurta)).toBeInTheDocument();
    expect(screen.getByText(/Sede/)).toBeInTheDocument();
    expect(screen.getByText(/Rua Coronel Antônio Marinho, 145/)).toBeInTheDocument();

    const detailsButton = screen.getByRole("button", { name: /ver detalhes/i });
    expect(detailsButton.className).toContain("min-h-11");

    const directionsLink = screen.getByRole("link", { name: /como chegar/i });
    expect(directionsLink).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/directions?to=-8.3358%2C-36.424",
    );
    expect(directionsLink).toHaveAttribute("target", "_blank");
    expect(directionsLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(directionsLink.className).toContain("min-h-11");

    const closeButton = screen.getByRole("button", {
      name: /fechar pré-visualização/i,
    });
    expect(closeButton.className).toContain("min-h-11");
    expect(closeButton.className).toContain("min-w-11");
  });

  it("shows unverified status and triggers onOpenDetails and onClose from buttons and Escape", () => {
    const onClose = vi.fn();
    const onOpenDetails = vi.fn();
    const unverifiedPlace: Local = {
      ...VERIFIED_PLACE,
      id: "biblioteca-tecer",
      nome: "Biblioteca Comunitária Tecer",
      categoria: "arte-cultura",
      verificado: false,
      dataVerificacao: undefined,
    };

    render(
      <PlacePreview
        place={unverifiedPlace}
        onClose={onClose}
        onOpenDetails={onOpenDetails}
      />,
    );

    expect(screen.getByText(/aguardando verificação/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /ver detalhes/i }));
    expect(onOpenDetails).toHaveBeenCalledWith(unverifiedPlace);

    fireEvent.click(
      screen.getByRole("button", { name: /fechar pré-visualização/i }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("restores focus to the previously focused trigger element when closed", () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Abrir marcador
          </button>
          {open ? (
            <PlacePreview
              place={VERIFIED_PLACE}
              onClose={() => setOpen(false)}
              onOpenDetails={vi.fn()}
            />
          ) : null}
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: /abrir marcador/i });
    trigger.focus();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    const closeBtn = screen.getByRole("button", {
      name: /fechar pré-visualização/i,
    });
    expect(closeBtn).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(
      screen.queryByRole("button", { name: /fechar pré-visualização/i }),
    ).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
