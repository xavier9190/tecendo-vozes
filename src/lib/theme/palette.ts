export const OFFICIAL_PALETTE = {
  darkPurples: ["#3e1b45", "#5a3263", "#79549e"],
  coralsOranges: ["#ea4f29", "#e86735", "#e89041"],
  creamsLights: ["#f7fff5", "#f9f6e7", "#f9f4bc"],
  softPurplesLavenders: ["#8c589d", "#ab8bb8", "#c3b4d0"],
} as const;

export type PaletteHex =
  | (typeof OFFICIAL_PALETTE.darkPurples)[number]
  | (typeof OFFICIAL_PALETTE.coralsOranges)[number]
  | (typeof OFFICIAL_PALETTE.creamsLights)[number]
  | (typeof OFFICIAL_PALETTE.softPurplesLavenders)[number];

export const PALETTE_TOKENS = {
  purpleDeep: "#3e1b45",
  purpleDark: "#5a3263",
  purpleMid: "#79549e",
  coral: "#ea4f29",
  orange: "#e86735",
  amber: "#e89041",
  mintCream: "#f7fff5",
  warmCream: "#f9f6e7",
  butterCream: "#f9f4bc",
  plumSoft: "#8c589d",
  lavender: "#ab8bb8",
  lavenderLight: "#c3b4d0",
} as const satisfies Record<string, PaletteHex>;

export const PALETTE_COLORS: readonly PaletteHex[] = [
  ...OFFICIAL_PALETTE.darkPurples,
  ...OFFICIAL_PALETTE.coralsOranges,
  ...OFFICIAL_PALETTE.creamsLights,
  ...OFFICIAL_PALETTE.softPurplesLavenders,
];

function parseHexRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Invalid 6-digit hex color: "${hex}"`);
  }

  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function channelToLinear(channel: number): number {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/**
 * Computes the WCAG 2.1 relative luminance for a 6-digit hex color.
 */
export function getRelativeLuminance(hex: string): number {
  const [r, g, b] = parseHexRgb(hex);
  return (
    0.2126 * channelToLinear(r) +
    0.7152 * channelToLinear(g) +
    0.0722 * channelToLinear(b)
  );
}

/**
 * Computes the WCAG 2.1 contrast ratio (1 to 21) between two 6-digit hex colors.
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function meetsWcagAA(
  foreground: string,
  background: string,
  level: "normal" | "large" = "normal",
): boolean {
  const threshold = level === "large" ? 3 : 4.5;
  return getContrastRatio(foreground, background) >= threshold;
}

export interface WcagPairing {
  readonly foreground: PaletteHex;
  readonly background: PaletteHex;
  readonly contrastRatio: number;
  readonly level: "AA-normal" | "AA-large";
}

function makePairing(
  foreground: PaletteHex,
  background: PaletteHex,
  level: "AA-normal" | "AA-large",
): WcagPairing {
  return {
    foreground,
    background,
    contrastRatio: getContrastRatio(foreground, background),
    level,
  };
}

export const WCAG_AA_PAIRINGS = {
  normalText: [
    makePairing("#3e1b45", "#f7fff5", "AA-normal"),
    makePairing("#3e1b45", "#f9f6e7", "AA-normal"),
    makePairing("#3e1b45", "#f9f4bc", "AA-normal"),
    makePairing("#3e1b45", "#c3b4d0", "AA-normal"),
    makePairing("#3e1b45", "#ab8bb8", "AA-normal"),
    makePairing("#3e1b45", "#e89041", "AA-normal"),
    makePairing("#5a3263", "#f7fff5", "AA-normal"),
    makePairing("#5a3263", "#f9f6e7", "AA-normal"),
    makePairing("#5a3263", "#f9f4bc", "AA-normal"),
    makePairing("#f7fff5", "#3e1b45", "AA-normal"),
    makePairing("#f9f6e7", "#3e1b45", "AA-normal"),
    makePairing("#f7fff5", "#5a3263", "AA-normal"),
    makePairing("#f9f6e7", "#5a3263", "AA-normal"),
    makePairing("#f7fff5", "#79549e", "AA-normal"),
    makePairing("#f9f6e7", "#79549e", "AA-normal"),
    makePairing("#f7fff5", "#8c589d", "AA-normal"),
    makePairing("#f9f6e7", "#8c589d", "AA-normal"),
  ],
  largeOrGraphical: [
    makePairing("#ea4f29", "#f7fff5", "AA-large"),
    makePairing("#ea4f29", "#f9f6e7", "AA-large"),
    makePairing("#ea4f29", "#3e1b45", "AA-large"),
    makePairing("#e86735", "#f7fff5", "AA-large"),
    makePairing("#e86735", "#3e1b45", "AA-large"),
    makePairing("#e89041", "#3e1b45", "AA-large"),
  ],
} as const;
