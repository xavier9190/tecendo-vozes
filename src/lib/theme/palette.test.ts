import { describe, expect, it } from "vitest";
import {
  OFFICIAL_PALETTE,
  PALETTE_COLORS,
  WCAG_AA_PAIRINGS,
  getContrastRatio,
  meetsWcagAA,
} from "./palette";

describe("official palette and WCAG 2.1 contrast helper", () => {
  it("exports the exact 12 official palette hex colors", () => {
    const expectedColors = [
      "#3e1b45",
      "#5a3263",
      "#79549e",
      "#ea4f29",
      "#e86735",
      "#e89041",
      "#f7fff5",
      "#f9f6e7",
      "#f9f4bc",
      "#8c589d",
      "#ab8bb8",
      "#c3b4d0",
    ];

    expect(PALETTE_COLORS).toHaveLength(12);
    expect(new Set(PALETTE_COLORS)).toEqual(new Set(expectedColors));

    expect(OFFICIAL_PALETTE.darkPurples).toEqual(["#3e1b45", "#5a3263", "#79549e"]);
    expect(OFFICIAL_PALETTE.coralsOranges).toEqual(["#ea4f29", "#e86735", "#e89041"]);
    expect(OFFICIAL_PALETTE.creamsLights).toEqual(["#f7fff5", "#f9f6e7", "#f9f4bc"]);
    expect(OFFICIAL_PALETTE.softPurplesLavenders).toEqual([
      "#8c589d",
      "#ab8bb8",
      "#c3b4d0",
    ]);
  });

  it("computes WCAG 2.1 relative-luminance contrast ratios accurately", () => {
    expect(getContrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 2);
    expect(getContrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 2);
    expect(getContrastRatio("#3e1b45", "#3e1b45")).toBeCloseTo(1, 2);

    // Worked WCAG 2.1 check: #3e1b45 (dark purple) on #f7fff5 (mint cream) is > 13:1
    const darkOnMint = getContrastRatio("#3e1b45", "#f7fff5");
    expect(darkOnMint).toBeGreaterThan(13);
    expect(meetsWcagAA("#3e1b45", "#f7fff5", "normal")).toBe(true);

    // Worked check: #e89041 on #f7fff5 fails normal text AA (4.5:1) and even large (3:1)
    expect(meetsWcagAA("#e89041", "#f7fff5", "normal")).toBe(false);
    expect(meetsWcagAA("#e89041", "#f7fff5", "large")).toBe(false);
  });

  it("verifies every declared WCAG AA pairing meets its required threshold", () => {
    expect(WCAG_AA_PAIRINGS.normalText.length).toBeGreaterThan(0);
    expect(WCAG_AA_PAIRINGS.largeOrGraphical.length).toBeGreaterThan(0);

    for (const pairing of WCAG_AA_PAIRINGS.normalText) {
      expect(PALETTE_COLORS).toContain(pairing.foreground);
      expect(PALETTE_COLORS).toContain(pairing.background);
      const ratio = getContrastRatio(pairing.foreground, pairing.background);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(pairing.contrastRatio).toBeCloseTo(ratio, 2);
    }

    for (const pairing of WCAG_AA_PAIRINGS.largeOrGraphical) {
      expect(PALETTE_COLORS).toContain(pairing.foreground);
      expect(PALETTE_COLORS).toContain(pairing.background);
      const ratio = getContrastRatio(pairing.foreground, pairing.background);
      expect(ratio).toBeGreaterThanOrEqual(3);
      expect(pairing.contrastRatio).toBeCloseTo(ratio, 2);
    }
  });
});
