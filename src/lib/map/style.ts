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
export type MapTheme = "original" | "rosa";

export interface BuildMapStyleOptions {
  pmtilesUrl?: string;
  mode?: "auto" | MapStyleStage;
  theme?: MapTheme;
}

interface MapThemePalette {
  background: string;
  landuse: string;
  landuseOpacity: number;
  park: string;
  parkOpacity: number;
  water: string;
  waterOpacity: number;
  waterway: string;
  buildingFill: string;
  buildingOpacity: number;
  buildingOutline: string;
  roadMinor: string;
  roadSecondary: string;
  roadPrimaryCasing: string;
  roadPrimary: string;
  roadLabel: string;
  roadLabelHalo: string;
  placeLabel: string;
  placeLabelHalo: string;
  areaFill: string;
  maskFill: string;
  maskOpacity: number;
  boundaryLine: string;
}

export const MAP_THEME_PALETTES: Record<MapTheme, MapThemePalette> = {
  original: {
    background: "#edeae2",
    landuse: "#e2ded5",
    landuseOpacity: 0.55,
    park: "#c5e4be",
    parkOpacity: 0.9,
    water: "#9cc8eb",
    waterOpacity: 0.9,
    waterway: "#7eb6e6",
    buildingFill: "#d8d2c7",
    buildingOpacity: 0.65,
    buildingOutline: "#c0b9ac",
    roadMinor: "#ffffff",
    roadSecondary: "#fff1a8",
    roadPrimaryCasing: "#d98c3b",
    roadPrimary: "#f9b86c",
    roadLabel: "#262b31",
    roadLabelHalo: "#ffffff",
    placeLabel: "#1f2937",
    placeLabelHalo: "#ffffff",
    areaFill: "#edeae2",
    maskFill: "#262b31",
    maskOpacity: 0.3,
    boundaryLine: "#475569",
  },
  rosa: {
    background: PALETTE_TOKENS.warmCream,
    landuse: PALETTE_TOKENS.butterCream,
    landuseOpacity: 0.35,
    park: PALETTE_TOKENS.mintCream,
    parkOpacity: 0.85,
    water: PALETTE_TOKENS.lavenderLight,
    waterOpacity: 0.85,
    waterway: PALETTE_TOKENS.lavender,
    buildingFill: PALETTE_TOKENS.lavenderLight,
    buildingOpacity: 0.45,
    buildingOutline: PALETTE_TOKENS.lavender,
    roadMinor: "#ffffff",
    roadSecondary: PALETTE_TOKENS.mintCream,
    roadPrimaryCasing: PALETTE_TOKENS.lavender,
    roadPrimary: PALETTE_TOKENS.butterCream,
    roadLabel: PALETTE_TOKENS.purpleDark,
    roadLabelHalo: PALETTE_TOKENS.warmCream,
    placeLabel: PALETTE_TOKENS.purpleDeep,
    placeLabelHalo: PALETTE_TOKENS.mintCream,
    areaFill: PALETTE_TOKENS.mintCream,
    maskFill: PALETTE_TOKENS.purpleDeep,
    maskOpacity: 0.42,
    boundaryLine: PALETTE_TOKENS.purpleDark,
  },
};

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

function buildInvertedMaskLayers(palette: MapThemePalette): LayerSpecification[] {
  return [
    {
      id: "belo-jardim-mask-fill",
      type: "fill",
      source: "belo-jardim-mask",
      paint: {
        "fill-color": palette.maskFill,
        "fill-opacity": palette.maskOpacity,
      },
    },
    {
      id: "belo-jardim-border",
      type: "line",
      source: "belo-jardim-boundary",
      paint: {
        "line-color": palette.boundaryLine,
        "line-width": 2.5,
        "line-opacity": 0.9,
      },
    },
  ];
}

/**
 * Builds an inline GeoJSON-only fallback style with zero network requests,
 * used when tiles fail to load (offline/3G failure) or in offline mode.
 */
export function buildOfflineMapStyle(theme: MapTheme = "rosa"): StyleSpecification {
  const palette = MAP_THEME_PALETTES[theme];
  return {
    version: 8,
    name: `Tecendo Vozes Offline (${theme})`,
    sources: buildMaskAndBoundarySources(),
    layers: [
      {
        id: "background",
        type: "background",
        paint: {
          "background-color": palette.background,
        },
      },
      {
        id: "belo-jardim-area",
        type: "fill",
        source: "belo-jardim-boundary",
        paint: {
          "fill-color": palette.areaFill,
          "fill-opacity": 0.95,
        },
      },
      ...buildInvertedMaskLayers(palette),
    ],
  };
}

/**
 * Builds the MapLibre style for Belo Jardim – PE using PMTiles (when configured)
 * or OpenFreeMap vector tiles, enforcing Portuguese labels and omitting commercial POIs.
 */
export function buildMapStyle(options?: BuildMapStyleOptions): StyleSpecification {
  const theme: MapTheme = options?.theme ?? "original";
  const palette = MAP_THEME_PALETTES[theme];

  if (options?.mode === "offline") {
    return buildOfflineMapStyle(theme);
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
        "background-color": palette.background,
      },
    },
    {
      id: "landuse-residential",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "landuse",
      filter: ["in", ["get", "class"], ["literal", ["residential", "suburb", "neighbourhood"]]],
      paint: {
        "fill-color": palette.landuse,
        "fill-opacity": palette.landuseOpacity,
      },
    },
    {
      id: "park-green",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "park",
      paint: {
        "fill-color": palette.park,
        "fill-opacity": palette.parkOpacity,
      },
    },
    {
      id: "water",
      type: "fill",
      source: "openmaptiles",
      "source-layer": "water",
      paint: {
        "fill-color": palette.water,
        "fill-opacity": palette.waterOpacity,
      },
    },
    {
      id: "waterway",
      type: "line",
      source: "openmaptiles",
      "source-layer": "waterway",
      paint: {
        "line-color": palette.waterway,
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
        "fill-color": palette.buildingFill,
        "fill-opacity": palette.buildingOpacity,
        "fill-outline-color": palette.buildingOutline,
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
        "line-color": palette.roadMinor,
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
        "line-color": palette.roadSecondary,
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
        "line-color": palette.roadPrimaryCasing,
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
        "line-color": palette.roadPrimary,
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
        "text-color": palette.roadLabel,
        "text-halo-color": palette.roadLabelHalo,
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
        "text-color": palette.placeLabel,
        "text-halo-color": palette.placeLabelHalo,
        "text-halo-width": 2,
      },
    },
    ...buildInvertedMaskLayers(palette),
  ];

  return {
    version: 8,
    name: `Tecendo Vozes Belo Jardim (${theme})`,
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
