import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseAddonsFile } from "../../src/lib/parsers/addons.js";
import { parseUniquesFile } from "../../src/lib/parsers/uniques.js";

const DATA_DIR = resolve(import.meta.dirname, "../../data");

// ---------------------------------------------------------------------------
// ADDONS parser
// ---------------------------------------------------------------------------

describe("parseAddonsFile", () => {
  it("parses the full ADDONS.LAT", () => {
    const content = readFileSync(resolve(DATA_DIR, "ADDONS.LAT"), "utf-8");
    const data = parseAddonsFile(content);

    // Expected counts from Ada source: ~20 tackons, ~25 packons, ~10 tickons, ~130 prefixes, ~185 suffixes
    expect(data.tackons.length).toBeGreaterThan(5);
    expect(data.packons.length).toBeGreaterThan(5);
    expect(data.tickons.length).toBeGreaterThan(3);
    expect(data.prefixes.length).toBeGreaterThan(50);
    expect(data.suffixes.length).toBeGreaterThan(80);
  });

  it("parses tackon entries correctly", () => {
    const content = readFileSync(resolve(DATA_DIR, "ADDONS.LAT"), "utf-8");
    const data = parseAddonsFile(content);

    // "que" should be a tackon
    const que = data.tackons.find((t) => t.word === "que");
    expect(que).toBeDefined();
    if (que) {
      expect(que.base.pofs).toBe("X");
      expect(que.mean).toContain("-que");
    }
  });

  it("parses prefix entries correctly", () => {
    const content = readFileSync(resolve(DATA_DIR, "ADDONS.LAT"), "utf-8");
    const data = parseAddonsFile(content);

    // "ante" should be a prefix
    const ante = data.prefixes.find((p) => p.fix === "ante");
    expect(ante).toBeDefined();
    if (ante) {
      expect(ante.connect).toBe("");
      expect(ante.mean).toContain("before");
    }

    // "ac" should have connect char 'c'
    const ac = data.prefixes.find((p) => p.fix === "ac" && p.connect === "c");
    expect(ac).toBeDefined();
  });

  it("classifies tickons (PREFIX with PACK root)", () => {
    const content = readFileSync(resolve(DATA_DIR, "ADDONS.LAT"), "utf-8");
    const data = parseAddonsFile(content);

    // Tickons should have PACK root
    for (const t of data.tickons) {
      expect(t.entr.root).toBe("PACK");
    }

    // "ec" should be a tickon
    const ec = data.tickons.find((t) => t.fix === "ec");
    expect(ec).toBeDefined();
  });

  it("classifies packons (TACKON with PACK base and PACKON meaning)", () => {
    const content = readFileSync(resolve(DATA_DIR, "ADDONS.LAT"), "utf-8");
    const data = parseAddonsFile(content);

    // All packons should start with "PACKON w/"
    for (const p of data.packons) {
      expect(p.mean).toMatch(/^PACKON w\//);
    }
  });

  it("parses suffix entries correctly", () => {
    const content = readFileSync(resolve(DATA_DIR, "ADDONS.LAT"), "utf-8");
    const data = parseAddonsFile(content);

    // Check first suffix "atic"
    const atic = data.suffixes.find((s) => s.fix === "atic");
    expect(atic).toBeDefined();
    if (atic) {
      expect(atic.entr.root).toBe("N");
      expect(atic.entr.rootKey).toBe(2);
      expect(atic.entr.target.pofs).toBe("ADJ");
    }
  });

  it("parses a minimal addons block", () => {
    const content = ["PREFIX ab", "V V", "- away, off;"].join("\n");
    const data = parseAddonsFile(content);
    expect(data.prefixes).toHaveLength(1);
    expect(data.prefixes[0]?.fix).toBe("ab");
    expect(data.prefixes[0]?.entr.root).toBe("V");
    expect(data.prefixes[0]?.entr.target).toBe("V");
    expect(data.prefixes[0]?.mean).toBe("- away, off;");
  });
});

// ---------------------------------------------------------------------------
// UNIQUES parser
// ---------------------------------------------------------------------------

describe("parseUniquesFile", () => {
  it("parses the full UNIQUES.LAT", () => {
    const content = readFileSync(resolve(DATA_DIR, "UNIQUES.LAT"), "utf-8");
    const entries = parseUniquesFile(content);

    // 228 lines / 3 = 76 entries
    expect(entries.length).toBeGreaterThan(70);
    expect(entries.length).toBeLessThan(80);
  });

  it("correctly parses a verb unique", () => {
    const content = [
      "agantur",
      "V      3 1 PRES PASSIVE SUB 3 P  IMPERS             F  X  X  E  E",
      "let them be treated; let it be a matter or question of;",
    ].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e).toBeDefined();
    if (!e) return;
    expect(e.word).toBe("agantur");
    expect(e.qual.pofs).toBe("V");
    if (e.qual.pofs === "V") {
      expect(e.qual.verb.con).toEqual({ which: 3, var: 1 });
      expect(e.qual.verb.tenseVoiceMood.tense).toBe("PRES");
      expect(e.qual.verb.tenseVoiceMood.voice).toBe("PASSIVE");
      expect(e.qual.verb.tenseVoiceMood.mood).toBe("SUB");
      expect(e.qual.verb.person).toBe(3);
      expect(e.qual.verb.number).toBe("P");
    }
    expect(e.de.part.pofs).toBe("V");
    if (e.de.part.pofs === "V") {
      expect(e.de.part.v.kind).toBe("IMPERS");
    }
    expect(e.de.tran.age).toBe("F");
    expect(e.de.tran.freq).toBe("E");
    expect(e.de.tran.source).toBe("E");
    expect(e.de.mean).toContain("let them be treated");
  });

  it("correctly parses a noun unique", () => {
    const content = [
      "chely",
      "N 9 9 VOC S F T                                     X  X  X  C  S",
      "lyre, harp; tortoise shell (from which lyres were made); tortoise;",
    ].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e).toBeDefined();
    if (!e) return;
    expect(e.word).toBe("chely");
    expect(e.qual.pofs).toBe("N");
    if (e.qual.pofs === "N") {
      expect(e.qual.noun.decl).toEqual({ which: 9, var: 9 });
      expect(e.qual.noun.cs).toBe("VOC");
      expect(e.qual.noun.number).toBe("S");
      expect(e.qual.noun.gender).toBe("F");
    }
    expect(e.de.part.pofs).toBe("N");
    if (e.de.part.pofs === "N") {
      expect(e.de.part.n.kind).toBe("T");
    }
  });

  it("correctly parses a pronoun unique", () => {
    const content = [
      "ec",
      "PRON 3 1 NOM S F ADJECT                             E  X  X  E  W",
      "this; person/thing present/just mentioned/in this place;",
    ].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e).toBeDefined();
    if (!e) return;
    expect(e.qual.pofs).toBe("PRON");
    if (e.qual.pofs === "PRON") {
      expect(e.qual.pron.cs).toBe("NOM");
      expect(e.qual.pron.gender).toBe("F");
    }
    expect(e.de.part.pofs).toBe("PRON");
    if (e.de.part.pofs === "PRON") {
      expect(e.de.part.pron.kind).toBe("ADJECT");
    }
    expect(e.de.tran.age).toBe("E");
    expect(e.de.tran.source).toBe("W");
  });

  it("correctly parses an adjective unique", () => {
    const content = [
      "mare",
      "ADJ 3 1 NOM S N POS                                 X  X  X  F  O",
      "male; masculine, of the male sex;",
    ].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    const e = entries[0];
    expect(e).toBeDefined();
    if (!e) return;
    expect(e.qual.pofs).toBe("ADJ");
    if (e.qual.pofs === "ADJ") {
      expect(e.qual.adj.comparison).toBe("POS");
    }
  });
});
