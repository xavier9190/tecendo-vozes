import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { EmergencyBar } from "./EmergencyBar";

afterEach(cleanup);

describe("EmergencyBar", () => {
  it("renders the exact permanent non-official disclaimer and all required tel: and WhatsApp 180 links", () => {
    render(<EmergencyBar />);

    const region = screen.getByRole("complementary", {
      name: /emergência/i,
    });
    expect(region).toBeInTheDocument();
    expect(region).toHaveTextContent(
      "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.",
    );

    const expectedTelLinks = [
      { label: /ligar para 180/i, href: "tel:180" },
      { label: /ligar para 190/i, href: "tel:190" },
      { label: /ligar para 192/i, href: "tel:192" },
      { label: /ligar para 197/i, href: "tel:197" },
      { label: /ligar para 100/i, href: "tel:100" },
    ];

    for (const item of expectedTelLinks) {
      const link = screen.getByRole("link", { name: item.label });
      expect(link).toHaveAttribute("href", item.href);
      expect(link.className).toContain("min-h-11");
      expect(link.className).toContain("min-w-11");
    }

    const whatsappLink = screen.getByRole("link", { name: /whatsapp.*180/i });
    expect(whatsappLink).toHaveAttribute("href", "https://wa.me/556196100180");
    expect(whatsappLink).toHaveAttribute("target", "_blank");
    expect(whatsappLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(whatsappLink.className).toContain("min-h-11");
  });

  it("supports floating variant positioning without hiding when a place is selected", () => {
    const { rerender } = render(<EmergencyBar variant="floating" isPlaceSelected={false} />);
    const floatingBar = screen.getByTestId("emergency-bar");
    expect(floatingBar.className).toContain("absolute");

    rerender(<EmergencyBar variant="floating" isPlaceSelected={true} />);
    expect(screen.getByTestId("emergency-bar")).toBeVisible();
    expect(screen.getByTestId("emergency-bar")).toHaveTextContent(
      "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.",
    );
  });
});
