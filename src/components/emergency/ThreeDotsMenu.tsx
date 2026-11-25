"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Info,
  MessageCircle,
  MoreHorizontal,
  Phone,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  EMERGENCY_CONTACTS,
  PERMANENT_EMERGENCY_DISCLAIMER,
  PROJECT_INFO,
  WHATSAPP_180_CONTACT,
} from "./EmergencyConstants";

export interface ThreeDotsMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerOnMobile?: boolean;
  className?: string;
}

type MenuView = "menu" | "about" | "report";

export function ThreeDotsMenu({
  isOpen,
  onOpenChange,
  hideTriggerOnMobile = false,
  className = "",
}: ThreeDotsMenuProps) {
  const [activeView, setActiveView] = useState<MenuView>("menu");
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);
  const wasOpenRef = useRef(isOpen);

  const closeMenu = useCallback(() => {
    setActiveView("menu");
    onOpenChange(false);
  }, [onOpenChange]);

  const openMenu = useCallback(() => {
    setActiveView("menu");
    onOpenChange(true);
  }, [onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      if (wasOpenRef.current) {
        triggerRef.current?.focus();
      }
      wasOpenRef.current = false;
      return;
    }

    wasOpenRef.current = true;
    firstActionRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeMenu]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        data-testid="three-dots-trigger"
        aria-label="Abrir menu de informações e denúncia"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={() => (isOpen ? closeMenu() : openMenu())}
        className={`absolute bottom-3 right-3 z-30 min-h-11 min-w-11 h-11 w-11 items-center justify-center rounded-full border-2 border-tv-purple-deep bg-tv-purple-deep text-tv-cream-mint shadow-lg transition-colors hover:bg-tv-purple-dark md:h-14 md:w-14 ${
          hideTriggerOnMobile ? "hidden md:flex" : "flex"
        } ${className}`.trim()}
      >
        <MoreHorizontal className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div
          data-testid="three-dots-backdrop"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeMenu();
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-tv-purple-deep/45 p-4 backdrop-blur-md"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Menu de informações e denúncia"
            className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-tv-purple-deep bg-tv-cream-mint p-6 text-tv-purple-deep shadow-2xl"
          >
            {activeView === "menu" ? (
              <div className="flex flex-col gap-4">
                <div className="text-center">
                  <h2 className="text-xl font-extrabold text-tv-purple-deep">
                    {PROJECT_INFO.name}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-tv-purple-dark">
                    {PROJECT_INFO.subtitle}
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    ref={firstActionRef}
                    type="button"
                    onClick={() => setActiveView("about")}
                    className="inline-flex min-h-11 min-w-11 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-tv-purple-deep bg-tv-purple-deep px-5 py-3.5 text-base font-bold text-tv-cream-mint shadow-sm transition-colors hover:bg-tv-purple-dark"
                  >
                    <Info className="h-5 w-5 shrink-0 text-tv-amber" aria-hidden="true" />
                    <span>Sobre nós</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView("report")}
                    className="inline-flex min-h-11 min-w-11 w-full items-center justify-center gap-2.5 rounded-2xl border-2 border-tv-purple-deep bg-tv-cream-butter px-5 py-3.5 text-base font-bold text-tv-purple-deep shadow-sm transition-colors hover:bg-tv-cream-warm"
                  >
                    <ShieldAlert
                      className="h-5 w-5 shrink-0 text-tv-coral"
                      aria-hidden="true"
                    />
                    <span>Denuncie</span>
                  </button>
                </div>

                <p className="text-center text-xs font-medium text-tv-purple-dark">
                  Pressione Esc ou toque fora para fechar.
                </p>
              </div>
            ) : null}

            {activeView === "about" ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView("menu")}
                    className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-3 py-2 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Voltar</span>
                  </button>
                  <h2 className="text-lg font-extrabold text-tv-purple-deep">Sobre nós</h2>
                </div>

                <div className="space-y-3 text-sm leading-relaxed text-tv-purple-deep">
                  <p>
                    <strong>{PROJECT_INFO.name}</strong> é um mapa comunitário para mulheres em{" "}
                    <strong>Belo Jardim – PE</strong> ({PROJECT_INFO.coverage}), reunindo serviços
                    de saúde, proteção e apoio, assistência pública, artesanato, arte/cultura e
                    empreendedoras.
                  </p>
                  <p className="rounded-xl border border-tv-lavender bg-tv-cream-warm p-3 text-xs font-medium text-tv-purple-deep">
                    {PROJECT_INFO.privacySummary}
                  </p>
                  <p className="text-xs text-tv-purple-dark">
                    <strong>Contato e LGPD:</strong> {PROJECT_INFO.lgpdContactName} —{" "}
                    {PROJECT_INFO.lgpdContactRole}.
                  </p>
                </div>

                <nav aria-label="Documentos legais" className="flex flex-col gap-2">
                  <Link
                    href="/privacidade"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-4 py-2.5 text-sm font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
                  >
                    Política de Privacidade
                  </Link>
                  <Link
                    href="/termos"
                    className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-4 py-2.5 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                  >
                    Termos de Uso
                  </Link>
                </nav>

                <p className="text-xs font-semibold text-tv-purple-dark">
                  {PERMANENT_EMERGENCY_DISCLAIMER}
                </p>
              </div>
            ) : null}

            {activeView === "report" ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveView("menu")}
                    className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-3 py-2 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                  >
                    <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>Voltar</span>
                  </button>
                  <h2 className="text-lg font-extrabold text-tv-purple-deep">Denuncie</h2>
                </div>

                <p className="flex items-start gap-2 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-butter p-3 text-xs font-bold text-tv-purple-deep">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-tv-coral"
                    aria-hidden="true"
                  />
                  <span>{PERMANENT_EMERGENCY_DISCLAIMER}</span>
                </p>

                <ul className="flex flex-col gap-2">
                  {EMERGENCY_CONTACTS.map((contact) => (
                    <li key={contact.number}>
                      <a
                        href={contact.href}
                        aria-label={contact.ariaLabel}
                        className={
                          contact.urgent
                            ? "flex min-h-11 min-w-11 items-center justify-between gap-3 rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-4 py-2.5 text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
                            : "flex min-h-11 min-w-11 items-center justify-between gap-3 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-4 py-2.5 text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                        }
                      >
                        <span className="flex flex-col">
                          <span className="text-sm font-extrabold">{contact.title}</span>
                          <span
                            className={`text-xs ${
                              contact.urgent ? "text-tv-cream-warm" : "text-tv-purple-dark"
                            }`}
                          >
                            {contact.description}
                          </span>
                        </span>
                        <Phone
                          className={`h-4 w-4 shrink-0 ${
                            contact.urgent ? "text-tv-amber" : "text-tv-purple-dark"
                          }`}
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                  <li>
                    <a
                      href={WHATSAPP_180_CONTACT.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={WHATSAPP_180_CONTACT.ariaLabel}
                      className="flex min-h-11 min-w-11 items-center justify-between gap-3 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-butter px-4 py-2.5 text-tv-purple-deep transition-colors hover:bg-tv-cream-warm"
                    >
                      <span className="flex flex-col">
                        <span className="text-sm font-extrabold">{WHATSAPP_180_CONTACT.label}</span>
                        <span className="text-xs text-tv-purple-dark">
                          {WHATSAPP_180_CONTACT.description}
                        </span>
                      </span>
                      <MessageCircle
                        className="h-4 w-4 shrink-0 text-tv-coral"
                        aria-hidden="true"
                      />
                    </a>
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
