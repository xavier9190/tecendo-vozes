"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Image as ImageIcon,
  Info,
  MessageCircle,
  MoreHorizontal,
  Phone,
  ShieldAlert,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useFocusRestore } from "@/lib/hooks/useFocusRestore";
import { PROJECT_INFO } from "@/lib/project-info";
import {
  EMERGENCY_CONTACTS,
  PERMANENT_EMERGENCY_DISCLAIMER,
  WHATSAPP_180_CONTACT,
} from "./EmergencyConstants";

export interface ThreeDotsMenuProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  hideTriggerOnMobile?: boolean;
  handleEscape?: boolean;
  className?: string;
}

type MenuView = "menu" | "about" | "report";

function ThreeDotsMenuDialog({
  firstActionRef,
  onClose,
}: {
  firstActionRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
}) {
  const [activeView, setActiveView] = useState<MenuView>("menu");
  const isCompactMenu = activeView === "menu";
  const isAboutView = activeView === "about";

  const backdropPositionClass = isCompactMenu
    ? "items-end justify-end pb-[4.5rem] pr-8 sm:pr-10 md:pb-20 md:pr-14"
    : isAboutView
      ? "items-center justify-center p-0 md:p-6"
      : "items-center justify-center p-4";

  const dialogSizeClass = isCompactMenu
    ? "origin-bottom-right animate-tv-menu-grow w-[calc(100vw-3rem)] max-w-64 rounded-2xl border-2 border-tv-purple-deep bg-tv-cream-mint p-3.5 text-tv-purple-deep shadow-2xl sm:max-w-72"
    : isAboutView
      ? "relative flex h-dvh max-h-dvh w-full flex-col overflow-hidden rounded-none border-0 border-tv-purple-deep bg-[#ede7f2] text-tv-purple-deep shadow-2xl md:h-auto md:max-h-[92dvh] md:w-[60vw] md:min-w-[600px] md:rounded-2xl md:border-2"
      : "animate-tv-dialog max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border-2 border-tv-purple-deep bg-tv-cream-mint p-6 text-tv-purple-deep shadow-2xl";

  return (
    <div
      data-testid="three-dots-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
      className={`animate-tv-backdrop fixed inset-0 z-50 flex bg-tv-purple-deep/45 backdrop-blur-md ${backdropPositionClass}`}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menu de informações e denúncia"
        className={dialogSizeClass}
      >
        {activeView === "menu" ? (
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-2">
              <button
                ref={firstActionRef}
                type="button"
                onClick={() => setActiveView("about")}
                className="inline-flex min-h-11 min-w-11 w-full items-center justify-start gap-2.5 rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-4 py-2.5 text-sm font-bold text-tv-cream-mint shadow-sm transition-colors hover:bg-tv-purple-dark"
              >
                <Info className="h-5 w-5 shrink-0 text-tv-amber" aria-hidden="true" />
                <span>Sobre nós</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView("report")}
                className="inline-flex min-h-11 min-w-11 w-full items-center justify-start gap-2.5 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-butter px-4 py-2.5 text-sm font-bold text-tv-purple-deep shadow-sm transition-colors hover:bg-tv-cream-warm"
              >
                <ShieldAlert
                  className="h-5 w-5 shrink-0 text-tv-coral"
                  aria-hidden="true"
                />
                <span>Denuncie</span>
              </button>
            </div>
          </div>
        ) : null}

        {activeView === "about" ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-2 sm:px-8 sm:pt-5">
              <button
                type="button"
                onClick={() => setActiveView("menu")}
                className="inline-flex min-h-11 min-w-11 items-center gap-1.5 rounded-full border border-tv-purple-dark/40 bg-tv-cream-warm px-3.5 py-2 text-sm font-bold text-tv-purple-deep shadow-xs transition-colors hover:bg-tv-cream-butter"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar sobre nós"
                className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-full border border-tv-purple-dark/40 bg-tv-cream-mint/95 text-tv-purple-deep shadow-xs transition-colors hover:bg-tv-cream-butter"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex-1 space-y-8 overflow-y-auto px-5 pt-2 pb-6 sm:px-8 sm:pb-8">
              {/* Bloco 1: Banner de apresentação com logo do projeto */}
              <section
                data-testid="about-hero-banner"
                aria-label="Apresentação Tecendo Vozes"
                className="rounded-xl bg-tv-purple-dark px-6 py-8 text-tv-cream-warm shadow-md sm:px-10 sm:py-10"
              >
                <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:gap-8">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 180 118"
                    className="h-24 w-36 shrink-0 sm:h-28 sm:w-44"
                    fill="none"
                  >
                    <path
                      d="M16 42C24 27 42 18 59 24C70 28 77 41 90 38C105 34 115 15 135 16C150 17 162 29 167 45C171 58 158 70 144 76C128 82 117 97 99 102C80 107 62 96 46 86C31 76 9 56 16 42Z"
                      fill="#f9f6e7"
                      stroke="#f9f4bc"
                      strokeWidth="2.5"
                      strokeDasharray="5 4"
                    />
                    <circle cx="66" cy="52" r="6" fill="#ea4f29" />
                    <circle cx="116" cy="46" r="6" fill="#79549e" />
                    <circle cx="94" cy="78" r="6" fill="#e89041" />
                  </svg>

                  <div className="text-center sm:text-left">
                    <p className="font-serif text-3xl font-bold leading-none tracking-tight text-tv-cream-warm sm:text-4xl">
                      {PROJECT_INFO.name}
                    </p>
                    <p className="mt-1.5 text-sm font-semibold tracking-wide text-tv-cream-butter">
                      Belo Jardim por elas
                    </p>
                  </div>
                </div>
              </section>

              {/* Blocos 2 e 3: Grade editorial alternada */}
              <div data-testid="about-editorial-grid" className="space-y-8">
                {/* Linha 1: História do projeto à esquerda | Foto/registro à direita */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
                  <div className="space-y-4 md:col-span-6">
                    <header className="space-y-3">
                      <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-tv-purple-deep sm:text-3xl">
                        Sobre nós
                      </h2>
                      <div
                        aria-hidden="true"
                        className="h-1 w-20 rounded-full bg-tv-purple-deep"
                      />
                    </header>

                    <p className="text-base leading-relaxed text-tv-purple-deep">
                      <strong>{PROJECT_INFO.name}</strong> é um mapa comunitário para
                      mulheres em <strong>Belo Jardim – PE</strong> ({PROJECT_INFO.coverage}
                      ), reunindo serviços de saúde, proteção e apoio, assistência pública,
                      artesanato, arte e cultura e empreendedoras locais.
                    </p>

                    <p className="text-sm leading-relaxed text-tv-purple-dark">
                      A iniciativa nasce de forma coletiva para dar visibilidade a espaços de
                      cuidado, criação, economia solidária e fortalecimento comunitário em
                      toda a cidade e nos distritos.
                    </p>

                    <div
                      aria-hidden="true"
                      className="mx-auto h-px w-2/3 bg-tv-purple-deep/30"
                    />
                  </div>

                  <div className="md:col-span-6">
                    <div className="flex aspect-[16/10] w-full flex-col items-center justify-center gap-2 rounded-xl border border-tv-lavender/80 bg-tv-cream-warm/85 p-6 text-center">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-tv-lavender bg-tv-cream-mint text-tv-purple-dark">
                        <ImageIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <p className="text-sm font-bold text-tv-purple-deep">
                        Registros do projeto
                      </p>
                      <p className="text-xs font-medium text-tv-purple-dark">
                        Foto com bolsistas e registros do projeto em breve
                      </p>
                    </div>
                  </div>
                </div>

                {/* Linha 2 (alternada): Imagem complementar à esquerda | Privacidade e links legais à direita */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
                  <div className="md:col-span-5">
                    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-xl border border-tv-lavender/80 bg-tv-cream-warm/85 p-6 text-center">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-tv-lavender bg-tv-cream-mint text-tv-purple-dark">
                        <ImageIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <p className="text-xs font-medium text-tv-purple-dark">
                        Imagens complementares da narrativa em breve
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 md:col-span-7">
                    <p className="rounded-xl border border-tv-lavender bg-tv-cream-warm/90 p-4 text-sm leading-relaxed text-tv-purple-deep">
                      {PROJECT_INFO.privacySummary}
                    </p>

                    <nav aria-label="Documentos legais" className="flex flex-wrap gap-2.5">
                      <Link
                        href="/privacidade"
                        prefetch={false}
                        className="inline-flex min-h-12 min-w-11 items-center justify-center rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-4 py-2.5 text-sm font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
                      >
                        Política de Privacidade
                      </Link>
                      <Link
                        href="/termos"
                        prefetch={false}
                        className="inline-flex min-h-12 min-w-11 items-center justify-center rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-4 py-2.5 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
                      >
                        Termos de Uso
                      </Link>
                    </nav>

                    <p className="text-xs font-semibold text-tv-purple-dark">
                      {PERMANENT_EMERGENCY_DISCLAIMER}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bloco 4: Régua de logo de parceria e incentivadores */}
              <footer
                data-testid="about-logo-strip"
                aria-label="Régua de logos de parceria e incentivadores"
                className="rounded-xl border border-tv-lavender/80 bg-tv-cream-warm/95 px-5 py-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-tv-purple-deep text-xs font-extrabold text-tv-cream-mint"
                    >
                      TV
                    </span>
                    <div>
                      <p className="text-sm font-extrabold leading-tight text-tv-purple-deep">
                        {PROJECT_INFO.name}
                      </p>
                      <p className="text-xs font-medium text-tv-purple-dark">
                        Belo Jardim por elas
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-tv-lavender bg-tv-cream-mint px-3 py-1 text-xs font-semibold text-tv-purple-dark">
                    Régua de logos de parceria e incentivadores
                  </span>
                </div>
              </footer>
            </div>
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
  );
}

export function ThreeDotsMenu({
  isOpen,
  onOpenChange,
  hideTriggerOnMobile = false,
  handleEscape = true,
  className = "",
}: ThreeDotsMenuProps) {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const firstActionRef = useRef<HTMLButtonElement | null>(null);

  const closeMenu = useCallback(() => {
    onOpenChange(false);
  }, [onOpenChange]);

  const openMenu = useCallback(() => {
    onOpenChange(true);
  }, [onOpenChange]);

  useFocusRestore(isOpen, firstActionRef, triggerRef);

  useEffect(() => {
    if (!isOpen || !handleEscape) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleEscape, closeMenu]);

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
        className={`absolute bottom-3 right-3 ${
          isOpen ? "z-[60]" : "z-30"
        } min-h-11 min-w-11 h-11 w-11 items-center justify-center rounded-full border-2 border-tv-purple-deep bg-tv-purple-deep text-tv-cream-mint shadow-lg transition-colors hover:bg-tv-purple-dark md:h-14 md:w-14 ${
          hideTriggerOnMobile ? "hidden md:flex" : "flex"
        } ${className}`.trim()}
      >
        <MoreHorizontal className="h-5 w-5 md:h-6 md:w-6" aria-hidden="true" />
      </button>

      {isOpen ? (
        <ThreeDotsMenuDialog firstActionRef={firstActionRef} onClose={closeMenu} />
      ) : null}
    </>
  );
}
