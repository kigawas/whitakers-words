import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDictFile, parseDictLine } from "../../src/lib/parsers/dictline.js";
import { parseInflectsFile } from "../../src/lib/parsers/inflects.js";

const DATA_DIR = resolve(import.meta.dirname, "../../data");

// ---------------------------------------------------------------------------
// DICTLINE parser
// ---------------------------------------------------------------------------

describe("parseDictLine", () => {
  it("parses a noun entry", () => {
    const line =
      "A                                                                           N      9 8 M N          X X X C G Aulus (Roman praenomen); (abb. A./Au.); [Absolvo, Antiquo => free, reject];";
    const entry = parseDictLine(line);
    expect(entry.stems[0]).toBe("A");
    expect(entry.stems[1]).toBe("");
    expect(entry.stems[2]).toBe("");
    expect(entry.stems[3]).toBe("");
    expect(entry.part.pofs).toBe("N");
    if (entry.part.pofs === "N") {
      expect(entry.part.n.decl).toEqual({ which: 9, var: 8 });
      expect(entry.part.n.gender).toBe("M");
      expect(entry.part.n.kind).toBe("N");
    }
    expect(entry.tran.age).toBe("X");
    expect(entry.tran.area).toBe("X");
    expect(entry.tran.geo).toBe("X");
    expect(entry.tran.freq).toBe("C");
    expect(entry.tran.source).toBe("G");
    expect(entry.mean).toContain("Aulus");
  });

  it("parses a preposition entry", () => {
    const line =
      "a                                                                           PREP   ABL              X X X A O by (agent), from (departure, cause, remote origin/time); after (reference);";
    const entry = parseDictLine(line);
    expect(entry.stems[0]).toBe("a");
    expect(entry.part.pofs).toBe("PREP");
    if (entry.part.pofs === "PREP") {
      expect(entry.part.prep.obj).toBe("ABL");
    }
    expect(entry.tran.freq).toBe("A");
    expect(entry.tran.source).toBe("O");
  });

  it("parses an interjection entry", () => {
    const line =
      "a                                                                           INTERJ                  X X X B O Ah!; (distress/regret/pity, appeal/entreaty, surprise/joy, objection/contempt);";
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("INTERJ");
    expect(entry.mean).toContain("Ah!");
  });

  it("parses an adjective entry", () => {
    const line =
      "abact              abact                                                    ADJ    1 1 POS          X X X E S driven away/off/back; forced to resign (office); restrained by; passed (night);";
    const entry = parseDictLine(line);
    expect(entry.stems[0]).toBe("abact");
    expect(entry.stems[1]).toBe("abact");
    expect(entry.part.pofs).toBe("ADJ");
    if (entry.part.pofs === "ADJ") {
      expect(entry.part.adj.decl).toEqual({ which: 1, var: 1 });
      expect(entry.part.adj.co).toBe("POS");
    }
  });

  it("parses a verb entry", () => {
    // Find a verb line from the file
    const content = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
    const verbLine = content.split("\n").find((l) => l.includes("V      "));
    expect(verbLine).toBeDefined();
    if (verbLine) {
      const entry = parseDictLine(verbLine);
      expect(entry.part.pofs).toBe("V");
    }
  });
});

describe("parseDictFile", () => {
  it("parses the full DICTLINE.GEN", () => {
    const content = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
    const entries = parseDictFile(content);
    // Expect close to 39,338 entries
    expect(entries.length).toBeGreaterThan(39000);
    expect(entries.length).toBeLessThan(40000);

    // Spot check first and last
    expect(entries[0]?.stems[0]).toBe("A");
    expect(entries[0]?.part.pofs).toBe("N");

    // Check we got a good distribution of POS types
    const posCounts = new Map<string, number>();
    for (const e of entries) {
      posCounts.set(e.part.pofs, (posCounts.get(e.part.pofs) ?? 0) + 1);
    }
    expect(posCounts.get("N")).toBeGreaterThan(10000);
    expect(posCounts.get("V")).toBeGreaterThan(5000);
    expect(posCounts.get("ADJ")).toBeGreaterThan(3000);
    expect(posCounts.get("PREP")).toBeGreaterThan(50);
  });
});

// ---------------------------------------------------------------------------
// INFLECTS parser
// ---------------------------------------------------------------------------

describe("parseInflectsFile", () => {
  it("parses the full INFLECTS.LAT", () => {
    const content = readFileSync(resolve(DATA_DIR, "INFLECTS.LAT"), "utf-8");
    const records = parseInflectsFile(content);
    // Expect close to 1800 inflection records
    expect(records.length).toBeGreaterThan(1700);
    expect(records.length).toBeLessThan(2000);
  });

  it("correctly parses a noun inflection", () => {
    const records = parseInflectsFile("N     1 1 NOM S C  1 1 a         X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("N");
    if (r.qual.pofs === "N") {
      expect(r.qual.noun.decl).toEqual({ which: 1, var: 1 });
      expect(r.qual.noun.cs).toBe("NOM");
      expect(r.qual.noun.number).toBe("S");
      expect(r.qual.noun.gender).toBe("C");
    }
    expect(r.key).toBe(1);
    expect(r.ending.size).toBe(1);
    expect(r.ending.suf).toBe("a");
    expect(r.age).toBe("X");
    expect(r.freq).toBe("A");
  });

  it("correctly parses a verb inflection", () => {
    const records = parseInflectsFile("V     1 1 PRES  ACTIVE  IND  1 S  1 1 o             X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("V");
    if (r.qual.pofs === "V") {
      expect(r.qual.verb.con).toEqual({ which: 1, var: 1 });
      expect(r.qual.verb.tenseVoiceMood.tense).toBe("PRES");
      expect(r.qual.verb.tenseVoiceMood.voice).toBe("ACTIVE");
      expect(r.qual.verb.tenseVoiceMood.mood).toBe("IND");
      expect(r.qual.verb.person).toBe(1);
      expect(r.qual.verb.number).toBe("S");
    }
    expect(r.key).toBe(1);
    expect(r.ending.size).toBe(1);
    expect(r.ending.suf).toBe("o");
  });

  it("correctly parses an adverb inflection", () => {
    const records = parseInflectsFile("ADV    POS 1 0       X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("ADV");
    if (r.qual.pofs === "ADV") {
      expect(r.qual.adv.comparison).toBe("POS");
    }
    expect(r.ending.size).toBe(0);
  });

  it("correctly parses a VPAR inflection", () => {
    const records = parseInflectsFile("VPAR 1 0 NOM S X PRES ACTIVE  PPL 1 3 ans          X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("VPAR");
    if (r.qual.pofs === "VPAR") {
      expect(r.qual.vpar.cs).toBe("NOM");
      expect(r.qual.vpar.tenseVoiceMood.tense).toBe("PRES");
      expect(r.qual.vpar.tenseVoiceMood.mood).toBe("PPL");
    }
    expect(r.ending.suf).toBe("ans");
  });

  it("correctly parses an adjective inflection", () => {
    const records = parseInflectsFile("ADJ   1 1 NOM S M POS   1 2 us    X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("ADJ");
    if (r.qual.pofs === "ADJ") {
      expect(r.qual.adj.decl).toEqual({ which: 1, var: 1 });
      expect(r.qual.adj.cs).toBe("NOM");
      expect(r.qual.adj.comparison).toBe("POS");
    }
    expect(r.ending.suf).toBe("us");
  });

  it("skips comments and blank lines", () => {
    const records = parseInflectsFile(
      "-- This is a comment\n\nN     1 1 NOM S C  1 1 a         X A\n",
    );
    expect(records).toHaveLength(1);
  });

  it("correctly parses a PREP inflection", () => {
    const records = parseInflectsFile("PREP   ABL 1 0       X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("PREP");
    if (r.qual.pofs === "PREP") {
      expect(r.qual.prep.cs).toBe("ABL");
    }
  });

  it("correctly parses a NUM inflection", () => {
    const records = parseInflectsFile("NUM    1 1 NOM S M CARD     1 2 us                  X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("NUM");
    if (r.qual.pofs === "NUM") {
      expect(r.qual.num.sort).toBe("CARD");
    }
    expect(r.ending.suf).toBe("us");
  });
});
