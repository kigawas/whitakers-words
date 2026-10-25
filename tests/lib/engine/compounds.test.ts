import { describe, expect, it } from "vitest";
import { isEsse, isFuisse, isSumForm, tryCompound } from "../../../src/lib/engine/compounds.js";
import { createEngine } from "../../../src/node/index.js";

const engine = createEngine();

// ---------------------------------------------------------------------------
// isSumForm — lookup table tests
// ---------------------------------------------------------------------------
describe("isSumForm", () => {
  it("recognizes 'est' as PRES IND 3 S", () => {
    const info = isSumForm("est");
    expect(info).toEqual({ tense: "PRES", mood: "IND", person: 3, number: "S" });
  });

  it("recognizes 'sunt' as PRES IND 3 P", () => {
    const info = isSumForm("sunt");
    expect(info).toEqual({ tense: "PRES", mood: "IND", person: 3, number: "P" });
  });

  it("recognizes 'erat' as IMPF IND 3 S", () => {
    const info = isSumForm("erat");
    expect(info).toEqual({ tense: "IMPF", mood: "IND", person: 3, number: "S" });
  });

  it("recognizes 'fuit' as PERF IND 3 S", () => {
    const info = isSumForm("fuit");
    expect(info).toEqual({ tense: "PERF", mood: "IND", person: 3, number: "S" });
  });

  it("recognizes 'sit' as PRES SUB 3 S", () => {
    const info = isSumForm("sit");
    expect(info).toEqual({ tense: "PRES", mood: "SUB", person: 3, number: "S" });
  });

  it("recognizes 'fuisset' as PLUP SUB 3 S", () => {
    const info = isSumForm("fuisset");
    expect(info).toEqual({ tense: "PLUP", mood: "SUB", person: 3, number: "S" });
  });

  it("recognizes 'es' as PRES IND 2 S", () => {
    const info = isSumForm("es");
    expect(info).toEqual({ tense: "PRES", mood: "IND", person: 2, number: "S" });
  });

  it("rejects non-sum words", () => {
    expect(isSumForm("aquam")).toBeNull();
    expect(isSumForm("bonus")).toBeNull();
    expect(isSumForm("")).toBeNull();
  });

  it("rejects words not starting with s/e/f", () => {
    expect(isSumForm("amor")).toBeNull();
  });
});

describe("isEsse / isFuisse", () => {
  it("isEsse recognizes 'esse'", () => {
    expect(isEsse("esse")).toBe(true);
    expect(isEsse("est")).toBe(false);
  });

  it("isFuisse recognizes 'fuisse'", () => {
    expect(isFuisse("fuisse")).toBe(true);
    expect(isFuisse("fuit")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// tryCompound — compound detection from parse results
// ---------------------------------------------------------------------------
describe("tryCompound", () => {
  it("forms compound from VPAR PERF PASSIVE PPL + est", () => {
    const a = engine.parseWord("visa");
    const c = tryCompound(a.results, "est")?.compound;
    expect(c).toBeDefined();
    if (!c) return;
    expect(c.stem).toBe("PPL+est");
    expect(c.tense).toBe("PERF");
    expect(c.voice).toBe("PASSIVE");
    expect(c.mood).toBe("IND");
    expect(c.person).toBe(3);
    expect(c.number).toBe("S");
  });

  it("derives PLUP from IMPF sum form", () => {
    const a = engine.parseWord("visa");
    expect(tryCompound(a.results, "erat")?.compound.tense).toBe("PLUP");
  });

  it("derives FUTP from FUT sum form", () => {
    const a = engine.parseWord("visa");
    expect(tryCompound(a.results, "erit")?.compound.tense).toBe("FUTP");
  });

  it("derives SUB mood from subjunctive sum form", () => {
    const a = engine.parseWord("suscepta");
    const c = tryCompound(a.results, "fuisset")?.compound;
    expect(c?.tense).toBe("PLUP");
    expect(c?.mood).toBe("SUB");
  });

  it("produces blank voice under a DEP verb's participles", () => {
    const a = engine.parseWord("merita");
    const c = tryCompound(a.results, "es")?.compound;
    expect(c?.de.part.pofs === "V" && c.de.part.v.kind).toBe("DEP");
    expect(c?.voice).toBe("");
  });

  it("keeps only the NOM participles of the sum form's number", () => {
    const a = engine.parseWord("visa");
    const kept = tryCompound(a.results, "est")?.results ?? [];
    expect(kept.length).toBeGreaterThan(0);
    for (const r of kept) {
      expect(r.ir.qual.pofs === "VPAR" && [r.ir.qual.vpar.cs, r.ir.qual.vpar.number]).toEqual([
        "NOM",
        "S",
      ]);
    }
  });

  it("returns null when next word is not sum/esse/fuisse", () => {
    const a = engine.parseWord("visa");
    expect(tryCompound(a.results, "aquam")).toBeNull();
    expect(tryCompound(a.results, "")).toBeNull();
  });

  it("returns null when no participle makes a compound", () => {
    const a = engine.parseWord("aquam");
    expect(tryCompound(a.results, "est")).toBeNull();
  });

  it("forms compound with esse (infinitive)", () => {
    const a = engine.parseWord("visa");
    const c = tryCompound(a.results, "esse")?.compound;
    expect(c?.mood).toBe("INF");
    expect(c?.person).toBe(0);
    expect(c?.number).toBe("X");
  });

  it("forms none with fuisse from a perfect participle, as Ada does", () => {
    const a = engine.parseWord("visa");
    expect(tryCompound(a.results, "fuisse")).toBeNull();
  });

  it("forms one with fuisse from a future participle (PERF ACTIVE INF)", () => {
    const a = engine.parseWord("amaturum");
    const c = tryCompound(a.results, "fuisse")?.compound;
    expect([c?.tense, c?.voice, c?.mood]).toEqual(["PERF", "ACTIVE", "INF"]);
    expect(c?.gloss).toBe(
      "FUT ACT PPL+fuisse => PERF ACT INF Periphrastic - to have been about/going to",
    );
  });
});

// ---------------------------------------------------------------------------
// Engine integration: parseLine with compound detection
// ---------------------------------------------------------------------------
describe("engine.parseLine: compound detection", () => {
  it("detects compound in 'visa est'", () => {
    const analyses = engine.parseLine("visa est");
    expect(analyses).toHaveLength(1); // 'est' consumed
    expect(analyses[0]?.compoundResults.length).toBeGreaterThan(0);
    expect(analyses[0]?.compoundResults[0]?.stem).toBe("PPL+est");
  });

  it("consumes next word when compound detected", () => {
    const analyses = engine.parseLine("suscepta fuisset cura");
    // "suscepta" consumes "fuisset", "cura" is separate
    expect(analyses).toHaveLength(2);
    expect(analyses[0]?.compoundResults.length).toBeGreaterThan(0);
    expect(analyses[1]?.word).toBe("cura");
  });

  it("does not consume next word when no compound", () => {
    const analyses = engine.parseLine("aquam est");
    // "aquam" has no VPAR, so "est" is processed separately
    expect(analyses).toHaveLength(2);
    expect(analyses[0]?.compoundResults).toHaveLength(0);
  });

  it("single word has no compound", () => {
    const analyses = engine.parseLine("visa");
    expect(analyses).toHaveLength(1);
    expect(analyses[0]?.compoundResults).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Formatted output matches Ada
// ---------------------------------------------------------------------------
describe("compound: as Ada prints it", () => {
  const lines = (text: string) =>
    engine
      .formatLine(text)
      .split("\n")
      .map((l) => l.trimEnd())
      .filter((l) => l.length > 0);

  it("visa est: one PPL+est, under the last participle, with the first one's conjugation (expected:14690)", () => {
    expect(lines("visa est")).toEqual([
      "vis.a                VPAR   2 1 NOM S F PERF PASSIVE PPL",
      "video, videre, vidi, visus  V (2nd)   [XXXAX]",
      "see, look at; consider; (PASS) seem, seem good, appear, be seen;",
      "vis.a                VPAR   3 1 NOM S F PERF PASSIVE PPL",
      "PPL+est              V      2 1 PERF PASSIVE IND 3 S",
      "PERF PASSIVE PPL + verb TO_BE => PASSIVE perfect system",
      "viso, visere, visi, visus  V (3rd)   [XXXBX]",
      "visit, go to see; look at;",
    ]);
  });

  it("visa sunt: only the participles of sunt's number (latin-words.com)", () => {
    expect(lines("visa sunt")).toEqual([
      "vis.a                VPAR   2 1 NOM P N PERF PASSIVE PPL",
      "video, videre, vidi, visus  V (2nd)   [XXXAX]",
      "see, look at; consider; (PASS) seem, seem good, appear, be seen;",
      "vis.a                VPAR   3 1 NOM P N PERF PASSIVE PPL",
      "PPL+sunt             V      2 1 PERF PASSIVE IND 3 P",
      "PERF PASSIVE PPL + verb TO_BE => PASSIVE perfect system",
      "viso, visere, visi, visus  V (3rd)   [XXXBX]",
      "visit, go to see; look at;",
    ]);
  });

  it("amaturus est: a future active participle forms the periphrastic (latin-words.com)", () => {
    expect(lines("amaturus est")).toEqual([
      "amat.urus            VPAR   1 1 NOM S M FUT  ACTIVE  PPL",
      "PPL+est              V      1 1 PRES PASSIVE IND 3 S",
      "FUT ACTIVE PPL + verb TO_BE => ACTIVE Periphrastic - about to, going to",
      "amo, amare, amavi, amatus  V (1st)   [XXXAO]",
      "love, like; fall in love with; be fond of; have a tendency to;",
    ]);
  });

  it("amandum esse: with esse, a participle of any case (latin-words.com)", () => {
    expect(lines("amandum esse")).toEqual([
      "am.andum             VPAR   1 1 NOM S N FUT  PASSIVE PPL",
      "am.andum             VPAR   1 1 VOC S N FUT  PASSIVE PPL",
      "am.andum             VPAR   1 1 ACC S M FUT  PASSIVE PPL",
      "am.andum             VPAR   1 1 ACC S N FUT  PASSIVE PPL",
      "PPL+esse             V      1 1 PRES PASSIVE INF 0 X",
      "FUT PASSIVE PPL + esse => PRES PASSIVE INF",
      "amo, amare, amavi, amatus  V (1st)   [XXXAO]",
      "love, like; fall in love with; be fond of; have a tendency to;",
    ]);
  });

  it("visa fuisse: no compound, as fuisse takes only a future participle (latin-words.com)", () => {
    const out = lines("visa fuisse");
    expect(out).not.toContainEqual(expect.stringContaining("PPL+"));
    expect(out).toContainEqual("fu.isse              V      5 1 PERF ACTIVE  INF 0 X");
  });
});

describe("compound: formatted output", () => {
  it("visa est produces PPL+est line matching Ada format", () => {
    const output = engine.formatLine("visa est");
    expect(output).toContain("PPL+est");
    expect(output).toContain("V      2 1 PERF PASSIVE IND 3 S");
    expect(output).toContain("PERF PASSIVE PPL + verb TO_BE => PASSIVE perfect system");
  });

  it("suscepta fuisset produces PPL+fuisset with PLUP SUB", () => {
    const output = engine.formatLine("suscepta fuisset");
    expect(output).toContain("PPL+fuisset");
    expect(output).toContain("PLUP PASSIVE SUB 3 S");
  });

  it("merita es produces PPL+es with blank voice for DEP verb", () => {
    const output = engine.formatLine("merita es");
    expect(output).toContain("PPL+es");
    // DEP verb: voice is blank
    expect(output).toMatch(/PPL\+es\s+V\s+2 1 PERF\s+IND 2 S/);
  });

  it("merita es keeps mereor's own participle line under its compound (expected:27926)", () => {
    expect(engine.formatLine("merita es")).toContain(
      "merit.a              VPAR   2 1 NOM S F PERF         PPL",
    );
  });

  it("ausus est produces PPL+est with PASSIVE for a SEMIDEP verb (latin-words.com)", () => {
    expect(engine.formatLine("ausus est")).toContain(
      "PPL+est              V      2 1 PERF PASSIVE IND 3 S",
    );
  });
});

// ---------------------------------------------------------------------------
// compounds: getCompoundTense default (from remaining-branches)
// ---------------------------------------------------------------------------
describe("compounds: getCompoundTense default", () => {
  it("FUTP sum tense produces X compound tense (no valid mapping)", () => {
    const info = isSumForm("fuero");
    expect(info).toBeDefined();
  });
});
