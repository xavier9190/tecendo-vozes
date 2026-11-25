import { CATEGORIES } from "@/lib/theme/categories";

export default function HomePage() {
  return (
    <div className="min-h-dvh flex flex-col bg-tv-cream-warm text-tv-purple-deep">
      <header className="border-b-2 border-tv-lavender-light bg-tv-cream-mint">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-tv-purple-dark">
              Belo Jardim – PE • Sede e Distritos
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-tv-purple-deep md:text-3xl">
              Tecendo Vozes
            </h1>
          </div>
          <p className="max-w-md text-sm text-tv-purple-dark md:text-right md:text-base">
            Mapa local para mulheres com acesso rápido, acessível e sem rastreamento.
          </p>
        </div>
      </header>

      <main
        id="conteudo-principal"
        className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 md:grid md:grid-cols-12 md:gap-8 md:px-6 md:py-8"
      >
        <section
          aria-labelledby="sobre-mapa-titulo"
          className="flex flex-col justify-between rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-5 shadow-sm md:col-span-5"
        >
          <div className="space-y-3">
            <span className="inline-flex min-h-8 items-center rounded-full bg-tv-purple-deep px-3 py-1 text-sm font-semibold text-tv-cream-mint">
              Estrutura Base MVP
            </span>
            <h2
              id="sobre-mapa-titulo"
              className="text-xl font-bold text-tv-purple-deep md:text-2xl"
            >
              Rede local de cuidado, cultura e autonomia
            </h2>
            <p className="text-base text-tv-purple-dark">
              Base responsiva preparada para visualização mobile (&lt; md) e desktop
              (&gt;= md), com paleta oficial validada em contraste WCAG 2.1 AA e
              identificação por cor, ícone e rótulo.
            </p>
          </div>

          <div className="mt-6 rounded-xl border border-tv-lavender-light bg-tv-cream-warm p-4">
            <p className="text-sm font-semibold text-tv-purple-deep">
              Privacidade em primeiro lugar
            </p>
            <p className="mt-1 text-sm text-tv-purple-dark">
              Zero cookies, zero rastreamento e zero armazenamento de buscas ou visitas.
            </p>
          </div>
        </section>

        <section
          aria-labelledby="categorias-titulo"
          className="rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-5 shadow-sm md:col-span-7"
        >
          <div className="mb-4">
            <h2
              id="categorias-titulo"
              className="text-xl font-bold text-tv-purple-deep md:text-2xl"
            >
              Categorias do mapa
            </h2>
            <p className="mt-1 text-sm text-tv-purple-dark md:text-base">
              Cada categoria combina cor oficial, ícone próprio e rótulo legível.
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <li
                  key={category.id}
                  style={{
                    backgroundColor: category.surfaceBg,
                    color: category.surfaceText,
                    borderColor: category.borderColor,
                  }}
                  className="flex min-h-16 items-start gap-3 rounded-xl border-2 p-3.5"
                >
                  <span
                    aria-hidden="true"
                    style={{
                      backgroundColor: category.markerBg,
                      color: category.markerIconColor,
                    }}
                    className="mt-0.5 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-tv-purple-deep/20"
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        style={{
                          backgroundColor: category.badgeBg,
                          color: category.badgeText,
                          borderColor: category.borderColor,
                        }}
                        className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-bold"
                      >
                        {category.label}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-snug text-tv-purple-dark">
                      {category.shortDescription}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
