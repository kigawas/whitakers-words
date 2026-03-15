import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDictionaryIndex } from "../../src/lib/engine/dictionary-index.js";
import { buildInflectionIndex } from "../../src/lib/engine/inflection-index.js";
import { analyzeWord } from "../../src/lib/engine/word-analysis.js";
import { parseDictFile } from "../../src/lib/parsers/dictline.js";
import { parseInflectsFile } from "../../src/lib/parsers/inflects.js";

const DATA_DIR = resolve(import.meta.dirname, "../../data");

// Load and index data once for all tests
const dictContent = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
const inflContent = readFileSync(resolve(DATA_DIR, "INFLECTS.LAT"), "utf-8");
const entries = parseDictFile(dictContent);
const records = parseInflectsFile(inflContent);
const dictIndex = buildDictionaryIndex(entries);
const inflIndex = buildInflectionIndex(records);

describe("analyzeWord", () => {
  it("analyzes 'aquam' — N 1 1 ACC S F (water)", () => {
    const results = analyzeWord("aquam", inflIndex, dictIndex);
    expect(results.length).toBeGreaterThan(0);

    // Should find a noun accusative singular
    const nounResult = results.find(
      (r) => r.ir.qual.pofs === "N" && r.ir.qual.noun.cs === "ACC" && r.ir.qual.noun.number === "S",
    );
    expect(nounResult).toBeDefined();
    if (nounResult) {
      expect(nounResult.de.mean).toContain("water");
    }
  });

  it("analyzes 'amo' — V 1 1 PRES ACTIVE IND 1 S (I love)", () => {
    const results = analyzeWord("amo", inflIndex, dictIndex);
    expect(results.length).toBeGreaterThan(0);

    // Should find a verb present active indicative 1st person singular
    const verbResult = results.find(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.ir.qual.verb.tenseVoiceMood.tense === "PRES" &&
        r.ir.qual.verb.tenseVoiceMood.voice === "ACTIVE" &&
        r.ir.qual.verb.tenseVoiceMood.mood === "IND" &&
        r.ir.qual.verb.person === 1 &&
        r.ir.qual.verb.number === "S",
    );
    expect(verbResult).toBeDefined();
    if (verbResult) {
      expect(verbResult.de.mean).toContain("love");
    }
  });

  it("analyzes 'bonus' — ADJ 1 1 NOM S M POS (good)", () => {
    const results = analyzeWord("bonus", inflIndex, dictIndex);
    expect(results.length).toBeGreaterThan(0);

    const adjResult = results.find(
      (r) =>
        r.ir.qual.pofs === "ADJ" &&
        r.ir.qual.adj.cs === "NOM" &&
        r.ir.qual.adj.number === "S" &&
        r.ir.qual.adj.gender === "M",
    );
    expect(adjResult).toBeDefined();
    if (adjResult) {
      expect(adjResult.de.mean).toContain("good");
    }
  });

  it("analyzes 'rex' — N 3 2 NOM S M (king)", () => {
    const results = analyzeWord("rex", inflIndex, dictIndex);
    expect(results.length).toBeGreaterThan(0);

    const nounResult = results.find(
      (r) => r.ir.qual.pofs === "N" && r.ir.qual.noun.cs === "NOM" && r.ir.qual.noun.number === "S",
    );
    expect(nounResult).toBeDefined();
    if (nounResult) {
      expect(nounResult.de.mean).toContain("king");
    }
  });

  it("analyzes 'in' — PREP (in/into)", () => {
    const results = analyzeWord("in", inflIndex, dictIndex);
    expect(results.length).toBeGreaterThan(0);

    const prepResult = results.find((r) => r.ir.qual.pofs === "PREP");
    expect(prepResult).toBeDefined();
  });

  it("analyzes 'et' — CONJ (and)", () => {
    const results = analyzeWord("et", inflIndex, dictIndex);
    expect(results.length).toBeGreaterThan(0);

    const conjResult = results.find((r) => r.ir.qual.pofs === "CONJ");
    expect(conjResult).toBeDefined();
    if (conjResult) {
      expect(conjResult.de.mean).toContain("and");
    }
  });

  it("returns empty for non-Latin words", () => {
    const results = analyzeWord("xyzzy", inflIndex, dictIndex);
    expect(results).toHaveLength(0);
  });

  it("handles u/v equivalence in words", () => {
    // "uir" should find the same as "vir" (man)
    const virResults = analyzeWord("vir", inflIndex, dictIndex);
    const uirResults = analyzeWord("uir", inflIndex, dictIndex);

    // Both should find results
    expect(virResults.length).toBeGreaterThan(0);
    // uir should also work due to u/v equivalence
    expect(uirResults.length).toBeGreaterThan(0);
  });
});
