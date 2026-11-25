import { describe, expect, it } from "vitest";
import {
  validatePlacesDataset,
  type Autorizacao,
  type Local,
} from "./schema";

function makeValidLocal(overrides: Partial<Local> = {}): Local {
  return {
    id: "ubs-centro-belo-jardim",
    nome: "UBS Centro — Saúde da Mulher",
    categoria: "saude",
    descricaoCurta: "Atendimento de enfermagem, pré-natal e saúde da mulher.",
    distrito: "Sede",
    endereco: "Rua Coronel Antônio Marinho, 120, Centro, Belo Jardim - PE",
    coordinates: [-36.424, -8.3358],
    verificado: true,
    dataVerificacao: "2026-10-15",
    ...overrides,
  };
}

function makeValidAutorizacao(overrides: Partial<Autorizacao> = {}): Autorizacao {
  return {
    localId: "ubs-centro-belo-jardim",
    status: "ativa",
    responsavelNome: "Maria Aparecida da Silva",
    dataConsentimento: "2026-10-10",
    termosVersao: "1.0",
    escopoPublicacao: "nome, categoria, endereco, coordenadas, contatos e horarios",
    ...overrides,
  };
}

describe("validatePlacesDataset — schema e unicidade", () => {
  it("aceita um conjunto válido de locais e autorizações ativas", () => {
    const locais = [makeValidLocal()];
    const autorizacoes = [makeValidAutorizacao()];

    const result = validatePlacesDataset(locais, autorizacoes);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.locais).toHaveLength(1);
      expect(result.locais[0]?.id).toBe("ubs-centro-belo-jardim");
    }
  });

  it("rejeita categoria desconhecida ou IDs duplicados com mensagem clara em português", () => {
    const invalidCategoryResult = validatePlacesDataset(
      [{ ...makeValidLocal(), categoria: "inexistente" }],
      [makeValidAutorizacao()],
    );

    expect(invalidCategoryResult.ok).toBe(false);
    if (!invalidCategoryResult.ok) {
      expect(invalidCategoryResult.errors.join(" ")).toMatch(/categoria/i);
    }

    const duplicateIdsResult = validatePlacesDataset(
      [makeValidLocal(), makeValidLocal({ nome: "Outro Nome" })],
      [makeValidAutorizacao()],
    );

    expect(duplicateIdsResult.ok).toBe(false);
    if (!duplicateIdsResult.ok) {
      expect(duplicateIdsResult.errors.join(" ")).toMatch(/duplicad/i);
    }
  });
});

describe("validatePlacesDataset — trava de autorização LGPD", () => {
  const refDate = new Date("2026-11-25T12:00:00Z");

  it("rejeita local sem autorização correspondente", () => {
    const result = validatePlacesDataset([makeValidLocal()], [], undefined, {
      referenceDate: refDate,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.join(" ")).toMatch(/autorizaç/i);
      expect(result.errors.join(" ")).toContain("ubs-centro-belo-jardim");
    }
  });

  it("rejeita local com autorização revogada ou pendente", () => {
    const revogada = validatePlacesDataset(
      [makeValidLocal()],
      [makeValidAutorizacao({ status: "revogada" })],
      undefined,
      { referenceDate: refDate },
    );
    expect(revogada.ok).toBe(false);
    if (!revogada.ok) {
      expect(revogada.errors.join(" ")).toMatch(/revogada/i);
    }

    const pendente = validatePlacesDataset(
      [makeValidLocal()],
      [makeValidAutorizacao({ status: "pendente" })],
      undefined,
      { referenceDate: refDate },
    );
    expect(pendente.ok).toBe(false);
    if (!pendente.ok) {
      expect(pendente.errors.join(" ")).toMatch(/pendente/i);
    }
  });

  it("rejeita autorização expirada e aceita autorização com validade vigente", () => {
    const expirada = validatePlacesDataset(
      [makeValidLocal()],
      [makeValidAutorizacao({ validade: "2026-11-24" })],
      undefined,
      { referenceDate: refDate },
    );
    expect(expirada.ok).toBe(false);
    if (!expirada.ok) {
      expect(expirada.errors.join(" ")).toMatch(/expirad|validade/i);
    }

    const vigente = validatePlacesDataset(
      [makeValidLocal()],
      [makeValidAutorizacao({ validade: "2027-11-25" })],
      undefined,
      { referenceDate: refDate },
    );
    expect(vigente.ok).toBe(true);
  });
});

describe("validatePlacesDataset — segurança e limites de Belo Jardim", () => {
  it("bloqueia abrigos e casas de acolhimento em nome, descrição, categoria ou tags", () => {
    const cases: Array<Omit<Partial<Local>, "categoria"> & { categoria?: string }> = [
      { nome: "Casa-Abrigo Regional Feminina" },
      { descricaoCurta: "Casa de acolhimento sigilosa para mulheres." },
      { descricaoCompleta: "Oferece refúgio sigiloso temporário." },
      { tags: ["emergencia", "abrigo"] },
      { categoria: "abrigo" },
    ];

    for (const override of cases) {
      const result = validatePlacesDataset(
        [{ ...makeValidLocal(), ...override }],
        [makeValidAutorizacao()],
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.join(" ")).toMatch(/proibid|abrigo|acolhimento|sigilos|categoria/i);
      }
    }
  });

  it("permite termo legítimo de acolhimento psicossocial sem confundir com casa de acolhimento", () => {
    const result = validatePlacesDataset(
      [
        makeValidLocal({
          categoria: "protecao-apoio",
          nome: "CRAM Belo Jardim",
          descricaoCurta: "Acolhimento psicossocial e orientação jurídica para mulheres.",
        }),
      ],
      [makeValidAutorizacao()],
    );

    expect(result.ok).toBe(true);
  });

  it("rejeita coordenadas fora dos limites de Belo Jardim", () => {
    const foraOeste = validatePlacesDataset(
      [makeValidLocal({ coordinates: [-36.8, -8.33] })],
      [makeValidAutorizacao()],
    );
    expect(foraOeste.ok).toBe(false);
    if (!foraOeste.ok) {
      expect(foraOeste.errors.join(" ")).toMatch(/coordenadas|limites|Belo Jardim/i);
    }

    const caruaru = validatePlacesDataset(
      [makeValidLocal({ coordinates: [-35.976, -8.283] })],
      [makeValidAutorizacao()],
    );
    expect(caruaru.ok).toBe(false);
  });
});

describe("validatePlacesDataset — paridade estrita com GeoJSON", () => {
  function makeValidGeoJson(local: Local) {
    const { coordinates, ...properties } = local;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates,
          },
          properties,
        },
      ],
    };
  }

  it("aceita GeoJSON em paridade exata com locais.json", () => {
    const local = makeValidLocal();
    const result = validatePlacesDataset(
      [local],
      [makeValidAutorizacao()],
      makeValidGeoJson(local),
    );

    expect(result.ok).toBe(true);
  });

  it("rejeita divergência de ID, coordenadas ou propriedades entre locais e GeoJSON", () => {
    const local = makeValidLocal();

    const missingFeature = validatePlacesDataset(
      [local],
      [makeValidAutorizacao()],
      { type: "FeatureCollection", features: [] },
    );
    expect(missingFeature.ok).toBe(false);
    if (!missingFeature.ok) {
      expect(missingFeature.errors.join(" ")).toMatch(/GeoJSON|paridade/i);
    }

    const coordDriftGeoJson = makeValidGeoJson(local);
    coordDriftGeoJson.features[0].geometry.coordinates = [-36.43, -8.34];
    const coordDrift = validatePlacesDataset(
      [local],
      [makeValidAutorizacao()],
      coordDriftGeoJson,
    );
    expect(coordDrift.ok).toBe(false);
    if (!coordDrift.ok) {
      expect(coordDrift.errors.join(" ")).toMatch(/coordenadas/i);
    }

    const propDriftGeoJson = makeValidGeoJson(local);
    propDriftGeoJson.features[0].properties.nome = "Nome Divergente";
    const propDrift = validatePlacesDataset(
      [local],
      [makeValidAutorizacao()],
      propDriftGeoJson,
    );
    expect(propDrift.ok).toBe(false);
    if (!propDrift.ok) {
      expect(propDrift.errors.join(" ")).toMatch(/propriedades|nome/i);
    }
  });
});



