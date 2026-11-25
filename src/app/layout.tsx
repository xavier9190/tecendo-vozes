import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tecendo Vozes — Mapa Local para Mulheres em Belo Jardim",
  description:
    "Mapa local e acessível com serviços de saúde, proteção e apoio, apoio público, artesanato, arte e cultura e empreendedoras em Belo Jardim – PE.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-tv-cream-warm text-tv-purple-deep antialiased">
        <a href="#conteudo-principal" className="skip-link">
          Ir para o conteúdo principal
        </a>
        {children}
      </body>
    </html>
  );
}
