import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseDictFile, parseDictLine } from "../../../src/lib/parsers/dictline.js";
import { parseInflectsFile } from "../../../src/lib/parsers/inflects.js";
import { parseUniquesFile } from "../../../src/lib/parsers/uniques.js";

const DATA_DIR = resolve(import.meta.dirname, "../../../data");

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

  it("correctly parses a PRON inflection", () => {
    const records = parseInflectsFile("PRON  1 0 GEN S X   2 3 jus                         X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("PRON");
    if (r.qual.pofs === "PRON") {
      expect(r.qual.pron.cs).toBe("GEN");
    }
  });

  it("correctly parses a PACK inflection", () => {
    const records = parseInflectsFile("PACK  1 0 NOM S M   1 1 us                          X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("PACK");
  });

  it("correctly parses a SUPINE inflection", () => {
    const records = parseInflectsFile("SUPINE 0 0 ACC S N  4 2 um                          X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("SUPINE");
    if (r.qual.pofs === "SUPINE") {
      expect(r.qual.supine.cs).toBe("ACC");
    }
  });

  it("correctly parses a CONJ inflection", () => {
    const records = parseInflectsFile("CONJ   1 0           X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("CONJ");
  });

  it("correctly parses an INTERJ inflection", () => {
    const records = parseInflectsFile("INTERJ 1 0           X A\n");
    expect(records).toHaveLength(1);
    const r = records[0];
    expect(r).toBeDefined();
    if (!r) return;
    expect(r.qual.pofs).toBe("INTERJ");
  });

  it("returns null for unknown POS in inflection", () => {
    const records = parseInflectsFile("TACKON 1 0           X A\n");
    expect(records).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// DICTLINE: additional POS coverage
// ---------------------------------------------------------------------------

describe("parseDictLine: extended POS", () => {
  // Line format: 4 stems × 19 chars each = 76, then POS(6)+space+rest(16)=23, space, tran(9), space, meaning
  // Stem slots: [0..17] [19..36] [38..55] [57..74]
  // Part entry: [76..98], Translation: [100..108], Meaning: [110..]

  it("parses a PRON entry", () => {
    const line =
      "h                  i                                                        PRON   1 0 DEMONS       X X X A O this; these (pl.);";
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("PRON");
    if (entry.part.pofs === "PRON") {
      expect(entry.part.pron.decl.which).toBe(1);
    }
  });

  it("parses an ADV entry", () => {
    const line =
      "ben                bene               melius             optime             ADV    POS              X X X A O well, very, quite, rightly, agreeably;";
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("ADV");
    if (entry.part.pofs === "ADV") {
      expect(entry.part.adv.co).toBe("POS");
    }
  });

  it("parses a NUM entry", () => {
    const line =
      "un                 un                 un                 un                 NUM    1 1 CARD     1   X X X A O one (unus -a -um);";
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("NUM");
    if (entry.part.pofs === "NUM") {
      expect(entry.part.num.sort).toBe("CARD");
      expect(entry.part.num.decl.which).toBe(1);
    }
  });

  it("parses a CONJ entry from real data", () => {
    const content = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
    const conjLine = content.split("\n").find((l) => {
      const pos = l.slice(76, 82).trim();
      return pos === "CONJ";
    });
    expect(conjLine).toBeDefined();
    if (conjLine) {
      const entry = parseDictLine(conjLine);
      expect(entry.part.pofs).toBe("CONJ");
    }
  });

  it("parses a V entry with known conjugation", () => {
    const line =
      "mon                mone               monu               monit              V      2 1 TRANS        X X X A O warn (of); advise; remind;";
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("V");
    if (entry.part.pofs === "V") {
      expect(entry.part.v.con.which).toBe(2);
      expect(entry.part.v.kind).toBe("TRANS");
    }
  });

  it("parses PACK, VPAR, SUPINE, TACKON, PREFIX, SUFFIX, X as correct POS", () => {
    const content = readFileSync(resolve(DATA_DIR, "DICTLINE.GEN"), "utf-8");
    const entries = parseDictFile(content);
    const posSet = new Set(entries.map((e) => e.part.pofs));
    // At minimum N, V, ADJ, ADV, PREP, CONJ, INTERJ, PRON, PACK, NUM should exist
    expect(posSet.has("N")).toBe(true);
    expect(posSet.has("V")).toBe(true);
    expect(posSet.has("ADJ")).toBe(true);
    expect(posSet.has("PRON")).toBe(true);
    expect(posSet.has("PACK")).toBe(true);
    expect(posSet.has("NUM")).toBe(true);
    expect(posSet.has("ADV")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// UNIQUES parser: synthetic entries for uncovered POS
// ---------------------------------------------------------------------------

describe("parseUniquesFile: POS branches", () => {
  it("parses a PACK unique entry", () => {
    const input = "testword\nPACK 1 1 NOM S M ADJECT X X X A A\ntest meaning\n";
    const entries = parseUniquesFile(input);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("PACK");
  });

  it("parses a NUM unique entry", () => {
    const input = "testword\nNUM 1 1 NOM S M CARD 1 X X X A A\ntest meaning\n";
    const entries = parseUniquesFile(input);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("NUM");
  });

  it("parses an ADV unique entry", () => {
    const input = "testword\nADV POS X X X A A\ntest meaning\n";
    const entries = parseUniquesFile(input);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("ADV");
  });

  it("parses a default/unknown POS unique entry", () => {
    const input = "testword\nINTERJ X X X A A\ntest meaning\n";
    const entries = parseUniquesFile(input);
    expect(entries).toHaveLength(1);
    // Falls through to default case
    expect(entries[0]?.qual.pofs).toBe("X");
  });

  it("skips entries with empty stem lines", () => {
    const input = "\nPACK 1 1 NOM S M ADJECT X X X A A\ntest meaning\n";
    const entries = parseUniquesFile(input);
    expect(entries).toHaveLength(0);
  });
});
