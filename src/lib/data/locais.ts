import rawAutorizacoes from "../../../data/autorizacoes.json";
import rawLocais from "../../../data/locais.json";
import {
  toLocaisGeoJson,
  validatePlacesDataset,
  type LocaisGeoJson,
  type Local,
} from "./schema";

let cachedData: {
  locais: Local[];
  geojson: LocaisGeoJson;
} | null = null;

function loadValidatedDataset(): {
  locais: Local[];
  geojson: LocaisGeoJson;
} {
  if (cachedData) {
    return cachedData;
  }

  const result = validatePlacesDataset(rawLocais, rawAutorizacoes);
  if (!result.ok) {
    throw new Error(
      `Falha na validação LGPD/Schema dos dados de locais:\n- ${result.errors.join("\n- ")}`,
    );
  }

  cachedData = {
    locais: result.locais,
    geojson: toLocaisGeoJson(result.locais),
  };

  return cachedData;
}

export function getLocais(): Local[] {
  return loadValidatedDataset().locais;
}

export function getLocaisGeoJson(): LocaisGeoJson {
  return loadValidatedDataset().geojson;
}

export function getLocalById(id: string): Local | undefined {
  return loadValidatedDataset().locais.find((local) => local.id === id);
}
