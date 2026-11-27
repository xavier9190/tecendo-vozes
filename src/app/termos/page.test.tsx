import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import TermosPage from "./page";

afterEach(cleanup);

describe("Termos de Uso (/termos)", () => {
  it("renders main landmark, heading hierarchy, and navigation links back to map and privacy policy with >=44px touch targets", () => {
    render(<TermosPage />);

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "conteudo-principal");

    const h1 = within(main).getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/termos de uso/i);

    const h2s = within(main).getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(3);

    const backLinks = screen.getAllByRole("link", { name: /voltar ao mapa/i });
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of backLinks) {
      expect(link).toHaveAttribute("href", "/");
      expect(link.className).toContain("min-h-11");
      expect(link.className).toContain("min-w-11");
    }

    const privacyLinks = screen.getAllByRole("link", { name: /política de privacidade/i });
    expect(privacyLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of privacyLinks) {
      expect(link).toHaveAttribute("href", "/privacidade");
      expect(link.className).toContain("min-h-11");
      expect(link.className).toContain("min-w-11");
    }
  });

  it("covers informative purpose in Belo Jardim, non-official character, LGPD authorization policy, strict ban on shelters, and usage responsibilities without personal names or contact blocks", () => {
    render(<TermosPage />);

    const main = screen.getByRole("main");
    expect(main).toHaveTextContent(/belo jardim/i);
    expect(main).toHaveTextContent(/informativ/i);
    expect(main).toHaveTextContent(/não é um canal oficial|caráter não oficial/i);
    expect(main).toHaveTextContent(/180/);
    expect(main).toHaveTextContent(/190/);
    expect(main).toHaveTextContent(/192/);

    expect(main).toHaveTextContent(/autorizacoes\.json/i);
    expect(main).toHaveTextContent(/autorização lgpd/i);
    expect(main).toHaveTextContent(/abrigos|casas de acolhimento/i);
    expect(main).toHaveTextContent(/proibi|sigilos/i);

    expect(main).not.toHaveTextContent(/pedro xavier/i);
    expect(main).not.toHaveTextContent(/contato e responsável/i);
  });

  it("renders inline EmergencyBar and footer without navigation buttons", () => {
    render(<TermosPage />);

    const emergency = screen.getByTestId("emergency-bar");
    expect(emergency).toHaveTextContent(
      "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.",
    );

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).queryAllByRole("link")).toHaveLength(0);
  });
});
