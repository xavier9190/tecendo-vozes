import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Local } from "@/lib/data/schema";
import { PlaceDetailsModal } from "./PlaceDetailsModal";

const FULL_PLACE: Local = {
  id: "casa-das-artesas-agua-fria",
  nome: "Casa das Artesãs de Água Fria",
  categoria: "artesanato",
  descricaoCurta: "Associação de mulheres produtoras de bordado manual e cerâmica.",
  descricaoCompleta:
    "Coletivo formado por artesãs do distrito de Água Fria que organiza feiras locais e oficinas.",
  distrito: "Água Fria",
  endereco: "Rua da Matriz, 32, Distrito de Água Fria, Belo Jardim - PE",
  coordinates: [-36.3554, -8.3852],
  horarioFuncionamento: "Terça a sábado, 09h às 17h",
  telefone: "(81) 3726-1040",
  whatsapp: "5581993104422",
  instagram: "@artesasaguafria",
  site: "https://artesasaguafria.example.org",
  verificado: true,
  dataVerificacao: "2026-10-30",
  midia: {
    fotos: [
      {
        url: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
        alt: "Mostruário de bordado e cerâmica",
      },
      {
        url: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E",
        alt: "Oficina coletiva de artesanato",
      },
    ],
    youtubeVideoId: "ScMzIvxBSi4",
  },
};

const MINIMAL_PLACE: Local = {
  id: "nucleo-cohab",
  nome: "Núcleo Comunitário — Cohab",
  categoria: "protecao-apoio",
  descricaoCurta: "Plantão de orientação jurídica gratuita.",
  distrito: "Sede",
  endereco: "Rua Projetada 12, 54, Cohab I, Belo Jardim - PE",
  coordinates: [-36.4335, -8.3412],
  verificado: false,
};

afterEach(cleanup);

describe("PlaceDetailsModal", () => {
  it("renders nothing when closed and renders accessible dialog with full details, contacts, verification date, and Como chegar when open", () => {
    const { rerender } = render(
      <PlaceDetailsModal place={FULL_PLACE} isOpen={false} onClose={vi.fn()} />,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <PlaceDetailsModal place={FULL_PLACE} isOpen={true} onClose={vi.fn()} />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    const labelledBy = dialog.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy!)?.textContent).toBe(
      FULL_PLACE.nome,
    );

    expect(screen.getByText(FULL_PLACE.descricaoCompleta!)).toBeInTheDocument();
    expect(
      screen.getByText(/Água Fria — Rua da Matriz, 32/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(FULL_PLACE.horarioFuncionamento!),
    ).toBeInTheDocument();
    expect(screen.getByText(/Local verificado em 30\/10\/2026/)).toBeInTheDocument();

    const phoneLink = screen.getByRole("link", { name: /\(81\) 3726-1040/ });
    expect(phoneLink).toHaveAttribute("href", "tel:8137261040");

    const whatsappLink = screen.getByRole("link", { name: /whatsapp/i });
    expect(whatsappLink).toHaveAttribute("href", "https://wa.me/5581993104422");
    expect(whatsappLink).toHaveAttribute("target", "_blank");
    expect(whatsappLink).toHaveAttribute("rel", "noopener noreferrer");

    const instagramLink = screen.getByRole("link", { name: /@artesasaguafria/i });
    expect(instagramLink).toHaveAttribute(
      "href",
      "https://instagram.com/artesasaguafria",
    );

    const siteLink = screen.getByRole("link", { name: /site oficial/i });
    expect(siteLink).toHaveAttribute("href", FULL_PLACE.site);

    const directionsLink = screen.getByRole("link", { name: /como chegar/i });
    expect(directionsLink).toHaveAttribute(
      "href",
      "https://www.google.com/maps/dir/?api=1&destination=-8.3852%2C-36.3554",
    );
    expect(directionsLink).toHaveAttribute("target", "_blank");
    expect(directionsLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("shows friendly fallbacks when horarioFuncionamento and optional fields are absent", () => {
    render(
      <PlaceDetailsModal place={MINIMAL_PLACE} isOpen={true} onClose={vi.fn()} />,
    );

    expect(screen.getByText(MINIMAL_PLACE.descricaoCurta)).toBeInTheDocument();
    expect(screen.getByText("Horário não informado")).toBeInTheDocument();
    expect(screen.getByText(/aguardando verificação/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /whatsapp/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /site oficial/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
  });

  it("renders youtube-nocookie iframe with privacy note and accessible keyboard-navigable photo gallery when media is present", () => {
    render(
      <PlaceDetailsModal place={FULL_PLACE} isOpen={true} onClose={vi.fn()} />,
    );

    const iframe = screen.getByTitle(/vídeo.*casa das artesãs de água fria/i);
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/ScMzIvxBSi4",
    );
    expect(iframe).toHaveAttribute("allowfullscreen");
    expect(screen.getByText(/youtube-nocookie\.com/i)).toBeInTheDocument();

    const activeImg = screen.getByRole("img", {
      name: "Mostruário de bordado e cerâmica",
    });
    expect(activeImg).toBeInTheDocument();

    const secondThumb = screen.getByRole("button", {
      name: /foto 2 de 2.*oficina coletiva de artesanato/i,
    });
    expect(secondThumb).toHaveAttribute("aria-pressed", "false");
    expect(secondThumb.className).toContain("min-h-11");

    fireEvent.click(secondThumb);
    expect(secondThumb).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("img", { name: "Oficina coletiva de artesanato" }),
    ).toBeInTheDocument();
  });

  it("closes on >=44px close button, backdrop click, and Escape without propagating to underlying window listeners, restoring focus", () => {
    const parentEscapeListener = vi.fn();
    window.addEventListener("keydown", parentEscapeListener);

    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button type="button" onClick={() => setOpen(true)}>
            Ver detalhes do local
          </button>
          <PlaceDetailsModal
            place={FULL_PLACE}
            isOpen={open}
            onClose={() => setOpen(false)}
          />
        </div>
      );
    }

    try {
      render(<Harness />);
      const trigger = screen.getByRole("button", {
        name: /ver detalhes do local/i,
      });
      trigger.focus();
      fireEvent.click(trigger);

      const closeBtn = screen.getByRole("button", { name: /fechar detalhes/i });
      expect(closeBtn.className).toContain("min-h-11");
      expect(closeBtn.className).toContain("min-w-11");
      expect(closeBtn).toHaveFocus();

      // Close via Escape
      fireEvent.keyDown(window, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
      expect(parentEscapeListener).not.toHaveBeenCalled();

      // Re-open and close via backdrop click
      fireEvent.click(trigger);
      const backdrop = screen.getByTestId("place-details-backdrop");
      fireEvent.click(backdrop);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();

      // Re-open and close via close button
      fireEvent.click(trigger);
      fireEvent.click(screen.getByRole("button", { name: /fechar detalhes/i }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    } finally {
      window.removeEventListener("keydown", parentEscapeListener);
    }
  });

  it("renders editorial layout with top video banner, side-by-side grid, and bottom logo strip in order", () => {
    const { rerender } = render(
      <PlaceDetailsModal place={FULL_PLACE} isOpen={true} onClose={vi.fn()} />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toContain("h-dvh");
    expect(dialog.className).toContain("w-full");
    expect(dialog.className).toContain("rounded-none");
    expect(dialog.className).toContain("md:w-[60vw]");
    expect(dialog.className).toContain("md:rounded-2xl");

    const videoSection = screen.getByTestId("place-details-video-section");
    const editorialGrid = screen.getByTestId("place-details-editorial-grid");
    const logoStrip = screen.getByTestId("place-details-logo-strip");

    expect(
      Boolean(
        videoSection.compareDocumentPosition(editorialGrid) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    expect(
      Boolean(
        editorialGrid.compareDocumentPosition(logoStrip) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
    ).toBe(true);
    expect(logoStrip).toHaveTextContent(/tecendo vozes/i);
    expect(logoStrip).toHaveTextContent(/régua de logos/i);

    // Minimal place keeps top video placeholder, editorial grid, and logo strip without iframe or img
    rerender(
      <PlaceDetailsModal place={MINIMAL_PLACE} isOpen={true} onClose={vi.fn()} />,
    );
    expect(screen.getByTestId("place-details-video-section")).toHaveTextContent(
      /vídeo de apresentação/i,
    );
    expect(screen.getByTestId("place-details-editorial-grid")).toBeInTheDocument();
    expect(screen.getByTestId("place-details-logo-strip")).toBeInTheDocument();
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
