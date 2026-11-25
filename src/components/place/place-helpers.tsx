import { BadgeCheck, Clock } from "lucide-react";
import type { LngLat, Local } from "@/lib/data/schema";
import { getCategoryToken } from "@/lib/theme/categories";

/**
 * Builds an external OpenStreetMap directions URL from `[lng, lat]` coordinates.
 */
export function buildOsmDirectionsUrl(coordinates: LngLat): string {
  const [lng, lat] = coordinates;
  return `https://www.openstreetmap.org/directions?to=${encodeURIComponent(`${lat},${lng}`)}`;
}

/**
 * Formats an `YYYY-MM-DD` ISO date string as `DD/MM/YYYY` without timezone drift.
 */
export function formatIsoDatePtBr(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) {
    return isoDate;
  }
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

export function buildTelHref(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return `tel:${digits}`;
}

export function buildWhatsAppUrl(whatsapp: string): string {
  const digits = whatsapp.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

export function buildInstagramUrl(instagram: string): string {
  const trimmed = instagram.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  const handle = trimmed.replace(/^@+/, "");
  return `https://instagram.com/${encodeURIComponent(handle)}`;
}

export interface PlaceBadgesProps {
  place: Local;
  showVerificationDate?: boolean;
}

/**
 * Renders the WCAG AA category badge (color + icon + label) and verification badge.
 */
export function PlaceBadges({ place, showVerificationDate = false }: PlaceBadgesProps) {
  const category = getCategoryToken(place.categoria);
  const CategoryIcon = category.icon;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className="inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-xs font-bold"
        style={{
          backgroundColor: category.badgeBg,
          color: category.badgeText,
          borderColor: category.borderColor,
        }}
      >
        <CategoryIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>{category.label}</span>
      </span>

      {place.verificado ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-tv-purple-dark bg-tv-cream-butter px-2.5 py-0.5 text-xs font-semibold text-tv-purple-deep">
          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-tv-purple-deep" aria-hidden="true" />
          <span>
            Local verificado
            {showVerificationDate && place.dataVerificacao
              ? ` em ${formatIsoDatePtBr(place.dataVerificacao)}`
              : ""}
          </span>
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-full border border-tv-lavender bg-tv-cream-warm px-2.5 py-0.5 text-xs font-semibold text-tv-purple-dark">
          <Clock className="h-3.5 w-3.5 shrink-0 text-tv-purple-dark" aria-hidden="true" />
          <span>Aguardando verificação</span>
        </span>
      )}
    </div>
  );
}
