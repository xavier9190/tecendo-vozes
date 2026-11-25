export const PERMANENT_EMERGENCY_DISCLAIMER =
  "Este site não é um canal oficial de atendimento ou de denúncia. Em emergência, ligue 180, 190 ou 192.";

export interface EmergencyContact {
  readonly number: string;
  readonly href: `tel:${string}`;
  readonly title: string;
  readonly description: string;
  readonly ariaLabel: string;
  readonly urgent: boolean;
}

export const EMERGENCY_CONTACTS: readonly EmergencyContact[] = [
  {
    number: "180",
    href: "tel:180",
    title: "Ligue 180",
    description: "Central de Atendimento à Mulher (24h, gratuito e sigiloso)",
    ariaLabel: "Ligar para 180 — Central de Atendimento à Mulher",
    urgent: true,
  },
  {
    number: "190",
    href: "tel:190",
    title: "Ligue 190",
    description: "Polícia Militar — emergência imediata",
    ariaLabel: "Ligar para 190 — Polícia Militar",
    urgent: true,
  },
  {
    number: "192",
    href: "tel:192",
    title: "Ligue 192",
    description: "SAMU — urgência e emergência médica",
    ariaLabel: "Ligar para 192 — SAMU",
    urgent: true,
  },
  {
    number: "197",
    href: "tel:197",
    title: "Ligue 197",
    description: "Polícia Civil — denúncia e investigação",
    ariaLabel: "Ligar para 197 — Polícia Civil",
    urgent: false,
  },
  {
    number: "100",
    href: "tel:100",
    title: "Disque 100",
    description: "Disque Direitos Humanos",
    ariaLabel: "Ligar para 100 — Disque Direitos Humanos",
    urgent: false,
  },
] as const;

export const WHATSAPP_180_CONTACT = {
  label: "WhatsApp 180",
  href: "https://wa.me/556196100180",
  ariaLabel: "Abrir WhatsApp oficial do Ligue 180 em nova aba",
  description: "Atendimento oficial do Ligue 180 via WhatsApp (+55 61 9610-0180)",
} as const;
