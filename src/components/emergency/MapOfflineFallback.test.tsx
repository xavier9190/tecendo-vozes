import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MapOfflineFallback } from "./MapOfflineFallback";

afterEach(cleanup);

describe("MapOfflineFallback", () => {
  it("displays a friendly Portuguese message, switches to List View, and keeps disclaimer + tel: links actionable", () => {
    const onSwitchToList = vi.fn();

    render(
      <MapOfflineFallback
        errorMessage="Falha de rede ao carregar tiles"
        onSwitchToList={onSwitchToList}
      />,
    );

    const region = screen.getByRole("region", {
      name: /mapa indisponível|modo offline/i,
    });
    expect(region).toBeInTheDocument();
    expect(region).toHaveTextContent(
      /não foi possível carregar o mapa interativo/i,
    );
    expect(region).toHaveTextContent(
      "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.",
    );

    const listButton = screen.getByRole("button", { name: /visão em lista/i });
    expect(listButton.className).toContain("min-h-11");
    expect(listButton.className).toContain("min-w-11");
    fireEvent.click(listButton);
    expect(onSwitchToList).toHaveBeenCalledTimes(1);

    for (const num of ["180", "190", "192", "197", "100"]) {
      const link = screen.getByRole("link", {
        name: new RegExp(`ligar para ${num}`, "i"),
      });
      expect(link).toHaveAttribute("href", `tel:${num}`);
      expect(link.className).toContain("min-h-11");
    }

    const whatsappLink = screen.getByRole("link", { name: /whatsapp.*180/i });
    expect(whatsappLink).toHaveAttribute("href", "https://wa.me/556196100180");
  });
});
