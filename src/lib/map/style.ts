import type { GeoJSONSourceSpecification, LayerSpecification, StyleSpecification } from "maplibre-gl";
import {
  buildBeloJardimBoundaryGeoJson,
  buildInvertedMaskGeoJson,
} from "@/lib/geo/belo-jardim";
import { PALETTE_TOKENS } from "@/lib/theme/palette";

export const OPENFREEMAP_VECTOR_URL = "https://tiles.openfreemap.org/planet";
export const OPENFREEMAP_GLYPHS_URL =
  "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf";

export const PORTUGUESE_LABEL_EXPRESSION = [
  "coalesce",
  ["get", "name:pt"],
  ["get", "name"],
] as unknown as string;

export type MapStyleStage = "pmtiles" | "openfreemap" | "offline";

export interface BuildMapStyleOptions {
  pmtilesUrl?: string;
  mode?: "auto" | MapStyleStage;
}

export function getConfiguredPmtilesUrl(pmtilesUrl?: string): string {
  return (pmtilesUrl ?? process.env.NEXT_PUBLIC_PMTILES_URL ?? "").trim();
}

export function resolveInitialMapStyleStage(pmtilesUrl?: string): "pmtiles" | "openfreemap" {
  return getConfiguredPmtilesUrl(pmtilesUrl) ? "pmtiles" : "openfreemap";
}

function buildMaskAndBoundarySources(): Record<string, GeoJSONSourceSpecification> {
  return {
    "belo-jardim-boundary": {
      type: "geojson",
      data: buildBeloJardimBoundaryGeoJson() as unknown as GeoJSONSourceSpecification["data"],
    },
    "belo-jardim-mask": {
      type: "geojson",
      data: buildInvertedMaskGeoJson() as unknown as GeoJSONSourceSpecification["data"],
    },
  };
}

const INVERTED_MASK_LAYERS: LayerSpecification[] = [
  {
    id: "belo-jardim-mask-fill",
    type: "fill",
    source: "belo-jardim-mask",
    paint: {
      "fill-color": PALETTE_TOKENS.purpleDeep,
      "fill-opacity": 0.42,
    },
  },
  {
    id: "belo-jardim-border",
    type: "line",
    source: "belo-jardim-boundary",
    paint: {
      "line-color": PALETTE_TOKENS.purpleDark,
      "line-width": 2.5,
      "line-opacity": 0.9,
    },
  },
];

/**
 * Builds an inline GeoJSON-only fallback style with zero network requests,
 * used when tiles fail to load (offline/3G failure) or in offline mode.
 */
export function buildOfflineMapStyle(): StyleSpecification {
  return {
    version: 8,
    name: "Tecendo Vozes Offline",
    sources: buildMaskAndBoundarySources(),
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": PALETTE_TOKENS.warmCream,
        },
      },
      {
        id: "belo-jardim-area",
        type: "fill",
        source: "belo-jardim-boundary",
        paint: {
          "fill-color": PALETTE_TOKENS.mintCream,
          "fill-opacity": 0.95,
        },
      },
      ...INVERTED_MASK_LAYERS,
    ],
  };
}

/**
 * Builds the MapLibre style for Belo Jardim – PE using PMTiles (when configured)
 * or OpenFreeMap vector tiles, enforcing Portuguese labels and omitting commercial POIs.
 */
export function buildMapStyle(options?: BuildMapStyleOptions): StyleSpecification {
  if (options?.mode === "offline") {
    return buildOfflineMapStyle();
  }

  const configuredPmtiles =
    options?.mode === "openfreemap" ? "" : getConfiguredPmtilesUrl(options?.pmtilesUrl);

  const vectorUrl = configuredPmtiles
    ? configuredPmtiles.startsWith("pmtiles://")
      ? configuredPmtiles
      : `pmtiles://${configuredPmtiles}`
    : OPENFREEMAP_VECTOR_URL;

  const vectorLayers: LayerSpecification[] = [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": PALETTE_TOKENS.warmCream,
      },
    },
    {
      id: "landuse-residential",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", ["residential", "suburb", "neighbourhood"]]],
      paint: {
        "fill-color": PALETTE_TOKENS.butterCream,
        "fill-opacity": 0.35,
      },
    },
    {
      id: "park-green",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: {
        "fill-color": PALETTE_TOKENS.mintCream,
        "fill-opacity": 0.85,
      },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: {
        "fill-color": PALETTE_TOKENS.lavenderLight,
        "fill-opacity": 0.85,
      },
    },
    {
      id: "waterway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      paint: {
        "line-color": PALETTE_TOKENS.lavender,
        "line-width": 1.5,
      },
    },
    {
      id: "building",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "building",
      minzoom: 14,
      paint: {
        "fill-color": PALETTE_TOKENS.lavenderLight,
        "fill-opacity": 0.45,
        "fill-outline-color": PALETTE_TOKENS.lavender,
      },
    },
    {
      id: "road-minor",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["minor", "service", "track", "path"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": "#ffffff",
        "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 16, 4.5],
      },
    },
    {
      id: "road-secondary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["secondary", "tertiary"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": PALETTE_TOKENS.mintCream,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.5, 16, 6],
      },
    },
    {
      id: "road-primary-casing",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["primary", "trunk", "motorway"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": PALETTE_TOKENS.lavender,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 3, 16, 10],
      },
    },
    {
      id: "road-primary",
      type: "line",
      source: "openmaptiles",
      "source-layer": "transportation",
      filter: ["in", ["get", "class"], ["literal", ["primary", "trunk", "motorway"]]],
      layout: {
        "line-cap": "round",
        "line-join": "round",
      },
      paint: {
        "line-color": PALETTE_TOKENS.butterCream,
        "line-width": ["interpolate", ["linear"], ["zoom"], 11, 2, 16, 8],
      },
    },
    {
      id: "road-label-pt",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "transportation_name",
      minzoom: 13,
      layout: {
        "symbol-placement": "line",
        "text-field": PORTUGUESE_LABEL_EXPRESSION,
        "text-font": ["Noto Sans Regular"],
        "text-size": 11,
      },
      paint: {
        "text-color": PALETTE_TOKENS.purpleDark,
        "text-halo-color": PALETTE_TOKENS.warmCream,
        "text-halo-width": 1.5,
      },
    },
    {
      id: "place-label-pt",
      type: "symbol",
      source: "openmaptiles",
      "source-layer": "place",
      filter: ["in", ["get", "class"], ["literal", ["town", "village", "suburb", "neighbourhood", "hamlet"]]],
      layout: {
        "text-field": PORTUGUESE_LABEL_EXPRESSION,
        "text-font": ["Noto Sans Bold"],
        "text-size": ["interpolate", ["linear"], ["zoom"], 11, 12, 15, 16],
      },
      paint: {
        "text-color": PALETTE_TOKENS.purpleDeep,
        "text-halo-color": PALETTE_TOKENS.mintCream,
        "text-halo-width": 2,
      },
    },
    ...INVERTED_MASK_LAYERS,
  ];

  return {
    version: 8,
    name: "Tecendo Vozes Belo Jardim",
    glyphs: OPENFREEMAP_GLYPHS_URL,
    sources: {
      openmaptiles: {
        type: "vector",
        url: vectorUrl,
        attribution: "© OpenStreetMap contributors",
      },
      ...buildMaskAndBoundarySources(),
    },
    layers: vectorLayers,
  };
}
