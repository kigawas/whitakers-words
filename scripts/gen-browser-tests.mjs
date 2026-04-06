import fs from "node:fs";
import path from "node:path";

const handleFile = (srcPath, dstPath, ...pipelines) => {
  let data = fs.readFileSync(srcPath, "utf8");
  for (const f of pipelines) {
    data = f(data);
  }
  const dstDir = path.dirname(dstPath);
  fs.mkdirSync(dstDir, { recursive: true });
  fs.writeFileSync(dstPath, data);
};

const preamble = `\
// AUTO-GENERATED from Node integration tests — do not edit directly.
// Run: node scripts/gen-browser-tests.mjs

import { beforeAll, describe, expect, it } from "vitest";
import { WordsEngine, formatWordAnalysis, groupAndMerge, dictionaryForm } from "whitakers-words";

let engine: InstanceType<typeof WordsEngine>;

beforeAll(async () => {
  const load = (p: string) => fetch(p).then((r) => r.text());
  const [dictGen, dictSup, inflects, addons, uniques] = await Promise.all([
    load("/data/DICTLINE.GEN"),
    load("/data/DICTLINE.SUP"),
    load("/data/INFLECTS.LAT"),
    load("/data/ADDONS.LAT"),
    load("/data/UNIQUES.LAT"),
  ]);
  const dictline = dictGen + "\\n" + dictSup;
  engine = WordsEngine.create({ dictline, inflects, addons, uniques });
});

`;

const pipelines = [
  // Strip all import lines (we inject our own)
  (data) => data.replace(/^import .*;\n/gm, ""),
  // Remove `const engine = createEngine();` lines
  (data) => data.replace(/^\s*const engine = createEngine\(\);\n/gm, ""),
  // Prepend browser-compatible preamble
  (data) => preamble + data.trimStart(),
];

const sources = [
  ["./tests/integration/smoke.test.ts", "./tests-browser/integration/smoke.test.ts"],
  ["./tests/integration/dictline-sup.test.ts", "./tests-browser/integration/dictline-sup.test.ts"],
  ["./tests/integration/bdl-cleanup.test.ts", "./tests-browser/integration/bdl-cleanup.test.ts"],
];

for (const [src, dst] of sources) {
  handleFile(src, dst, ...pipelines);
}
