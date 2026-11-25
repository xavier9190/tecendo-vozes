import { BELO_JARDIM_BOUNDS } from "@/lib/data/schema";

export { BELO_JARDIM_BOUNDS };

export const BELO_JARDIM_CENTER: readonly [number, number] = [-36.424, -8.3358];

export const MIN_ZOOM = 11;
export const MAX_ZOOM = 18;
export const DEFAULT_ZOOM = 13;

/**
 * Closed polygon ring ([lng, lat]) delineating the municipality of Belo Jardim – PE,
 * encompassing Sede, Serra do Vento, Água Fria, and Xucuru inside BELO_JARDIM_BOUNDS.
 */
export const BELO_JARDIM_BOUNDARY_RING: readonly (readonly [number, number])[] = [
  [-36.54, -8.29],
  [-36.47, -8.23],
  [-36.39, -8.2],
  [-36.31, -8.23],
  [-36.29, -8.31],
  [-36.3, -8.4],
  [-36.36, -8.45],
  [-36.44, -8.44],
  [-36.52, -8.39],
  [-36.55, -8.33],
  [-36.54, -8.29],
];

const WORLD_OUTER_RING: readonly (readonly [number, number])[] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
];

export interface GeoJsonFeatureCollection<G> {
  type: "FeatureCollection";
  features: Array<{
    type: "Feature";
    properties: Record<string, unknown>;
    geometry: G;
  }>;
}

export interface GeoJsonPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

/**
 * Builds an inverted mask polygon covering the world except Belo Jardim,
 * keeping visual focus strictly within the municipality and its districts.
 */
export function buildInvertedMaskGeoJson(): GeoJsonFeatureCollection<GeoJsonPolygon> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Belo Jardim Mask" },
        geometry: {
          type: "Polygon",
          coordinates: [
            WORLD_OUTER_RING.map(([lng, lat]) => [lng, lat]),
            BELO_JARDIM_BOUNDARY_RING.map(([lng, lat]) => [lng, lat]),
          ],
        },
      },
    ],
  };
}

export function buildBeloJardimBoundaryGeoJson(): GeoJsonFeatureCollection<GeoJsonPolygon> {
  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Belo Jardim - PE" },
        geometry: {
          type: "Polygon",
          coordinates: [BELO_JARDIM_BOUNDARY_RING.map(([lng, lat]) => [lng, lat])],
        },
      },
    ],
  };
}

export const PERNAMBUCO_BOUNDS = {
  west: -41.36,
  south: -9.48,
  east: -34.8,
  north: -7.15,
} as const;

const MINI_MAP_WIDTH = 320;
const MINI_MAP_HEIGHT = 120;
const MINI_MAP_PADDING = 10;

export const PERNAMBUCO_SVG_VIEWBOX = `0 0 ${MINI_MAP_WIDTH} ${MINI_MAP_HEIGHT}`;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Projects [lng, lat] coordinates into Pernambuco's mini-map SVG coordinate space,
 * clamping values cleanly inside the SVG bounds.
 */
export function projectCoordsToPernambucoSvg(
  lng: number,
  lat: number,
): { x: number; y: number } {
  const usableWidth = MINI_MAP_WIDTH - MINI_MAP_PADDING * 2;
  const usableHeight = MINI_MAP_HEIGHT - MINI_MAP_PADDING * 2;

  const lngRatio =
    (lng - PERNAMBUCO_BOUNDS.west) / (PERNAMBUCO_BOUNDS.east - PERNAMBUCO_BOUNDS.west);
  const latRatio =
    (PERNAMBUCO_BOUNDS.north - lat) / (PERNAMBUCO_BOUNDS.north - PERNAMBUCO_BOUNDS.south);

  const rawX = MINI_MAP_PADDING + lngRatio * usableWidth;
  const rawY = MINI_MAP_PADDING + latRatio * usableHeight;

  return {
    x: Number(clamp(rawX, MINI_MAP_PADDING, MINI_MAP_WIDTH - MINI_MAP_PADDING).toFixed(2)),
    y: Number(clamp(rawY, MINI_MAP_PADDING, MINI_MAP_HEIGHT - MINI_MAP_PADDING).toFixed(2)),
  };
}

const PERNAMBUCO_APPROX_COORDS: readonly (readonly [number, number])[] = [
  [-41.35, -8.68],
  [-40.95, -7.85],
  [-40.2, -7.45],
  [-39.3, -7.3],
  [-38.3, -7.5],
  [-37.35, -7.35],
  [-36.7, -7.65],
  [-35.95, -7.75],
  [-35.15, -7.45],
  [-34.82, -7.62],
  [-34.87, -8.06],
  [-34.95, -8.45],
  [-35.14, -8.92],
  [-35.68, -8.88],
  [-36.45, -9.05],
  [-37.3, -9.15],
  [-38.2, -9.45],
  [-39.15, -8.95],
  [-40.1, -9.15],
  [-40.55, -9.42],
  [-41.15, -9.15],
];

export const PERNAMBUCO_OUTLINE_PATH = `${PERNAMBUCO_APPROX_COORDS.map(([lng, lat], index) => {
  const { x, y } = projectCoordsToPernambucoSvg(lng, lat);
  return `${index === 0 ? "M" : "L"}${x} ${y}`;
}).join(" ")} Z`;
