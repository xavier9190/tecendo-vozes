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
  horarioFuncionamento: "Segunda a sexta, 07h30 às 16h30",
  verificado: true,
  dataVerificacao: "2026-10-18",
  midia: {
    fotos: [
      {
        url: "https://example.com/ubs-centro.jpg",
        alt: "Fachada da UBS Centro",
      },
    ],
  },
};

afterEach(cleanup);

describe("PlacePreview", () => {
  it("renders Google Maps-style ~1/3 desktop panel / mobile bottom sheet with hero image, description, location, Conhecer mais, and >=44px close button", () => {
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

    // Responsive presentation classes & entrance animation
    expect(preview.className).toContain("animate-tv-place-panel");
    expect(preview.className).toContain("max-md:max-h-[48dvh]");
    expect(preview.className).toContain("max-md:bottom-0");
    expect(preview.className).toContain("md:relative");
    expect(preview.className).toContain("md:w-[32vw]");
    expect(preview.className).toContain("md:z-40");

    // Hero image + core content rendered once (same DOM in mobile and desktop)
    const heroImage = screen.getByTestId("place-preview-image");
    expect(heroImage).toHaveAttribute("src", "https://example.com/ubs-centro.jpg");
    expect(heroImage).toHaveAttribute("alt", "Fachada da UBS Centro");

    expect(
      screen.getByRole("heading", { level: 2, name: VERIFIED_PLACE.nome }),
    ).toBeInTheDocument();
    expect(screen.getByText("Saúde")).toBeInTheDocument();
    expect(screen.getByText(/local verificado/i)).toBeInTheDocument();
    expect(screen.getByText(VERIFIED_PLACE.descricaoCurta)).toBeInTheDocument();
    expect(screen.getByText(/Sede/)).toBeInTheDocument();
    expect(screen.getByText(/Rua Coronel Antônio Marinho, 145/)).toBeInTheDocument();
    expect(screen.getByText(VERIFIED_PLACE.horarioFuncionamento!)).toBeInTheDocument();

    const detailsButton = screen.getByRole("button", { name: /conhecer mais/i });
    expect(detailsButton.className).toContain("min-h-11");

    // "Como chegar" belongs strictly to PlaceDetailsModal (no duplicate route link in preview)
    expect(screen.queryByRole("link", { name: /como chegar/i })).not.toBeInTheDocument();

    const closeButton = screen.getByRole("button", {
      name: /fechar pré-visualização/i,
    });
    expect(closeButton.className).toContain("min-h-11");
    expect(closeButton.className).toContain("min-w-11");
  });

  it("shows graceful photo placeholder, unverified status, and triggers onOpenDetails and onClose from buttons and Escape", () => {
    const onClose = vi.fn();
    const onOpenDetails = vi.fn();
    const unverifiedPlace: Local = {
      ...VERIFIED_PLACE,
      id: "biblioteca-tecer",
      nome: "Biblioteca Comunitária Tecer",
      categoria: "arte-cultura",
      verificado: false,
      dataVerificacao: undefined,
      horarioFuncionamento: undefined,
      midia: undefined,
    };

    render(
      <PlacePreview
        place={unverifiedPlace}
        onClose={onClose}
        onOpenDetails={onOpenDetails}
      />,
    );

    expect(screen.queryByTestId("place-preview-image")).not.toBeInTheDocument();
    expect(screen.getByTestId("place-preview-image-placeholder")).toBeInTheDocument();
    expect(screen.getByText(/aguardando verificação/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /conhecer mais/i }));
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
