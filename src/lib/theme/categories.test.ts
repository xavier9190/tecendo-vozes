import { describe, expect, it } from "vitest";
import {
  CATEGORIES,
  CATEGORY_BY_ID,
  CATEGORY_IDS,
  getCategoryToken,
  type CategoryId,
} from "./categories";
import { PALETTE_COLORS, getContrastRatio } from "./palette";

describe("category visual tokens", () => {
  it("defines all 6 official categories with distinct colors, icons, and Portuguese labels", () => {
    const expectedIds: CategoryId[] = [
      "saude",
      "protecao-apoio",
      "apoio-publico",
      "artesanato",
      "arte-cultura",
      "empreendedoras",
    ];

    expect(CATEGORY_IDS).toEqual(expectedIds);
    expect(CATEGORIES).toHaveLength(6);

    const accentColors = CATEGORIES.map((category) => category.accentColor);
    const iconNames = CATEGORIES.map((category) => category.iconName);
    const labels = CATEGORIES.map((category) => category.label);

    expect(new Set(accentColors).size).toBe(6);
    expect(new Set(iconNames).size).toBe(6);
    expect(new Set(labels).size).toBe(6);

    expect(CATEGORY_BY_ID["saude"].label).toBe("Saúde");
    expect(CATEGORY_BY_ID["protecao-apoio"].label).toBe("Proteção e apoio");
    expect(CATEGORY_BY_ID["apoio-publico"].label).toBe("Apoio público");
    expect(CATEGORY_BY_ID["artesanato"].label).toBe("Artesanato");
    expect(CATEGORY_BY_ID["arte-cultura"].label).toBe("Arte e cultura");
    expect(CATEGORY_BY_ID["empreendedoras"].label).toBe("Empreendedoras");
  });

  it("uses only official palette colors and satisfies WCAG 2.1 AA contrast", () => {
    for (const category of CATEGORIES) {
      expect(PALETTE_COLORS).toContain(category.accentColor);
      expect(PALETTE_COLORS).toContain(category.surfaceBg);
      expect(PALETTE_COLORS).toContain(category.surfaceText);
      expect(PALETTE_COLORS).toContain(category.badgeBg);
      expect(PALETTE_COLORS).toContain(category.badgeText);
      expect(PALETTE_COLORS).toContain(category.markerBg);
      expect(PALETTE_COLORS).toContain(category.markerIconColor);
      expect(PALETTE_COLORS).toContain(category.borderColor);

      // Normal text surfaces & badges must pass >= 4.5:1
      expect(getContrastRatio(category.surfaceText, category.surfaceBg)).toBeGreaterThanOrEqual(
        4.5,
      );
      expect(getContrastRatio(category.badgeText, category.badgeBg)).toBeGreaterThanOrEqual(
        4.5,
      );

      // Graphical marker icon inside marker background must pass >= 3:1
      expect(
        getContrastRatio(category.markerIconColor, category.markerBg),
      ).toBeGreaterThanOrEqual(3);

      expect(typeof category.icon).not.toBe("undefined");
      expect(getCategoryToken(category.id)).toEqual(category);
    }
  });
});
