"use client";

import { AlertTriangle, MessageCircle, Phone } from "lucide-react";
import {
  EMERGENCY_CONTACTS,
  PERMANENT_EMERGENCY_DISCLAIMER,
  WHATSAPP_180_CONTACT,
} from "./EmergencyConstants";

export interface EmergencyBarProps {
  variant?: "inline" | "floating";
  isPlaceSelected?: boolean;
  className?: string;
}

export function EmergencyBar({
  variant = "inline",
  isPlaceSelected = false,
  className = "",
}: EmergencyBarProps) {
  const isFloating = variant === "floating";

  const positioningClasses = isFloating
    ? `pointer-events-auto absolute z-20 ${
        isPlaceSelected
          ? "bottom-[calc(48dvh+0.5rem)] left-3 right-3 md:bottom-8 md:left-auto md:right-20 md:w-auto md:max-w-lg md:translate-x-0"
          : "bottom-[6.75rem] left-3 right-3 md:bottom-8 md:left-1/2 md:right-auto md:w-auto md:max-w-xl md:-translate-x-1/2"
      }`
    : "w-full";

  const containerClasses = isFloating
    ? "rounded-2xl border-2 border-tv-purple-deep bg-tv-cream-mint/95 px-3 py-2 text-tv-purple-deep shadow-lg backdrop-blur-xs"
    : "rounded-2xl border-2 border-tv-purple-deep bg-tv-cream-mint p-4 text-tv-purple-deep shadow-sm";

  return (
    <aside
      data-testid="emergency-bar"
      aria-label="Canais de emergência e aviso de canal não oficial"
      className={`${positioningClasses} ${containerClasses} ${className}`.trim()}
    >
      <div className="flex flex-col gap-2">
        <p className="flex items-start gap-2 text-xs font-bold leading-snug text-tv-purple-deep md:text-sm">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-tv-coral"
            aria-hidden="true"
          />
          <span>{PERMANENT_EMERGENCY_DISCLAIMER}</span>
        </p>

        <nav
          aria-label="Telefones de emergência e WhatsApp 180"
          className="flex flex-wrap items-center gap-1.5"
        >
          {EMERGENCY_CONTACTS.map((contact) => (
            <a
              key={contact.number}
              href={contact.href}
              aria-label={contact.ariaLabel}
              className={
                contact.urgent
                  ? "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-2.5 py-1.5 text-xs font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
                  : "inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-butter px-2.5 py-1.5 text-xs font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-warm"
              }
            >
              <Phone
                className={`h-3.5 w-3.5 shrink-0 ${
                  contact.urgent ? "text-tv-amber" : "text-tv-purple-dark"
                }`}
                aria-hidden="true"
              />
              <span>{contact.number}</span>
            </a>
          ))}

          <a
            href={WHATSAPP_180_CONTACT.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={WHATSAPP_180_CONTACT.ariaLabel}
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-2.5 py-1.5 text-xs font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
          >
            <MessageCircle
              className="h-3.5 w-3.5 shrink-0 text-tv-coral"
              aria-hidden="true"
            />
            <span>{WHATSAPP_180_CONTACT.label}</span>
          </a>
        </nav>
      </div>
    </aside>
  );
}
