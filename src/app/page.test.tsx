import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import RootLayout, { metadata } from "./layout";
import HomePage from "./page";
import { PALETTE_COLORS } from "@/lib/theme/palette";

describe("base Next.js shell, layout, and WCAG theme tokens", () => {
  it("configures Portuguese metadata, lang='pt-BR', skip-to-content link, and zero tracking scripts", () => {
    expect(metadata.title).toContain("Tecendo Vozes");
    const html = renderToStaticMarkup(
      <RootLayout>
        <main id="conteudo-principal">Conteúdo</main>
      </RootLayout>,
    );

    expect(html).toContain('lang="pt-BR"');
    expect(html).toContain('href="#conteudo-principal"');
    expect(html).toContain("Ir para o conteúdo principal");
    expect(html).not.toMatch(/googletagmanager|google-analytics|gtag|clarity|hotjar/i);
  });

  it("renders the responsive base shell with Tecendo Vozes structure and all 6 category tokens", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /tecendo vozes/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo-principal");

    const expectedLabels = [
      "Saúde",
      "Proteção e apoio",
      "Apoio público",
      "Artesanato",
      "Arte e cultura",
      "Empreendedoras",
    ];

    for (const label of expectedLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("defines all 12 official palette CSS tokens, rem typography, focus rings, and prefers-reduced-motion", () => {
    const cssPath = path.resolve(import.meta.dirname, "./globals.css");
    const css = readFileSync(cssPath, "utf8");

    for (const hex of PALETTE_COLORS) {
      expect(css.toLowerCase()).toContain(hex.toLowerCase());
    }
    expect(css).toContain("rem");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
