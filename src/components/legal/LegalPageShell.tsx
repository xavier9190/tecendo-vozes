import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { EmergencyBar } from "@/components/emergency/EmergencyBar";
import { PROJECT_INFO } from "@/lib/project-info";

export interface LegalPageShellProps {
  title: string;
  subtitle: string;
  currentPath: "/privacidade" | "/termos";
  children: ReactNode;
}

/**
 * Shared accessible layout for legal/transparency pages (/privacidade and /termos).
 * Keeps header navigation, inline emergency channels, and minimal footer consistent.
 */
export function LegalPageShell({
  title,
  subtitle,
  currentPath,
  children,
}: LegalPageShellProps) {
  const siblingLink =
    currentPath === "/privacidade"
      ? { href: "/termos", label: "Termos de Uso", Icon: FileText }
      : { href: "/privacidade", label: "Política de Privacidade", Icon: ShieldCheck };

  const SiblingIcon = siblingLink.Icon;

  return (
    <div className="flex min-h-dvh flex-col bg-tv-cream-warm text-tv-purple-deep">
      <header className="border-b-2 border-tv-lavender bg-tv-cream-mint">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <nav aria-label="Navegação principal da página" className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl border-2 border-tv-purple-deep bg-tv-purple-deep px-4 py-2 text-sm font-bold text-tv-cream-mint transition-colors hover:bg-tv-purple-dark"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-tv-amber" aria-hidden="true" />
              <span>Voltar ao mapa</span>
            </Link>

            <Link
              href={siblingLink.href}
              className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-xl border-2 border-tv-purple-deep bg-tv-cream-warm px-4 py-2 text-sm font-bold text-tv-purple-deep transition-colors hover:bg-tv-cream-butter"
            >
              <SiblingIcon className="h-4 w-4 shrink-0 text-tv-coral" aria-hidden="true" />
              <span>{siblingLink.label}</span>
            </Link>
          </nav>

          <p className="text-sm font-extrabold text-tv-purple-deep">
            {PROJECT_INFO.name} — Belo Jardim (PE)
          </p>
        </div>
      </header>

      <main
        id="conteudo-principal"
        className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8"
      >
        <div className="space-y-2 rounded-2xl border-2 border-tv-purple-deep bg-tv-cream-mint p-5 shadow-xs sm:p-6">
          <h1 className="text-2xl font-extrabold leading-tight text-tv-purple-deep sm:text-3xl">
            {title}
          </h1>
          <p className="text-base leading-relaxed text-tv-purple-dark">{subtitle}</p>
        </div>

        <EmergencyBar variant="inline" />

        <div className="flex flex-col gap-4">{children}</div>
      </main>

      <footer className="mt-auto border-t-2 border-tv-lavender bg-tv-cream-mint">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5 sm:px-6">
          <p className="text-xs font-semibold text-tv-purple-dark">
            {PROJECT_INFO.name} — {PROJECT_INFO.subtitle} ({PROJECT_INFO.coverage})
          </p>
        </div>
      </footer>
    </div>
  );
}
