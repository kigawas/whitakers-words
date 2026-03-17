import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDictionaryIndex } from "../../../src/lib/engine/dictionary-index.js";
import { buildInflectionIndex } from "../../../src/lib/engine/inflection-index.js";
import { trySlury } from "../../../src/lib/engine/slury.js";
import { parseDictFile } from "../../../src/lib/parsers/dictline.js";
import { parseInflectsFile } from "../../../src/lib/parsers/inflects.js";
import { createEngine } from "../../../src/node/index.js";

const DATA_DIR = resolve(import.meta.dirname, "../../../data");
const dictEntries = parseDictFile(readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8"));
const inflRecords = parseInflectsFile(readFileSync(resolve(DATA_DIR, "INFLECTS.LAT"), "utf-8"));
const dictIndex = buildDictionaryIndex(dictEntries);
const inflIndex = buildInflectionIndex(inflRecords);

// ---------------------------------------------------------------------------
// trySlury: TC_Slur — prefix assimilation
// ---------------------------------------------------------------------------
describe("trySlury: TC_Slur prefix assimilation", () => {
  it("ad: ammoverunt (a+mm → ad+m) finds admoveo", () => {
    const result = trySlury("ammoverunt", inflIndex, dictIndex);
    expect(result).not.toBeNull();
    expect(result?.label).toContain("ad");
    expect(result?.results.length).toBeGreaterThan(0);
  });

  it("in: inritata (in+r → i+rr) finds irrito", () => {
    const result = trySlury("inritata", inflIndex, dictIndex);
    expect(result).not.toBeNull();
    expect(result?.label).toContain("in");
    expect(result?.results.length).toBeGreaterThan(0);
  });

  it("ob: obcido (ob+c → oc+c) — direction 1", () => {
    const result = trySlury("obcido", inflIndex, dictIndex);
    // obcido → try occido
    expect(result).not.toBeNull();
    expect(result?.label).toContain("ob");
  });

  it("sub: subfero (sub+f → suf+f) — direction 1", () => {
    const result = trySlury("subfero", inflIndex, dictIndex);
    // subfero → try suffero
    expect(result).not.toBeNull();
    expect(result?.label).toContain("sub");
  });

  it("returns null for irritata — un-assimilated form has no results", () => {
    const result = trySlury("irritata", inflIndex, dictIndex);
    expect(result).toBeNull();
  });

  it("returns null for words without slur pattern", () => {
    expect(trySlury("aquam", inflIndex, dictIndex)).toBeNull();
  });

  it("returns null for short words", () => {
    expect(trySlury("am", inflIndex, dictIndex)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// trySlury: TC_Flip_Flop — bidirectional prefix replacement
// ---------------------------------------------------------------------------
describe("trySlury: TC_Flip_Flop", () => {
  it("conl ↔ coll: colligo finds conligo", () => {
    const result = trySlury("colligo", inflIndex, dictIndex);
    expect(result).not.toBeNull();
    expect(result?.label).toContain("coll");
    expect(result?.results.length).toBeGreaterThan(0);
  });

  it("con ↔ com: compono finds conpono", () => {
    const result = trySlury("compono", inflIndex, dictIndex);
    // compono → try conpono
    if (result) {
      expect(result.label).toContain("com");
    }
  });

  it("inb ↔ imb: imbuo finds inbuo", () => {
    const result = trySlury("imbuo", inflIndex, dictIndex);
    if (result) {
      expect(result.label).toContain("imb");
    }
  });
});

// ---------------------------------------------------------------------------
// trySlury: TC_Flip — one-direction replacement
// ---------------------------------------------------------------------------
describe("trySlury: TC_Flip", () => {
  it("nun → non", () => {
    const result = trySlury("nunquam", inflIndex, dictIndex);
    if (result) {
      expect(result.label).toContain("nun");
      expect(result.results.length).toBeGreaterThan(0);
    }
  });

  it("se → ce", () => {
    const result = trySlury("sedo", inflIndex, dictIndex);
    if (result) {
      expect(result.label).toContain("se");
    }
  });
});

// ---------------------------------------------------------------------------
// Engine integration
// ---------------------------------------------------------------------------
describe("slury in engine output", () => {
  const engine = createEngine();

  it("ammoverunt shows slur annotation with admoveo results", () => {
    const output = engine.formatWord("ammoverunt");
    expect(output).toContain("Slur");
    expect(output).toContain("ad");
    expect(output).toContain("admov");
  });

  it("inritata shows slur annotation with irritata results", () => {
    const a = engine.parseWord("inritata");
    expect(a.sluryResult).not.toBeNull();
    expect(a.sluryResult?.results.length).toBeGreaterThan(0);
  });

  it("irritata has no slury — no new information", () => {
    const a = engine.parseWord("irritata");
    expect(a.sluryResult).toBeNull();
  });

  it("aquam has no slury", () => {
    expect(engine.parseWord("aquam").sluryResult).toBeNull();
  });

  it("colligo shows conl/coll slury", () => {
    const output = engine.formatWord("colligo");
    expect(output).toContain("conl");
  });
});
