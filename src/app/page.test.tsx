import { readFileSync } from "node:fs";
import path from "node:path";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PALETTE_COLORS } from "@/lib/theme/palette";

vi.mock("maplibre-gl", () => {
  class MockMap {
    on = vi.fn().mockReturnThis();
    off = vi.fn().mockReturnThis();
    addSource = vi.fn();
    getSource = vi.fn();
    addLayer = vi.fn();
    getLayer = vi.fn();
    setStyle = vi.fn();
    queryRenderedFeatures = vi.fn(() => []);
    easeTo = vi.fn();
    getCenter = vi.fn(() => ({ lng: -36.424, lat: -8.3358 }));
    getZoom = vi.fn(() => 13);
    getBounds = vi.fn(() => ({
      getWest: () => -36.62,
      getSouth: () => -8.52,
      getEast: () => -36.22,
      getNorth: () => -8.15,
    }));
    getCanvas = vi.fn(() => ({ style: { cursor: "" } }));
    remove = vi.fn();
  }
  class MockMarker {
    setLngLat = vi.fn().mockReturnThis();
    addTo = vi.fn().mockReturnThis();
    remove = vi.fn();
  }
  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      addProtocol: vi.fn(),
      setWorkerUrl: vi.fn(),
    },
    Map: MockMap,
    Marker: MockMarker,
    addProtocol: vi.fn(),
    setWorkerUrl: vi.fn(),
  };
});

vi.mock("pmtiles", () => ({
  Protocol: class MockProtocol {
    tile = vi.fn();
  },
}));

import RootLayout, { metadata } from "./layout";
import HomePage from "./page";

afterEach(cleanup);

describe("HomePage MapShell, layout, and WCAG theme tokens", () => {
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

  it("renders the interactive Belo Jardim map shell and Pernambuco mini-map on HomePage", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: /tecendo vozes/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "conteudo-principal");
    expect(screen.getByTestId("belo-jardim-map-canvas")).toBeInTheDocument();
    expect(screen.getByTestId("pernambuco-minimap")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /voltar ao centro/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /minha localização/i })).toBeInTheDocument();
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
