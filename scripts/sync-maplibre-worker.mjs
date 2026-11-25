import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sourceWorkerPath = path.resolve(
  rootDir,
  "node_modules",
  "maplibre-gl",
  "dist",
  "maplibre-gl-worker.mjs",
);
const targetDir = path.resolve(rootDir, "public");
const targetWorkerPath = path.resolve(targetDir, "maplibre-gl-worker.js");

if (!existsSync(sourceWorkerPath)) {
  console.error(
    `Erro: worker do MapLibre não encontrado em ${sourceWorkerPath}. Execute "npm install" primeiro.`,
  );
  process.exit(1);
}

const workerSource = readFileSync(sourceWorkerPath, "utf8").replace(
  /\r?\n\/\/# sourceMappingURL=maplibre-gl-worker\.mjs\.map\s*$/,
  "\n",
);

mkdirSync(targetDir, { recursive: true });
writeFileSync(targetWorkerPath, workerSource, "utf8");
console.log(`✅ Worker do MapLibre sincronizado em ${path.relative(rootDir, targetWorkerPath)}`);
