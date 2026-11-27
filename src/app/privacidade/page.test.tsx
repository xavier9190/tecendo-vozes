import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import PrivacidadePage from "./page";

afterEach(cleanup);

describe("Política de Privacidade (/privacidade)", () => {
  it("renders main landmark, heading hierarchy, and navigation links back to map and terms with >=44px touch targets", () => {
    render(<PrivacidadePage />);

    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "conteudo-principal");

    const h1 = within(main).getByRole("heading", { level: 1 });
    expect(h1).toHaveTextContent(/política de privacidade/i);

    const h2s = within(main).getAllByRole("heading", { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(4);

    const backLinks = screen.getAllByRole("link", { name: /voltar ao mapa/i });
    expect(backLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of backLinks) {
      expect(link).toHaveAttribute("href", "/");
      expect(link.className).toContain("min-h-11");
      expect(link.className).toContain("min-w-11");
    }

    const termsLinks = screen.getAllByRole("link", { name: /termos de uso/i });
    expect(termsLinks.length).toBeGreaterThanOrEqual(1);
    for (const link of termsLinks) {
      expect(link).toHaveAttribute("href", "/termos");
      expect(link.className).toContain("min-h-11");
      expect(link.className).toContain("min-w-11");
    }
  });

  it("covers all LGPD zero-tracking requirements, local geolocation, Vercel, youtube-nocookie, and incognito guidance without personal names or contact blocks", () => {
    render(<PrivacidadePage />);

    const main = screen.getByRole("main");
    expect(main).toHaveTextContent(/sem login|ausência.*login|não exige login/i);
    expect(main).toHaveTextContent(/zero cookies|nenhum cookie|sem cookies de rastreamento/i);
    expect(main).toHaveTextContent(/analytics/i);
    expect(main).toHaveTextContent(/histórico/i);

    expect(main).toHaveTextContent(/geolocalização/i);
    expect(main).toHaveTextContent(/navegador/i);
    expect(main).toHaveTextContent(/nunca.*enviad|não.*enviad|não.*armazenad/i);

    expect(main).toHaveTextContent(/vercel/i);
    expect(main).toHaveTextContent(/logs técnicos/i);
    expect(main).toHaveTextContent(/youtube-nocookie\.com/i);
    expect(main).toHaveTextContent(/privacidade avançada/i);

    expect(main).toHaveTextContent(/navegação anônima|aba anônima|guia anônima/i);
    expect(main).toHaveTextContent(/compartilh/i);

    expect(main).not.toHaveTextContent(/pedro xavier/i);
    expect(main).not.toHaveTextContent(/contato e responsável/i);
  });

  it("renders inline EmergencyBar with permanent disclaimer, tel: links, and footer without navigation buttons", () => {
    render(<PrivacidadePage />);

    const emergency = screen.getByTestId("emergency-bar");
    expect(emergency).toHaveTextContent(
      "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.",
    );

    for (const number of ["180", "190", "192", "197", "100"]) {
      expect(
        within(emergency).getByRole("link", { name: new RegExp(`ligar para ${number}`, "i") }),
      ).toHaveAttribute("href", `tel:${number}`);
    }

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).queryAllByRole("link")).toHaveLength(0);
  });
});
