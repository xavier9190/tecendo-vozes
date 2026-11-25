import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { validateDataFiles } from "../../../scripts/validate-data";

describe("scripts/validate-data.ts — trava de build", () => {
  it("aprova o dataset real do repositório em data/", () => {
    const result = validateDataFiles();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.locais.length).toBeGreaterThanOrEqual(12);
    }
  });

  it("falha com erro claro em português se houver local sem autorização ou termo proibido", () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), "tecendo-vozes-gate-"));

    try {
      const locaisPath = path.join(tempDir, "locais.json");
      const autorizacoesPath = path.join(tempDir, "autorizacoes.json");
      const geojsonPath = path.join(tempDir, "locais.geojson");

      const invalidLocais = [
        {
          id: "abrigo-teste",
          nome: "Casa-Abrigo Sigilosa Teste",
          categoria: "protecao-apoio",
          descricaoCurta: "Descrição teste",
          distrito: "Sede",
          endereco: "Rua Teste, 1",
          coordinates: [-36.424, -8.3358],
          verificado: true,
        },
      ];

      writeFileSync(locaisPath, JSON.stringify(invalidLocais), "utf8");
      writeFileSync(autorizacoesPath, JSON.stringify([]), "utf8");
      writeFileSync(
        geojsonPath,
        JSON.stringify({ type: "FeatureCollection", features: [] }),
        "utf8",
      );

      const result = validateDataFiles({
        locaisPath,
        autorizacoesPath,
        geojsonPath,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        const message = result.errors.join("\n");
        expect(message).toMatch(/proibido|abrigo/i);
        expect(message).toMatch(/autorizaç/i);
      }
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
