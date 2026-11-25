import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "../theme/categories";
import { BELO_JARDIM_DISTRICTS } from "./schema";
import { getLocalById, getLocais, getLocaisGeoJson } from "./locais";

describe("dataset seed de Belo Jardim e acessores (locais.ts)", () => {
  it("retorna ao menos 12 locais cobrindo todas as 6 categorias e 4 distritos", () => {
    const locais = getLocais();

    expect(locais.length).toBeGreaterThanOrEqual(12);

    const categoriasPresentes = new Set(locais.map((l) => l.categoria));
    for (const categoria of CATEGORY_IDS) {
      expect(categoriasPresentes.has(categoria)).toBe(true);
    }

    const distritosPresentes = new Set(locais.map((l) => l.distrito));
    for (const distrito of BELO_JARDIM_DISTRICTS) {
      expect(distritosPresentes.has(distrito)).toBe(true);
    }
  });

  it("inclui locais completos com mídia/horário e ao menos 2 locais omitindo campos opcionais para fallback", () => {
    const locais = getLocais();

    const comMidiaCompleta = locais.filter(
      (l) =>
        Boolean(l.horarioFuncionamento) &&
        Boolean(l.midia?.fotos && l.midia.fotos.length > 0) &&
        Boolean(l.midia?.youtubeVideoId),
    );
    expect(comMidiaCompleta.length).toBeGreaterThanOrEqual(1);

    const semCamposOpcionais = locais.filter(
      (l) =>
        !l.horarioFuncionamento ||
        !l.midia?.fotos?.length ||
        !l.midia?.youtubeVideoId,
    );
    expect(semCamposOpcionais.length).toBeGreaterThanOrEqual(2);
  });

  it("retorna GeoJSON em paridade e busca por ID funcionando", () => {
    const locais = getLocais();
    const geojson = getLocaisGeoJson();

    expect(geojson.type).toBe("FeatureCollection");
    expect(geojson.features).toHaveLength(locais.length);

    const primeiro = locais[0]!;
    expect(getLocalById(primeiro.id)).toEqual(primeiro);
    expect(getLocalById("id-que-nao-existe")).toBeUndefined();
  });
});
