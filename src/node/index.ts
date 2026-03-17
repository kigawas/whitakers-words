import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { WordsEngine } from "../lib/engine/engine.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// dist/node/index.js → ../../data/
const dataDir = resolve(__dirname, "../../data");

function readData(name: string): string {
  return readFileSync(resolve(dataDir, name), "utf-8");
}

/** Create a WordsEngine with bundled data files. Node/Bun/Deno only. */
export function createEngine(): WordsEngine {
  const dictGen = readData("DICTLINE.GEN");
  const dictSup = readData("DICTLINE.SUP");
  return WordsEngine.create({
    dictline: `${dictGen}\n${dictSup}`,
    inflects: readData("INFLECTS.LAT"),
    addons: readData("ADDONS.LAT"),
    uniques: readData("UNIQUES.LAT"),
  });
}

export * from "../lib/index.js";
