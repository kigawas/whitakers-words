/**
 * Tests for DICTLINE.GEN entries modified with "zzz" in unused stem slots.
 *
 * Background: entries with 1-char stem1 (length ≤ 1) are BDL (blank dictionary
 * line) candidates. Their blank stem2/3/4 slots were being added to the BDL
 * index, causing false positive matches (e.g., "a" matching ADJ "imus" via
 * blank stem2). Filling unused slots with "zzz" prevents this at the data level.
 *
 * This file tests every word affected by the change to ensure no regressions.
 */
import { describe, expect, it } from "vitest";
import { createEngine } from "../../src/node";

const engine = createEngine();

function findResult(word: string, pofs: string, meanFragment: string) {
  const a = engine.parseWord(word);
  return a.results.find((r) => r.ir.qual.pofs === pofs && r.de.mean.includes(meanFragment));
}

function allResults(word: string) {
  return engine.parseWord(word);
}

// ---------------------------------------------------------------------------
// No BDL false positives: ADJ "imus" should never match single-char words
// ---------------------------------------------------------------------------

describe("BDL: no false ADJ imus for single-char words", () => {
  const alphabet = "abcdefghiklmnopqrstuvx";
  for (const ch of alphabet) {
    it(`'${ch}' does not match ADJ imus`, () => {
      const a = allResults(ch);
      const imus = a.results.filter((r) => r.de.mean.includes("inmost"));
      expect(imus.length).toBe(0);
    });
  }
});

// ---------------------------------------------------------------------------
// ADJ imus (i ADJ 0 0 SUPER — stem1="i", stem4="i", stem2/3="zzz")
// ---------------------------------------------------------------------------

describe("BDL: ADJ imus still works via stem4", () => {
  it("imus: NOM S M SUPER", () => {
    const r = findResult("imus", "ADJ", "inmost");
    expect(r).toBeDefined();
    expect(r!.ir.qual.adj.comparison).toBe("SUPER");
    expect(r!.ir.qual.adj.cs).toBe("NOM");
    expect(r!.ir.qual.adj.gender).toBe("M");
  });

  it("ima: NOM/VOC/ABL S F + NOM/VOC/ACC P N SUPER", () => {
    const a = allResults("ima");
    const adjs = a.results.filter((r) => r.ir.qual.pofs === "ADJ" && r.de.mean.includes("inmost"));
    expect(adjs.length).toBeGreaterThanOrEqual(3);
  });

  it("imum: ACC S M/N SUPER", () => {
    const r = findResult("imum", "ADJ", "inmost");
    expect(r).toBeDefined();
  });

  it("imo: DAT/ABL S SUPER", () => {
    const r = findResult("imo", "ADJ", "inmost");
    expect(r).toBeDefined();
  });

  it("imi: GEN S / NOM P SUPER", () => {
    const a = allResults("imi");
    const adjs = a.results.filter((r) => r.ir.qual.pofs === "ADJ" && r.de.mean.includes("inmost"));
    expect(adjs.length).toBeGreaterThan(0);
    expect(adjs.some((r) => r.ir.qual.adj.cs === "GEN")).toBe(true);
  });

  it("imae: GEN/DAT S F + NOM/VOC P F SUPER", () => {
    const r = findResult("imae", "ADJ", "inmost");
    expect(r).toBeDefined();
  });

  it("dict form: 'imus, ima, imum'", () => {
    const output = engine.formatWord("imus");
    expect(output).toContain("imus, ima, imum");
  });
});

// ---------------------------------------------------------------------------
// Prepositions (a, e — stem1 only, stem2/3/4 = zzz)
// ---------------------------------------------------------------------------

describe("BDL: prepositions", () => {
  it("a: PREP ABL (by, from)", () => {
    const r = findResult("a", "PREP", "by (agent)");
    expect(r).toBeDefined();
    expect(r!.ir.qual.prep.cs).toBe("ABL");
  });

  it("a: PREP ACC (ante abbreviation)", () => {
    const r = findResult("a", "PREP", "ante");
    expect(r).toBeDefined();
    expect(r!.ir.qual.prep.cs).toBe("ACC");
  });

  it("e: PREP ABL (out of, from)", () => {
    const r = findResult("e", "PREP", "out of");
    expect(r).toBeDefined();
    expect(r!.ir.qual.prep.cs).toBe("ABL");
  });
});

// ---------------------------------------------------------------------------
// Interjections (a, o — stem1 only)
// ---------------------------------------------------------------------------

describe("BDL: interjections", () => {
  it("a: INTERJ (Ah!)", () => {
    const r = findResult("a", "INTERJ", "Ah!");
    expect(r).toBeDefined();
  });

  it("o: INTERJ (Oh!)", () => {
    const r = findResult("o", "INTERJ", "Oh!");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Abbreviation nouns (N 9 8 — stem1 = single letter, stem2/3/4 = zzz)
// ---------------------------------------------------------------------------

describe("BDL: abbreviation nouns (N 9 8)", () => {
  it("a: year abbreviation", () => {
    const r = findResult("a", "N", "year");
    expect(r).toBeDefined();
  });

  it("d: diem abbreviation", () => {
    const r = findResult("d", "N", "diem");
    expect(r).toBeDefined();
  });

  it("f: filius/filia abbreviation", () => {
    const r = findResult("f", "N", "son/daughter");
    expect(r).toBeDefined();
  });

  it("p: people/nation abbreviation", () => {
    const r = findResult("p", "N", "people");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Praenomina (single-letter proper names, N 9 8)
// ---------------------------------------------------------------------------

describe("BDL: Roman praenomina", () => {
  const praenomina: [string, string][] = [
    ["a", "Aulus"],
    ["c", "Gaius"],
    ["d", "Decimus"],
    ["k", "Kaeso"],
    ["l", "Lucius"],
    ["m", "Marcus"],
    ["n", "Numerius"],
    ["p", "Publius"],
    ["q", "Quintus"],
    ["t", "Titus"],
  ];

  for (const [letter, name] of praenomina) {
    it(`${letter.toUpperCase()}: ${name}`, () => {
      const r = findResult(letter, "N", name);
      expect(r).toBeDefined();
    });
  }

  it("d: Dominus abbreviation", () => {
    const r = findResult("d", "N", "Dominus");
    expect(r).toBeDefined();
  });

  it("m: Manius (alternate M praenomen)", () => {
    const r = findResult("m", "N", "Manius");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Abbreviation adjectives (d, R — N 9 8)
// ---------------------------------------------------------------------------

describe("BDL: abbreviation adjectives", () => {
  it("d: ADJ (obliged, bound to pay)", () => {
    const r = findResult("d", "ADJ", "obliged");
    expect(r).toBeDefined();
  });

  it("r: ADJ (Roman abbreviation)", () => {
    const r = findResult("r", "ADJ", "Roman");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Pronouns (stem1 = 1 char, stem2 = real, stem3/4 = zzz)
// ---------------------------------------------------------------------------

describe("BDL: pronouns with zzz stem3/4", () => {
  // is, ea, id (PRON 4 1 — stem1="i", stem2="e")
  it("is: PRON NOM S M (he)", () => {
    const r = findResult("is", "PRON", "he/she/it");
    expect(r).toBeDefined();
    expect(r!.ir.qual.pron.cs).toBe("NOM");
  });

  it("eius: PRON GEN S (of him/her/it, uses stem2)", () => {
    const r = findResult("eius", "PRON", "he/she/it");
    expect(r).toBeDefined();
    expect(r!.ir.qual.pron.cs).toBe("GEN");
  });

  it("eum: PRON ACC S M", () => {
    const r = findResult("eum", "PRON", "he/she/it");
    expect(r).toBeDefined();
  });

  it("ea: PRON NOM S F / NOM/ACC P N", () => {
    const a = allResults("ea");
    const prons = a.results.filter(
      (r) => r.ir.qual.pofs === "PRON" && r.de.mean.includes("he/she/it"),
    );
    expect(prons.length).toBeGreaterThan(0);
  });

  // idem (PRON 4 2 — stem1="i", stem2="e") — via tackon
  it("idem: PRON via tackon (same)", () => {
    const a = allResults("idem");
    expect(a.addonResults.length + a.uniqueResults.length).toBeGreaterThan(0);
  });

  // hic (PRON 3 1 — stem1="h", stem2="hu")
  it("hic: PRON (this)", () => {
    const a = allResults("hic");
    const all = [...a.results, ...a.uniqueResults.map((u) => ({ ir: { qual: u.qual }, de: u.de }))];
    expect(all.some((r) => r.de.mean.includes("this"))).toBe(true);
  });

  it("huius: PRON GEN S (of this, uses stem2=hu)", () => {
    const a = allResults("huius");
    const all = [...a.results, ...a.uniqueResults.map((u) => ({ ir: { qual: u.qual }, de: u.de }))];
    expect(all.some((r) => r.de.mean.includes("this"))).toBe(true);
  });

  // nos (PRON 5 3 — stem1="n", stem2="nostr")
  it("nos: PRON (we)", () => {
    const r = findResult("nos", "PRON", "we");
    expect(r).toBeDefined();
  });

  it("nostrum: PRON GEN P (uses stem2=nostr)", () => {
    const r = findResult("nostrum", "PRON", "we");
    expect(r).toBeDefined();
  });

  // vos (PRON 5 3 — stem1="v", stem2="vestr"/"vostr")
  it("vos: PRON (you pl.)", () => {
    const r = findResult("vos", "PRON", "you");
    expect(r).toBeDefined();
  });

  it("vestrum: PRON GEN P (uses stem2=vestr)", () => {
    const r = findResult("vestrum", "PRON", "you");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// PRON 4 2 DEMONS (idem): filtered from standalone results, only via tackon
// ---------------------------------------------------------------------------

describe("BDL: PRON 4 2 idem filtering", () => {
  // Standalone forms should NOT show idem (PRON 4 2)
  it("'i' does not show idem PRON 4 2", () => {
    const a = allResults("i");
    const idem = a.results.filter((r) => r.ir.qual.pofs === "PRON" && r.de.mean.includes("same"));
    expect(idem.length).toBe(0);
  });

  it("'is' does not show idem PRON 4 2", () => {
    const a = allResults("is");
    const idem = a.results.filter((r) => r.ir.qual.pofs === "PRON" && r.de.mean.includes("same"));
    expect(idem.length).toBe(0);
  });

  it("'eius' does not show idem PRON 4 2", () => {
    const a = allResults("eius");
    const idem = a.results.filter((r) => r.ir.qual.pofs === "PRON" && r.de.mean.includes("same"));
    expect(idem.length).toBe(0);
  });

  it("'ea' does not show idem PRON 4 2", () => {
    const a = allResults("ea");
    const idem = a.results.filter((r) => r.ir.qual.pofs === "PRON" && r.de.mean.includes("same"));
    expect(idem.length).toBe(0);
  });

  it("'eum' does not show idem PRON 4 2", () => {
    const a = allResults("eum");
    const idem = a.results.filter((r) => r.ir.qual.pofs === "PRON" && r.de.mean.includes("same"));
    expect(idem.length).toBe(0);
  });

  // But is/ea/id (PRON 4 1) should still work
  it("'is' still shows is/ea/id PRON 4 1", () => {
    const r = findResult("is", "PRON", "he/she/it");
    expect(r).toBeDefined();
  });

  it("'eius' still shows is/ea/id PRON 4 1", () => {
    const r = findResult("eius", "PRON", "he/she/it");
    expect(r).toBeDefined();
  });

  // idem via tackon — should work
  it("'idem' shows PRON 4 2 via tackon", () => {
    const a = allResults("idem");
    const hasAddon = a.addonResults.some((ar) =>
      ar.baseResults.some((r) => r.de.mean.includes("same")),
    );
    const hasUnique = a.uniqueResults.some((u) => u.de.mean.includes("same"));
    expect(hasAddon || hasUnique).toBe(true);
  });

  it("'eandem' shows PRON 4 2 ACC S F via tackon", () => {
    const a = allResults("eandem");
    const hasAddon = a.addonResults.some((ar) =>
      ar.baseResults.some((r) => r.de.mean.includes("same") && r.ir.qual.pron.cs === "ACC"),
    );
    expect(hasAddon).toBe(true);
  });

  it("'eundem' shows PRON 4 2 via uniques", () => {
    const a = allResults("eundem");
    const hasUnique = a.uniqueResults.some((u) => u.de.mean.includes("same"));
    expect(hasUnique).toBe(true);
  });

  it("'eorundem' shows PRON 4 2 via tackon", () => {
    const a = allResults("eorundem");
    const hasAddon = a.addonResults.some((ar) =>
      ar.baseResults.some((r) => r.de.mean.includes("same")),
    );
    expect(hasAddon).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Nouns with real stem2 (stem3/4 = zzz)
// ---------------------------------------------------------------------------

describe("BDL: nouns with real stem2", () => {
  // bos (N 4 1 — stem1="b", stem2="b")
  it("bos: N NOM S (ox, bull)", () => {
    const r = findResult("bos", "N", "ox");
    expect(r).toBeDefined();
  });

  it("bovis: N GEN S (uses stem2=b + 3rd decl gen)", () => {
    const r = findResult("bovis", "N", "ox");
    expect(r).toBeDefined();
  });

  it("boves: N NOM/ACC P", () => {
    const r = findResult("boves", "N", "ox");
    expect(r).toBeDefined();
  });

  // res (N 5 1 — stem1="r", stem2="r")
  it("res: N NOM S (thing)", () => {
    const r = findResult("res", "N", "thing");
    expect(r).toBeDefined();
  });

  it("rei: N GEN/DAT S (uses stem2=r)", () => {
    const r = findResult("rei", "N", "thing");
    expect(r).toBeDefined();
  });

  it("rem: N ACC S", () => {
    const r = findResult("rem", "N", "thing");
    expect(r).toBeDefined();
  });

  it("rerum: N GEN P", () => {
    const r = findResult("rerum", "N", "thing");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Verbs with 1-char stem1 are unaffected (stem3/4 are real verb stems)
// ---------------------------------------------------------------------------

describe("BDL: verbs unaffected (real stem3/4)", () => {
  it("do (dare): V 1 1", () => {
    const r = findResult("do", "V", "give");
    expect(r).toBeDefined();
  });

  it("dedi: perfect of do (uses stem3=ded)", () => {
    const r = findResult("dedi", "V", "give");
    expect(r).toBeDefined();
  });

  it("datum: PPL of do (uses stem4=dat)", () => {
    const a = allResults("datum");
    const ppl = a.results.find((r) => r.ir.qual.pofs === "VPAR" && r.de.mean.includes("give"));
    expect(ppl).toBeDefined();
  });

  it("for (fari): V DEP", () => {
    const r = findResult("for", "V", "speak");
    expect(r).toBeDefined();
  });

  it("no (nare): swim", () => {
    const r = findResult("no", "V", "swim");
    expect(r).toBeDefined();
  });

  it("reor: V DEP (think)", () => {
    const r = findResult("reor", "V", "think");
    expect(r).toBeDefined();
  });

  it("eo (ire): V go", () => {
    const r = findResult("eo", "V", "go");
    expect(r).toBeDefined();
  });
});
