import {
  HeartPulse,
  Landmark,
  Palette,
  ShieldCheck,
  Sparkles,
  Store,
  type LucideIcon,
} from "lucide-react";
import { PALETTE_TOKENS, type PaletteHex } from "./palette";

export const CATEGORY_IDS = [
  "saude",
  "protecao-apoio",
  "apoio-publico",
  "artesanato",
  "arte-cultura",
  "empreendedoras",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export type CategoryIconName =
  | "HeartPulse"
  | "ShieldCheck"
  | "Landmark"
  | "Palette"
  | "Sparkles"
  | "Store";

export interface CategoryToken {
  readonly id: CategoryId;
  readonly label: string;
  readonly shortDescription: string;
  readonly accentColor: PaletteHex;
  readonly iconName: CategoryIconName;
  readonly icon: LucideIcon;
  readonly surfaceBg: PaletteHex;
  readonly surfaceText: PaletteHex;
  readonly badgeBg: PaletteHex;
  readonly badgeText: PaletteHex;
  readonly markerBg: PaletteHex;
  readonly markerIconColor: PaletteHex;
  readonly borderColor: PaletteHex;
}

export const CATEGORIES: readonly CategoryToken[] = [
  {
    id: "saude",
    label: "Saúde",
    shortDescription: "UBS, policlínicas, atendimento médico e saúde da mulher",
    accentColor: PALETTE_TOKENS.coral,
    iconName: "HeartPulse",
    icon: HeartPulse,
    surfaceBg: PALETTE_TOKENS.warmCream,
    surfaceText: PALETTE_TOKENS.purpleDeep,
    badgeBg: PALETTE_TOKENS.warmCream,
    badgeText: PALETTE_TOKENS.purpleDeep,
    markerBg: PALETTE_TOKENS.coral,
    markerIconColor: PALETTE_TOKENS.mintCream,
    borderColor: PALETTE_TOKENS.coral,
  },
  {
    id: "protecao-apoio",
    label: "Proteção e apoio",
    shortDescription: "Acolhimento, orientação jurídica e defesa de direitos",
    accentColor: PALETTE_TOKENS.purpleDeep,
    iconName: "ShieldCheck",
    icon: ShieldCheck,
    surfaceBg: PALETTE_TOKENS.mintCream,
    surfaceText: PALETTE_TOKENS.purpleDeep,
    badgeBg: PALETTE_TOKENS.purpleDeep,
    badgeText: PALETTE_TOKENS.mintCream,
    markerBg: PALETTE_TOKENS.purpleDeep,
    markerIconColor: PALETTE_TOKENS.mintCream,
    borderColor: PALETTE_TOKENS.purpleDeep,
  },
  {
    id: "apoio-publico",
    label: "Apoio público",
    shortDescription: "CRAS, CREAS, assistência social e serviços municipais",
    accentColor: PALETTE_TOKENS.purpleDark,
    iconName: "Landmark",
    icon: Landmark,
    surfaceBg: PALETTE_TOKENS.mintCream,
    surfaceText: PALETTE_TOKENS.purpleDeep,
    badgeBg: PALETTE_TOKENS.purpleDark,
    badgeText: PALETTE_TOKENS.mintCream,
    markerBg: PALETTE_TOKENS.purpleDark,
    markerIconColor: PALETTE_TOKENS.mintCream,
    borderColor: PALETTE_TOKENS.purpleDark,
  },
  {
    id: "artesanato",
    label: "Artesanato",
    shortDescription: "Ateliês, associações de artesãs e produção manual local",
    accentColor: PALETTE_TOKENS.orange,
    iconName: "Palette",
    icon: Palette,
    surfaceBg: PALETTE_TOKENS.warmCream,
    surfaceText: PALETTE_TOKENS.purpleDeep,
    badgeBg: PALETTE_TOKENS.warmCream,
    badgeText: PALETTE_TOKENS.purpleDeep,
    markerBg: PALETTE_TOKENS.orange,
    markerIconColor: PALETTE_TOKENS.purpleDeep,
    borderColor: PALETTE_TOKENS.orange,
  },
  {
    id: "arte-cultura",
    label: "Arte e cultura",
    shortDescription: "Coletivos culturais, música, literatura e espaços criativos",
    accentColor: PALETTE_TOKENS.purpleMid,
    iconName: "Sparkles",
    icon: Sparkles,
    surfaceBg: PALETTE_TOKENS.mintCream,
    surfaceText: PALETTE_TOKENS.purpleDeep,
    badgeBg: PALETTE_TOKENS.purpleMid,
    badgeText: PALETTE_TOKENS.mintCream,
    markerBg: PALETTE_TOKENS.purpleMid,
    markerIconColor: PALETTE_TOKENS.mintCream,
    borderColor: PALETTE_TOKENS.purpleMid,
  },
  {
    id: "empreendedoras",
    label: "Empreendedoras",
    shortDescription: "Negócios liderados por mulheres e economia solidária",
    accentColor: PALETTE_TOKENS.amber,
    iconName: "Store",
    icon: Store,
    surfaceBg: PALETTE_TOKENS.butterCream,
    surfaceText: PALETTE_TOKENS.purpleDeep,
    badgeBg: PALETTE_TOKENS.amber,
    badgeText: PALETTE_TOKENS.purpleDeep,
    markerBg: PALETTE_TOKENS.amber,
    markerIconColor: PALETTE_TOKENS.purpleDeep,
    borderColor: PALETTE_TOKENS.purpleDeep,
  },
] as const;

export const CATEGORY_BY_ID: Record<CategoryId, CategoryToken> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<CategoryId, CategoryToken>,
);

export function getCategoryToken(id: CategoryId): CategoryToken {
  return CATEGORY_BY_ID[id];
}
