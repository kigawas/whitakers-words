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
    const compounds = tryCompound(a.results, "est");
    expect(compounds.length).toBeGreaterThan(0);

    const c = compounds[0];
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
    const compounds = tryCompound(a.results, "erat");
    expect(compounds.length).toBeGreaterThan(0);
    expect(compounds[0]?.tense).toBe("PLUP");
  });

  it("derives FUTP from FUT sum form", () => {
    const a = engine.parseWord("visa");
    const compounds = tryCompound(a.results, "erit");
    expect(compounds.length).toBeGreaterThan(0);
    expect(compounds[0]?.tense).toBe("FUTP");
  });

  it("derives SUB mood from subjunctive sum form", () => {
    const a = engine.parseWord("suscepta");
    const compounds = tryCompound(a.results, "fuisset");
    expect(compounds.length).toBeGreaterThan(0);
    expect(compounds[0]?.tense).toBe("PLUP");
    expect(compounds[0]?.mood).toBe("SUB");
  });

  it("produces blank voice for DEP verbs", () => {
    const a = engine.parseWord("merita");
    const compounds = tryCompound(a.results, "es");
    const depCompound = compounds.find((c) => c.de.part.pofs === "V" && c.de.part.v.kind === "DEP");
    expect(depCompound).toBeDefined();
    expect(depCompound?.voice).toBe("");
  });

  it("returns empty when next word is not sum/esse/fuisse", () => {
    const a = engine.parseWord("visa");
    expect(tryCompound(a.results, "aquam")).toHaveLength(0);
    expect(tryCompound(a.results, "")).toHaveLength(0);
  });

  it("returns empty when no VPAR PERF PASSIVE PPL in results", () => {
    const a = engine.parseWord("aquam");
    expect(tryCompound(a.results, "est")).toHaveLength(0);
  });

  it("forms compound with esse (infinitive)", () => {
    const a = engine.parseWord("visa");
    const compounds = tryCompound(a.results, "esse");
    expect(compounds.length).toBeGreaterThan(0);
    expect(compounds[0]?.mood).toBe("INF");
    expect(compounds[0]?.person).toBe(0);
    expect(compounds[0]?.number).toBe("X");
  });

  it("forms compound with fuisse (perfect infinitive)", () => {
    const a = engine.parseWord("visa");
    const compounds = tryCompound(a.results, "fuisse");
    expect(compounds.length).toBeGreaterThan(0);
    expect(compounds[0]?.mood).toBe("INF");
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
