import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { PROJECT_INFO } from "@/lib/project-info";

export const metadata: Metadata = {
  title: "Política de Privacidade — Tecendo Vozes",
  description:
    "Saiba como o Tecendo Vozes protege sua privacidade: zero cookies de rastreamento, zero login, zero histórico de busca e geolocalização apenas local.",
};

export default function PrivacidadePage() {
  return (
    <LegalPageShell
      title="Política de Privacidade"
      subtitle="Aqui você navega sem cadastro, sem rastreamento e sem deixar histórico de buscas ou visitas no site."
      currentPath="/privacidade"
    >
      <section
        aria-labelledby="priv-zero-rastreamento"
        className="space-y-2 rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-5 shadow-xs"
      >
        <h2
          id="priv-zero-rastreamento"
          className="text-lg font-extrabold text-tv-purple-deep sm:text-xl"
        >
          1. Sem login, sem cookies de rastreamento e sem histórico
        </h2>
        <p className="text-sm leading-relaxed text-tv-purple-deep sm:text-base">
          O <strong>{PROJECT_INFO.name}</strong> funciona em total conformidade com a Lei Geral de
          Proteção de Dados (LGPD — Lei nº 13.709/2018) sob o princípio de privacidade absoluta por
          padrão:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-tv-purple-dark sm:text-base">
          <li>
            <strong>Ausência total de login ou cadastro:</strong> você não precisa informar nome,
            CPF, telefone ou e-mail para consultar serviços, locais ou iniciativas.
          </li>
          <li>
            <strong>Zero cookies de rastreamento e zero analytics identificável:</strong> não
            instalamos cookies publicitários, cookies de perfilamento ou ferramentas de analytics que
            identifiquem ou sigam você.
          </li>
          <li>
            <strong>Zero histórico de buscas ou visitas:</strong> o que você digita na barra de
            pesquisa e os filtros de categoria que seleciona funcionam 100% no seu dispositivo,
            nunca são gravados em <code>localStorage</code>, <code>sessionStorage</code> ou enviados
            pela internet.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="priv-geolocalizacao"
        className="space-y-2 rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-5 shadow-xs"
      >
        <h2
          id="priv-geolocalizacao"
          className="text-lg font-extrabold text-tv-purple-deep sm:text-xl"
        >
          2. Uso exclusivamente local da geolocalização
        </h2>
        <p className="text-sm leading-relaxed text-tv-purple-deep sm:text-base">
          O uso da sua localização é <strong>totalmente opcional</strong>. Se você clicar no botão
          para centralizar o mapa perto de onde está, o navegador solicita sua permissão apenas para
          mostrar sua posição na tela naquele momento.
        </p>
        <p className="text-sm leading-relaxed text-tv-purple-dark sm:text-base">
          Suas coordenadas ficam exclusivamente no seu navegador: elas{" "}
          <strong>nunca são enviadas para servidores externos e nunca são armazenadas</strong>. Caso
          você negue a permissão, o mapa continua funcionando normalmente em Belo Jardim e distritos.
        </p>
      </section>

      <section
        aria-labelledby="priv-hospedagem-midia"
        className="space-y-2 rounded-2xl border-2 border-tv-lavender bg-tv-cream-mint p-5 shadow-xs"
      >
        <h2
          id="priv-hospedagem-midia"
          className="text-lg font-extrabold text-tv-purple-deep sm:text-xl"
        >
          3. Transparência sobre hospedagem (Vercel), mapas e vídeos (youtube-nocookie.com)
        </h2>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-tv-purple-dark sm:text-base">
          <li>
            <strong>Hospedagem na Vercel:</strong> este site é hospedado na infraestrutura da
            Vercel, que pode manter logs técnicos operacionais transitórios (como endereço IP e
            requisições HTTP de entrega da página) estritamente para segurança, disponibilidade e
            proteção contra ataques, sem qualquer cruzamento com buscas ou filtros feitos no mapa.
          </li>
          <li>
            <strong>Vídeos via youtube-nocookie.com:</strong> quando um local possui vídeo de
            apresentação, a incorporação usa exclusivamente o domínio{" "}
            <code>youtube-nocookie.com</code> (modo de privacidade avançada), que evita a gravação
            de cookies de rastreamento do YouTube antes de você apertar o play.
          </li>
          <li>
            <strong>Links externos e rotas:</strong> botões como &ldquo;Como chegar&rdquo; ou
            &ldquo;WhatsApp 180&rdquo; abrem serviços externos em nova aba, sujeitos às políticas
            dessas plataformas.
          </li>
        </ul>
      </section>

      <section
        aria-labelledby="priv-navegacao-anonima"
        className="space-y-2 rounded-2xl border-2 border-tv-purple-deep bg-tv-cream-butter p-5 shadow-xs"
      >
        <h2
          id="priv-navegacao-anonima"
          className="text-lg font-extrabold text-tv-purple-deep sm:text-xl"
        >
          4. Orientação prática se você compartilha o celular ou computador
        </h2>
        <p className="text-sm leading-relaxed text-tv-purple-deep sm:text-base">
          Mesmo que o {PROJECT_INFO.name} não salve seu histórico de buscas, o próprio navegador
          (Chrome, Safari, Firefox ou Edge) registra os endereços dos sites acessados na lista de
          histórico do aparelho. Se você compartilha o dispositivo com outra pessoa e precisa de
          sigilo extra:
        </p>
        <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-tv-purple-deep sm:text-base">
          <li>
            Prefira abrir o site em uma <strong>aba anônima / navegação privada</strong> (no menu do
            navegador, toque em &ldquo;Nova guia anônima&rdquo; ou &ldquo;Nova janela
            privada&rdquo;).
          </li>
          <li>
            Se já acessou em uma aba comum, você pode apagar o registro recente em{" "}
            <strong>Histórico → Limpar dados de navegação</strong> e fechar a aba ao terminar.
          </li>
        </ul>
      </section>
    </LegalPageShell>
  );
}
