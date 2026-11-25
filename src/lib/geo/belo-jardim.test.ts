import { describe, expect, it } from "vitest";
import { getLocais } from "@/lib/data/locais";
import { isWithinBeloJardimBounds } from "@/lib/data/schema";
import {
  BELO_JARDIM_BOUNDARY_RING,
  BELO_JARDIM_BOUNDS,
  BELO_JARDIM_CENTER,
  DEFAULT_ZOOM,
  MAX_ZOOM,
  MIN_ZOOM,
  PERNAMBUCO_BOUNDS,
  PERNAMBUCO_OUTLINE_PATH,
  PERNAMBUCO_SVG_VIEWBOX,
  buildInvertedMaskGeoJson,
  projectCoordsToPernambucoSvg,
} from "./belo-jardim";

function pointInRing(point: readonly [number, number], ring: readonly (readonly [number, number])[]): boolean {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) {
      inside = !inside;
    }
  }
  return inside;
}

describe("Belo Jardim geographic constants, inverted mask, and Pernambuco projection", () => {
  it("defines Belo Jardim center, bounds, and zoom limits matching schema constraints", () => {
    expect(BELO_JARDIM_CENTER).toEqual([-36.424, -8.3358]);
    expect(BELO_JARDIM_BOUNDS).toEqual([
      [-36.62, -8.52],
      [-36.22, -8.15],
    ]);
    expect(isWithinBeloJardimBounds(BELO_JARDIM_CENTER)).toBe(true);
    expect(MIN_ZOOM).toBe(11);
    expect(MAX_ZOOM).toBe(18);
    expect(DEFAULT_ZOOM).toBe(13);
  });

  it("encloses all seeded Belo Jardim places across Sede and districts inside the municipality ring", () => {
    expect(BELO_JARDIM_BOUNDARY_RING.length).toBeGreaterThanOrEqual(8);
    expect(BELO_JARDIM_BOUNDARY_RING[0]).toEqual(
      BELO_JARDIM_BOUNDARY_RING[BELO_JARDIM_BOUNDARY_RING.length - 1],
    );

    for (const vertex of BELO_JARDIM_BOUNDARY_RING) {
      expect(isWithinBeloJardimBounds(vertex)).toBe(true);
    }

    for (const local of getLocais()) {
      expect(
        pointInRing(local.coordinates, BELO_JARDIM_BOUNDARY_RING),
        `Expected ${local.nome} (${local.distrito}) to be inside BELO_JARDIM_BOUNDARY_RING`,
      ).toBe(true);
    }
  });

  it("builds a valid inverted mask GeoJSON Polygon with world exterior and Belo Jardim hole", () => {
    const mask = buildInvertedMaskGeoJson();
    expect(mask.type).toBe("FeatureCollection");
    expect(mask.features).toHaveLength(1);

    const feature = mask.features[0];
    expect(feature.geometry.type).toBe("Polygon");
    expect(feature.geometry.coordinates).toHaveLength(2);

    const [outerRing, holeRing] = feature.geometry.coordinates;
    expect(outerRing[0]).toEqual(outerRing[outerRing.length - 1]);
    expect(outerRing).toContainEqual([-180, -85]);
    expect(outerRing).toContainEqual([180, 85]);
    expect(holeRing).toHaveLength(BELO_JARDIM_BOUNDARY_RING.length);
  });

  it("projects Belo Jardim into the Pernambuco SVG contour and clamps out-of-bounds coordinates", () => {
    expect(PERNAMBUCO_BOUNDS).toEqual({
      west: -41.36,
      south: -9.48,
      east: -34.8,
      north: -7.15,
    });
    expect(PERNAMBUCO_OUTLINE_PATH.startsWith("M")).toBe(true);

    const [, , widthStr, heightStr] = PERNAMBUCO_SVG_VIEWBOX.split(" ");
    const width = Number(widthStr);
    const height = Number(heightStr);

    const bj = projectCoordsToPernambucoSvg(BELO_JARDIM_CENTER[0], BELO_JARDIM_CENTER[1]);
    expect(bj.x).toBeGreaterThan(width * 0.65);
    expect(bj.x).toBeLessThan(width * 0.85);
    expect(bj.y).toBeGreaterThan(height * 0.35);
    expect(bj.y).toBeLessThan(height * 0.65);

    const westEdge = projectCoordsToPernambucoSvg(-50, -20);
    const eastEdge = projectCoordsToPernambucoSvg(-30, 0);
    expect(westEdge.x).toBeGreaterThanOrEqual(0);
    expect(westEdge.y).toBeLessThanOrEqual(height);
    expect(eastEdge.x).toBeLessThanOrEqual(width);
    expect(eastEdge.y).toBeGreaterThanOrEqual(0);
    expect(westEdge.x).toBeLessThan(eastEdge.x);
    expect(eastEdge.y).toBeLessThan(westEdge.y);
  });
});
