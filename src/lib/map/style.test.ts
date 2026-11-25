import { describe, expect, it } from "vitest";
import { PALETTE_TOKENS } from "@/lib/theme/palette";
import {
  OPENFREEMAP_VECTOR_URL,
  buildMapStyle,
  buildOfflineMapStyle,
  resolveInitialMapStyleStage,
} from "./style";

describe("MapLibre style builder (PMTiles, OpenFreeMap, Portuguese labels, offline fallback)", () => {
  it("builds a self-contained offline style with cream background, Belo Jardim highlight, and inverted mask", () => {
    const style = buildOfflineMapStyle();

    expect(style.version).toBe(8);
    expect(style.sources).toHaveProperty("belo-jardim-boundary");
    expect(style.sources).toHaveProperty("belo-jardim-mask");

    const bgLayer = style.layers.find((layer) => layer.type === "background");
    expect(bgLayer).toBeDefined();
    expect(bgLayer?.paint).toMatchObject({
      "background-color": PALETTE_TOKENS.warmCream,
    });

    const maskLayer = style.layers.find((layer) => layer.id === "belo-jardim-mask-fill");
    expect(maskLayer).toBeDefined();
    expect(maskLayer?.paint).toMatchObject({
      "fill-color": PALETTE_TOKENS.purpleDeep,
    });
  });

  it("uses pmtiles:// vector source when pmtilesUrl is provided, strips commercial POIs, and prioritizes Portuguese labels", () => {
    const style = buildMapStyle({
      pmtilesUrl: "https://cdn.example.org/belo-jardim.pmtiles",
    });

    const vectorSource = style.sources.openmaptiles;
    expect(vectorSource).toBeDefined();
    expect(vectorSource).toMatchObject({
      type: "vector",
      url: "pmtiles://https://cdn.example.org/belo-jardim.pmtiles",
    });

    const poiLayers = style.layers.filter(
      (layer) =>
        ("source-layer" in layer && layer["source-layer"] === "poi") ||
        /\bpoi\b/i.test(layer.id),
    );
    expect(poiLayers).toHaveLength(0);

    const symbolLayers = style.layers.filter((layer) => layer.type === "symbol");
    expect(symbolLayers.length).toBeGreaterThan(0);
    for (const layer of symbolLayers) {
      const textField = JSON.stringify(layer.layout?.["text-field"]);
      expect(textField).toContain("name:pt");
    }

    expect(style.layers.some((layer) => layer.id === "belo-jardim-mask-fill")).toBe(true);
  });

  it("defaults to OpenFreeMap vector source in auto mode when no PMTiles URL is configured", () => {
    const prev = process.env.NEXT_PUBLIC_PMTILES_URL;
    delete process.env.NEXT_PUBLIC_PMTILES_URL;

    try {
      const style = buildMapStyle();
      expect(style.sources.openmaptiles).toMatchObject({
        type: "vector",
        url: "https://tiles.openfreemap.org/planet",
      });
    } finally {
      if (prev !== undefined) {
        process.env.NEXT_PUBLIC_PMTILES_URL = prev;
      }
    }
  });

  it("returns the offline style when mode is explicitly set to offline", () => {
    const style = buildMapStyle({ mode: "offline" });
    expect(style.sources).not.toHaveProperty("openmaptiles");
    expect(style.sources).toHaveProperty("belo-jardim-mask");
    expect(style.glyphs).toBeUndefined();
  });

  it("forces OpenFreeMap vector source when mode is explicitly openfreemap even if NEXT_PUBLIC_PMTILES_URL is set", () => {
    const prev = process.env.NEXT_PUBLIC_PMTILES_URL;
    process.env.NEXT_PUBLIC_PMTILES_URL = "https://cdn.example.org/belo-jardim.pmtiles";

    try {
      expect(resolveInitialMapStyleStage()).toBe("pmtiles");
      const openFreeMapStyle = buildMapStyle({ mode: "openfreemap" });
      expect(openFreeMapStyle.sources.openmaptiles).toMatchObject({
        type: "vector",
        url: OPENFREEMAP_VECTOR_URL,
      });
      expect(openFreeMapStyle.glyphs).toBeTruthy();
    } finally {
      if (prev !== undefined) {
        process.env.NEXT_PUBLIC_PMTILES_URL = prev;
      } else {
        delete process.env.NEXT_PUBLIC_PMTILES_URL;
      }
    }
  });
});
