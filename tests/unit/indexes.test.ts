import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { buildDictionaryIndex, lookupStems } from "../../src/lib/engine/dictionary-index.js";
import { buildInflectionIndex, lookupInflections } from "../../src/lib/engine/inflection-index.js";
import { parseDictFile } from "../../src/lib/parsers/dictline.js";
import { parseInflectsFile } from "../../src/lib/parsers/inflects.js";

const DATA_DIR = resolve(import.meta.dirname, "../../data");

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
