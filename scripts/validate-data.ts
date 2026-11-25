import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validatePlacesDataset,
  type ValidationResult,
} from "../src/lib/data/schema";

export interface ValidateDataFilesOptions {
  locaisPath?: string;
  autorizacoesPath?: string;
  geojsonPath?: string;
  referenceDate?: Date;
}

function readJsonFile(filePath: string, label: string): { ok: true; data: unknown } | { ok: false; error: string } {
  try {
    const content = readFileSync(filePath, "utf8");
    return { ok: true, data: JSON.parse(content) as unknown };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `Não foi possível ler ou interpretar ${label} (${filePath}): ${reason}`,
    };
  }
}

export function validateDataFiles(
  options: ValidateDataFilesOptions = {},
): ValidationResult {
  const rootDir = process.cwd();
  const locaisPath = options.locaisPath ?? path.join(rootDir, "data", "locais.json");
  const autorizacoesPath =
    options.autorizacoesPath ?? path.join(rootDir, "data", "autorizacoes.json");
  const geojsonPath = options.geojsonPath ?? path.join(rootDir, "data", "locais.geojson");

  const readErrors: string[] = [];

  const locaisRead = readJsonFile(locaisPath, "data/locais.json");
  if (!locaisRead.ok) {
    readErrors.push(locaisRead.error);
  }

  const autorizacoesRead = readJsonFile(autorizacoesPath, "data/autorizacoes.json");
  if (!autorizacoesRead.ok) {
    readErrors.push(autorizacoesRead.error);
  }

  const geojsonRead = readJsonFile(geojsonPath, "data/locais.geojson");
  if (!geojsonRead.ok) {
    readErrors.push(geojsonRead.error);
  }

  if (readErrors.length > 0 || !locaisRead.ok || !autorizacoesRead.ok || !geojsonRead.ok) {
    return { ok: false, errors: readErrors };
  }

  return validatePlacesDataset(
    locaisRead.data,
    autorizacoesRead.data,
    geojsonRead.data,
    { referenceDate: options.referenceDate },
  );
}

function main(): void {
  const result = validateDataFiles();

  if (!result.ok) {
    console.error("❌ Falha na validação dos dados (build bloqueado):");
    for (const error of result.errors) {
      console.error(`  - ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(
    `✅ Validação de dados concluída: ${result.locais.length} locais publicados com autorização LGPD ativa, paridade GeoJSON e zero registros proibidos.`,
  );
}

const isEntryPoint =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  typeof process.argv[1] === "string" &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isEntryPoint) {
  main();
}
