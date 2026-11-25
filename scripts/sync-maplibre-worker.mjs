import { copyFileSync, existsSync, mkdirSync } from "node:fs";
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

mkdirSync(targetDir, { recursive: true });
copyFileSync(sourceWorkerPath, targetWorkerPath);
console.log(`✅ Worker do MapLibre sincronizado em ${path.relative(rootDir, targetWorkerPath)}`);
