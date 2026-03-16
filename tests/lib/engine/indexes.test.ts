import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDictionaryIndex, lookupStems } from "../../../src/lib/engine/dictionary-index.js";
import {
  buildInflectionIndex,
  lookupInflections,
} from "../../../src/lib/engine/inflection-index.js";
import { parseDictFile } from "../../../src/lib/parsers/dictline.js";
import { parseInflectsFile } from "../../../src/lib/parsers/inflects.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";
import type { InflectionRecord } from "../../../src/lib/types/inflections.js";

const DATA_DIR = resolve(import.meta.dirname, "../../../data");

// ---------------------------------------------------------------------------
// Inflection index
// ---------------------------------------------------------------------------

describe("inflection index", () => {
  it("builds from INFLECTS.LAT and finds entries by ending", () => {
    const content = readFileSync(resolve(DATA_DIR, "INFLECTS.LAT"), "utf-8");
    const records = parseInflectsFile(content);
    const index = buildInflectionIndex(records);

    // Blank endings should exist (for words that are stems)
    expect(index.blank.length).toBeGreaterThan(0);

    // "a" endings (size 1, last char 'a') should have noun inflections
    const aEndings = lookupInflections(index, 1, "a");
    expect(aEndings.length).toBeGreaterThan(0);
    // N 1 1 NOM S should be among them
    const nomSingA = aEndings.find(
      (r) => r.qual.pofs === "N" && r.qual.noun.cs === "NOM" && r.qual.noun.number === "S",
    );
    expect(nomSingA).toBeDefined();

    // "us" endings (size 2, last char 's')
    const usEndings = lookupInflections(index, 2, "s");
    expect(usEndings.length).toBeGreaterThan(0);

    // "o" endings (size 1, last char 'o') — should have verb inflections
    const oEndings = lookupInflections(index, 1, "o");
    const verbO = oEndings.find((r) => r.qual.pofs === "V");
    expect(verbO).toBeDefined();
  });

  it("returns empty for non-existent ending keys", () => {
    const records = parseInflectsFile("N     1 1 NOM S C  1 1 a         X A\n");
    const index = buildInflectionIndex(records);

    // No endings of size 5 with last char 'z'
    expect(lookupInflections(index, 5, "z")).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Dictionary index
// ---------------------------------------------------------------------------

describe("dictionary index", () => {
  it("builds from DICTLINE.GEN and finds stems", () => {
    const content = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
    const entries = parseDictFile(content);
    const index = buildDictionaryIndex(entries);

    // Look up "aqu" — should find "aqua" (water)
    const aquStems = lookupStems(index, "aqu");
    expect(aquStems.length).toBeGreaterThan(0);
    const aquEntry = entries[aquStems[0]?.entryIndex ?? -1];
    expect(aquEntry?.mean).toContain("water");

    // Look up "am" — should find entries
    const amStems = lookupStems(index, "am");
    expect(amStems.length).toBeGreaterThan(0);
  });

  it("handles u/v equivalence", () => {
    const content = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
    const entries = parseDictFile(content);
    const index = buildDictionaryIndex(entries);

    // "vir" and "uir" should find the same entries
    const virStems = lookupStems(index, "vir");
    const uirStems = lookupStems(index, "uir");
    expect(virStems.length).toBe(uirStems.length);
    expect(virStems.length).toBeGreaterThan(0);
  });

  it("returns empty for non-existent stems", () => {
    const content = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
    const entries = parseDictFile(content);
    const index = buildDictionaryIndex(entries);

    expect(lookupStems(index, "zzzzz")).toHaveLength(0);
    expect(lookupStems(index, "")).toHaveLength(0);
  });

  it("finds multiple stem keys for the same entry", () => {
    const content = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
    const entries = parseDictFile(content);
    const index = buildDictionaryIndex(entries);

    // Verbs typically have 4 stems — look for a common verb like "amo"
    // amo, amare, amavi, amatus
    const amStems = lookupStems(index, "am");
    // Should find at least stem 1 (am-)
    expect(amStems.length).toBeGreaterThan(0);

    // "amav" should find perfect stem entries
    const amavStems = lookupStems(index, "amav");
    expect(amavStems.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// dictionary-index: branch coverage (from branch-coverage)
// ---------------------------------------------------------------------------
describe("dictionary-index: branch coverage", () => {
  it("lookupStems returns empty for nonexistent stem", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["aqua", "aqu", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "water",
      },
    ];
    const index = buildDictionaryIndex(entries);
    expect(lookupStems(index, "zzzzz")).toHaveLength(0);
  });

  it("lookupStems returns empty for empty stem", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["aqua", "aqu", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "water",
      },
    ];
    const index = buildDictionaryIndex(entries);
    expect(lookupStems(index, "")).toHaveLength(0);
  });

  it("lookupStems finds multiple entries with same stem", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["aqu", "aqu", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "water",
      },
      {
        stems: ["aqu", "aqu", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "water 2",
      },
    ];
    const index = buildDictionaryIndex(entries);
    const results = lookupStems(index, "aqu");
    expect(results.length).toBeGreaterThanOrEqual(2);
  });

  it("handles stems with v/j normalization", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["vir", "vir", "", ""],
        part: { pofs: "N", n: { decl: { which: 2, var: 3 }, gender: "M", kind: "P" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "man",
      },
    ];
    const index = buildDictionaryIndex(entries);
    const results = lookupStems(index, "uir");
    expect(results.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// dictionary-index: scanning and binary search (from branch-coverage)
// ---------------------------------------------------------------------------
describe("dictionary-index: scanning and binary search", () => {
  it("scans backwards and forwards for multiple matching stems", () => {
    const entries: DictionaryEntry[] = [];
    for (let i = 0; i < 5; i++) {
      entries.push({
        stems: ["aqua", "aqu", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
        mean: `water ${i}`,
      });
    }
    const index = buildDictionaryIndex(entries);
    const results = lookupStems(index, "aqu");
    expect(results.length).toBeGreaterThanOrEqual(5);
  });

  it("handles single-char stem lookup", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["s", "", "fu", "fut"],
        part: { pofs: "V", v: { con: { which: 5, var: 1 }, kind: "TO_BE" } },
        tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
        mean: "be",
      },
    ];
    const index = buildDictionaryIndex(entries);
    const results = lookupStems(index, "s");
    expect(results.length).toBeGreaterThan(0);
  });

  it("binary search with many different stems finds correct one", () => {
    const entries: DictionaryEntry[] = [];
    const letters = "abcdefghijklmnopqrst";
    for (const c of letters) {
      entries.push({
        stems: [`${c}qu`, `${c}qu`, "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
        mean: `word ${c}`,
      });
    }
    const index = buildDictionaryIndex(entries);
    const results = lookupStems(index, "mqu");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]?.stem).toBe("mqu");
  });
});

// ---------------------------------------------------------------------------
// inflection-index: branch coverage (from branch-coverage)
// ---------------------------------------------------------------------------
describe("inflection-index: branch coverage", () => {
  it("lookupInflections with size=0 returns blank inflections", () => {
    const rec: InflectionRecord = {
      qual: { pofs: "CONJ" },
      key: 0,
      ending: { size: 0, suf: "" },
      age: "X",
      freq: "A",
    };
    const index = buildInflectionIndex([rec]);
    const results = lookupInflections(index, 0, "");
    expect(results).toHaveLength(1);
    expect(results[0]).toBe(rec);
  });

  it("lookupInflections with unknown key returns empty", () => {
    const index = buildInflectionIndex([]);
    const results = lookupInflections(index, 3, "z");
    expect(results).toHaveLength(0);
  });
});
