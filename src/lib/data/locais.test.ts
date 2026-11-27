import { describe, expect, it } from "vitest";
import { CATEGORY_IDS } from "../theme/categories";
import { BELO_JARDIM_DISTRICTS } from "./schema";
import { getLocalById, getLocais, getLocaisGeoJson } from "./locais";

describe("dataset curado de Belo Jardim e acessores (locais.ts)", () => {
  it("retorna os locais reais curados com categorias e distritos válidos", () => {
    const locais = getLocais();

    expect(locais.length).toBeGreaterThanOrEqual(4);

    const ids = new Set(locais.map((l) => l.id));
    expect(ids.has("vaca-profana-centro-cultural")).toBe(true);
    expect(ids.has("ceam-belo-jardim")).toBe(true);
    expect(ids.has("cras-serra-do-vento")).toBe(true);
    expect(ids.has("creas-regional-belo-jardim")).toBe(true);

    for (const local of locais) {
      expect(CATEGORY_IDS).toContain(local.categoria);
      expect(BELO_JARDIM_DISTRICTS).toContain(local.distrito);
    }
  });

  it("inclui local com vídeo e locais omitindo campos opcionais para fallback", () => {
    const locais = getLocais();

    const comVideo = locais.filter((l) => Boolean(l.midia?.youtubeVideoId));
    expect(comVideo.length).toBeGreaterThanOrEqual(1);

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
