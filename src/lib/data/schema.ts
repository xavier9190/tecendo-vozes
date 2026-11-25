import { z } from "zod";
import { CATEGORY_IDS } from "../theme/categories";

export const BELO_JARDIM_DISTRICTS = [
  "Sede",
  "Serra do Vento",
  "Água Fria",
  "Xucuru",
] as const;

export type BeloJardimDistrict = (typeof BELO_JARDIM_DISTRICTS)[number];

export const BELO_JARDIM_BOUNDS = [
  [-36.62, -8.52],
  [-36.22, -8.15],
] as const;

export function isWithinBeloJardimBounds(coordinates: readonly [number, number]): boolean {
  const [lng, lat] = coordinates;
  const [[west, south], [east, north]] = BELO_JARDIM_BOUNDS;
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

const PROHIBITED_SHELTER_PATTERNS: readonly RegExp[] = [
  /\babrigos?\b/,
  /\babrigamento\b/,
  /\bcasa\s+abrigo\b/,
  /\bcasas?\s+de\s+acolhimento\b/,
  /\bacolhimento\s+sigiloso\b/,
  /\brefugio\s+sigiloso\b/,
  /\brefugios\s+sigilosos\b/,
  /\bcasa\s+de\s+refugio\b/,
  /\balbergues?\b/,
  /\bendereco\s+sigiloso\b/,
];

function normalizeForSafetyCheck(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findProhibitedShelterTerm(local: Local): string | null {
  const fieldsToInspect = [
    local.id,
    local.categoria,
    local.nome,
    local.descricaoCurta,
    local.descricaoCompleta ?? "",
    local.endereco,
    ...(local.tags ?? []),
  ];

  for (const field of fieldsToInspect) {
    const normalized = normalizeForSafetyCheck(field);
    for (const pattern of PROHIBITED_SHELTER_PATTERNS) {
      const match = normalized.match(pattern);
      if (match) {
        return match[0];
      }
    }
  }

  return null;
}

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

function isValidIsoDate(value: string): boolean {
  if (!isoDateRegex.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

const IsoDateSchema = z
  .string()
  .refine(isValidIsoDate, "Data deve estar no formato válido AAAA-MM-DD");

export const FotoMidiaSchema = z.object({
  url: z.string().min(1, "URL da foto é obrigatória"),
  alt: z.string().min(1, "Texto alternativo (alt) da foto é obrigatório"),
});

export const MidiaSchema = z.object({
  fotos: z.array(FotoMidiaSchema).optional(),
  youtubeVideoId: z
    .string()
    .regex(/^[A-Za-z0-9_-]{11}$/, "ID de vídeo do YouTube inválido")
    .optional(),
});

export const LocalSchema = z.object({
  id: z
    .string()
    .min(1, "ID do local é obrigatório")
    .regex(/^[a-z0-9-]+$/, "ID do local deve usar apenas letras minúsculas, números e hífen"),
  nome: z.string().min(1, "Nome do local é obrigatório"),
  categoria: z.enum(CATEGORY_IDS, {
    error: "Categoria inválida; use uma das 6 categorias oficiais",
  }),
  descricaoCurta: z.string().min(1, "Descrição curta é obrigatória"),
  descricaoCompleta: z.string().min(1).optional(),
  distrito: z.enum(BELO_JARDIM_DISTRICTS, {
    error: "Distrito inválido para Belo Jardim",
  }),
  endereco: z.string().min(1, "Endereço é obrigatório"),
  coordinates: z
    .tuple([z.number().finite(), z.number().finite()])
    .refine(
      isWithinBeloJardimBounds,
      "Coordenadas devem estar estritamente dentro dos limites de Belo Jardim ([[-36.62, -8.52], [-36.22, -8.15]])",
    ),
  horarioFuncionamento: z.string().min(1).optional(),
  telefone: z.string().min(1).optional(),
  whatsapp: z.string().min(1).optional(),
  site: z.url("URL do site inválida").optional(),
  instagram: z.string().min(1).optional(),
  tags: z.array(z.string().min(1)).optional(),
  verificado: z.boolean(),
  dataVerificacao: IsoDateSchema.optional(),
  midia: MidiaSchema.optional(),
});

export type Local = z.infer<typeof LocalSchema>;

export const AutorizacaoStatusSchema = z.enum(["ativa", "revogada", "pendente"]);

export const AutorizacaoSchema = z.object({
  localId: z.string().min(1, "localId é obrigatório"),
  status: AutorizacaoStatusSchema,
  responsavelNome: z.string().min(1, "Nome do responsável pela autorização é obrigatório"),
  dataConsentimento: IsoDateSchema,
  termosVersao: z.string().min(1, "Versão dos termos é obrigatória"),
  escopoPublicacao: z.string().min(1, "Escopo de publicação é obrigatório"),
  validade: IsoDateSchema.optional(),
});

export type Autorizacao = z.infer<typeof AutorizacaoSchema>;

export const LocalGeoJsonPropertiesSchema = LocalSchema.omit({ coordinates: true });

export type LocalGeoJsonProperties = z.infer<typeof LocalGeoJsonPropertiesSchema>;

export const LocalFeatureSchema = z.object({
  type: z.literal("Feature"),
  geometry: z.object({
    type: z.literal("Point"),
    coordinates: z
      .tuple([z.number().finite(), z.number().finite()])
      .refine(
        isWithinBeloJardimBounds,
        "Coordenadas GeoJSON devem estar dentro dos limites de Belo Jardim",
      ),
  }),
  properties: LocalGeoJsonPropertiesSchema,
});

export type LocalGeoJsonFeature = z.infer<typeof LocalFeatureSchema>;

export const LocaisGeoJsonSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(LocalFeatureSchema),
});

export type LocaisGeoJson = z.infer<typeof LocaisGeoJsonSchema>;

export function toLocaisGeoJson(locais: readonly Local[]): LocaisGeoJson {
  return {
    type: "FeatureCollection",
    features: locais.map(({ coordinates, ...properties }) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [coordinates[0], coordinates[1]],
      },
      properties,
    })),
  };
}

export type ValidationResult =
  | {
      ok: true;
      locais: Local[];
      autorizacoes: Autorizacao[];
      geojson?: LocaisGeoJson;
    }
  | {
      ok: false;
      errors: string[];
    };

function deepEqualIgnoringUndefined(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true;
  }
  if (typeof a !== typeof b || a === null || b === null) {
    return false;
  }
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => deepEqualIgnoringUndefined(item, b[index]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const aEntries = Object.entries(a as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    const bEntries = Object.entries(b as Record<string, unknown>).filter(
      ([, v]) => v !== undefined,
    );
    if (aEntries.length !== bEntries.length) {
      return false;
    }
    const bMap = new Map(bEntries);
    return aEntries.every(
      ([key, val]) => bMap.has(key) && deepEqualIgnoringUndefined(val, bMap.get(key)),
    );
  }
  return false;
}

export interface ValidateDatasetOptions {
  referenceDate?: Date;
}

export function validatePlacesDataset(
  rawLocais: unknown,
  rawAutorizacoes: unknown,
  rawGeoJson?: unknown,
  options?: ValidateDatasetOptions,
): ValidationResult {
  const errors: string[] = [];

  const locaisArraySchema = z.array(LocalSchema);
  const autorizacoesArraySchema = z.array(AutorizacaoSchema);

  const parsedLocais = locaisArraySchema.safeParse(rawLocais);
  if (!parsedLocais.success) {
    for (const issue of parsedLocais.error.issues) {
      errors.push(`Erro no schema de locais (${issue.path.join(".") || "raiz"}): ${issue.message}`);
    }
  }

  const parsedAutorizacoes = autorizacoesArraySchema.safeParse(rawAutorizacoes);
  if (!parsedAutorizacoes.success) {
    for (const issue of parsedAutorizacoes.error.issues) {
      errors.push(
        `Erro no schema de autorizações (${issue.path.join(".") || "raiz"}): ${issue.message}`,
      );
    }
  }

  let parsedGeoJson: LocaisGeoJson | undefined;
  if (rawGeoJson !== undefined) {
    const geoJsonResult = LocaisGeoJsonSchema.safeParse(rawGeoJson);
    if (!geoJsonResult.success) {
      for (const issue of geoJsonResult.error.issues) {
        errors.push(
          `Erro no schema de GeoJSON (${issue.path.join(".") || "raiz"}): ${issue.message}`,
        );
      }
    } else {
      parsedGeoJson = geoJsonResult.data;
    }
  }

  if (!parsedLocais.success || !parsedAutorizacoes.success) {
    return { ok: false, errors };
  }

  const seenIds = new Set<string>();
  const locaisById = new Map<string, Local>();
  for (const local of parsedLocais.data) {
    if (seenIds.has(local.id)) {
      errors.push(`ID duplicado encontrado em locais: "${local.id}".`);
    } else {
      locaisById.set(local.id, local);
    }
    seenIds.add(local.id);
  }

  const authByLocalId = new Map<string, Autorizacao>();
  for (const auth of parsedAutorizacoes.data) {
    if (authByLocalId.has(auth.localId)) {
      errors.push(`Autorização duplicada para o local "${auth.localId}".`);
      continue;
    }
    authByLocalId.set(auth.localId, auth);
  }

  const referenceDate = options?.referenceDate ?? new Date();
  const referenceIso = referenceDate.toISOString().slice(0, 10);

  for (const local of parsedLocais.data) {
    const prohibitedTerm = findProhibitedShelterTerm(local);
    if (prohibitedTerm) {
      errors.push(
        `Local "${local.id}" (${local.nome}) viola a regra de segurança por conter termo proibido ("${prohibitedTerm}"). Abrigos e casas de acolhimento são estritamente proibidos.`,
      );
    }

    const auth = authByLocalId.get(local.id);
    if (!auth) {
      errors.push(
        `Local "${local.id}" (${local.nome}) não possui registro de autorização LGPD em autorizacoes.json.`,
      );
      continue;
    }

    if (auth.status !== "ativa") {
      errors.push(
        `Local "${local.id}" (${local.nome}) possui autorização com status "${auth.status}"; apenas "ativa" pode ser publicada.`,
      );
      continue;
    }

    if (auth.validade && auth.validade < referenceIso) {
      errors.push(
        `Autorização do local "${local.id}" (${local.nome}) está expirada (validade: ${auth.validade}, referência: ${referenceIso}).`,
      );
    }
  }

  if (parsedGeoJson) {
    validateGeoJsonParity(parsedLocais.data, locaisById, parsedGeoJson, errors);
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    locais: parsedLocais.data,
    autorizacoes: parsedAutorizacoes.data,
    ...(parsedGeoJson ? { geojson: parsedGeoJson } : {}),
  };
}

function validateGeoJsonParity(
  locais: readonly Local[],
  locaisById: ReadonlyMap<string, Local>,
  geojson: LocaisGeoJson,
  errors: string[],
): void {
  if (geojson.features.length !== locais.length) {
    errors.push(
      `Falha de paridade GeoJSON: locais.json possui ${locais.length} registro(s), mas locais.geojson possui ${geojson.features.length} feature(s).`,
    );
  }

  const seenFeatureIds = new Set<string>();
  for (const feature of geojson.features) {
    const featureId = feature.properties.id;
    if (seenFeatureIds.has(featureId)) {
      errors.push(`Falha de paridade GeoJSON: ID duplicado "${featureId}" em locais.geojson.`);
      continue;
    }
    seenFeatureIds.add(featureId);

    const local = locaisById.get(featureId);
    if (!local) {
      errors.push(
        `Falha de paridade GeoJSON: feature "${featureId}" existe em locais.geojson mas não em locais.json.`,
      );
      continue;
    }

    if (
      feature.geometry.coordinates[0] !== local.coordinates[0] ||
      feature.geometry.coordinates[1] !== local.coordinates[1]
    ) {
      errors.push(
        `Falha de paridade GeoJSON: coordenadas divergentes para "${featureId}".`,
      );
    }

    const { coordinates: _ignored, ...expectedProperties } = local;
    void _ignored;
    if (!deepEqualIgnoringUndefined(feature.properties, expectedProperties)) {
      errors.push(
        `Falha de paridade GeoJSON: propriedades divergentes para "${featureId}".`,
      );
    }
  }

  for (const local of locais) {
    if (!seenFeatureIds.has(local.id)) {
      errors.push(
        `Falha de paridade GeoJSON: local "${local.id}" está ausente em locais.geojson.`,
      );
    }
  }
}
