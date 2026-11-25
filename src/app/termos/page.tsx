import type { Metadata } from "next";
import { PROJECT_INFO } from "@/components/emergency/EmergencyConstants";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Termos de Uso — Tecendo Vozes",
  description:
    "Termos de Uso do Tecendo Vozes em Belo Jardim – PE: caráter informativo e não oficial, autorização LGPD obrigatória e proibição de abrigos sigilosos.",
};

export default function TermosPage() {
  return (
    <LegalPageShell
      title="Termos de Uso"
      subtitle="Regras de uso, limites informativos e critérios de segurança e consentimento LGPD do mapa Tecendo Vozes."
      currentPath="/termos"
    >
      <section
        aria-labelledby="termos-finalidade"
        className="space-y-2 rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-5 shadow-xs"
      >
        <h2
          id="termos-finalidade"
          className="text-lg font-extrabold text-tv-purple-deep sm:text-xl"
        >
          1. Finalidade informativa e caráter não oficial
        </h2>
        <p className="text-sm leading-relaxed text-tv-purple-deep sm:text-base">
          O <strong>{PROJECT_INFO.name}</strong> é uma iniciativa comunitária de caráter
          exclusivamente <strong>informativo</strong> voltada para mulheres em{" "}
          <strong>Belo Jardim – PE</strong> ({PROJECT_INFO.coverage}), reunindo referências de
          saúde, proteção e apoio, assistência pública, artesanato, arte/cultura e empreendedoras
          locais.
        </p>
        <p className="text-sm leading-relaxed text-tv-purple-dark sm:text-base">
          Este site <strong>não é um canal oficial de atendimento ou de denúncia</strong> e não
          substitui serviços públicos de urgência ou emergência. Em situação de risco imediato,
          ligue gratuitamente para <strong>180</strong> (Central de Atendimento à Mulher),{" "}
          <strong>190</strong> (Polícia Militar) ou <strong>192</strong> (SAMU).
        </p>
      </section>

      <section
        aria-labelledby="termos-autorizacao-seguranca"
        className="space-y-2 rounded-2xl border-2 border-tv-purple-deep bg-tv-cream-butter p-5 shadow-xs"
      >
        <h2
          id="termos-autorizacao-seguranca"
          className="text-lg font-extrabold text-tv-purple-deep sm:text-xl"
        >
          2. Autorização LGPD obrigatória e proibição de abrigos sigilosos
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-tv-purple-deep sm:text-base">
          <li>
            <strong>Publicação somente com autorização LGPD ativa:</strong> nenhum espaço ou
            iniciativa é publicado no mapa sem consentimento formal válido registrado no controle
            versionado (<code>autorizacoes.json</code>) e verificado automaticamente antes de cada
            publicação.
          </li>
          <li>
            <strong>Proibição estrita de abrigos e casas de acolhimento sigilosas:</strong> por
            segurança das mulheres atendidas e das equipes locais, é terminantemente proibido
            cadastrar, mapear ou divulgar o endereço de abrigos ou casas de acolhimento sigilosas
            nesta plataforma.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="termos-responsabilidades"
        className="space-y-2 rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-5 shadow-xs"
      >
        <h2
          id="termos-responsabilidades"
          className="text-lg font-extrabold text-tv-purple-deep sm:text-xl"
        >
          3. Responsabilidades de uso e atualização de informações
        </h2>
        <p className="text-sm leading-relaxed text-tv-purple-deep sm:text-base">
          Buscamos manter horários, telefones e endereços atualizados junto aos serviços e às
          iniciativas participantes, porém horários de atendimento podem sofrer alterações locais
          sem aviso prévio. Recomendamos confirmar o atendimento pelos canais oficiais do próprio
          serviço quando possível.
        </p>
        <p className="text-sm leading-relaxed text-tv-purple-dark sm:text-base">
          Ao utilizar o site, você concorda em respeitar o caráter comunitário das informações e em
          não utilizar os dados de empreendedoras, artesãs ou serviços listados para assédio,
          divulgação não autorizada ou finalidades ilícitas.
        </p>
      </section>

      <section
        aria-labelledby="termos-contato"
        className="space-y-2 rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-5 shadow-xs"
      >
        <h2
          id="termos-contato"
          className="text-lg font-extrabold text-tv-purple-deep sm:text-xl"
        >
          4. Contato e responsável pelo projeto
        </h2>
        <p className="text-sm leading-relaxed text-tv-purple-deep sm:text-base">
          O responsável pela curadoria técnica e pelo atendimento LGPD do {PROJECT_INFO.name} é{" "}
          <strong>{PROJECT_INFO.lgpdContactName}</strong> ({PROJECT_INFO.lgpdContactRole}).
          Solicitações de correção, atualização cadastral ou revogação de autorização podem ser
          encaminhadas a qualquer momento para remoção imediata do ponto no mapa.
        </p>
      </section>
    </LegalPageShell>
  );
}
