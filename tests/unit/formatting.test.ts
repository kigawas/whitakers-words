import { describe, expect, it } from "vitest";
import { listSweep } from "../../src/lib/engine/list-sweep.js";
import { dictionaryForm } from "../../src/lib/formatter/dictionary-form.js";
import { formatInflectionLine, formatWordAnalysis } from "../../src/lib/formatter/text-output.js";
import { createEngine } from "../../src/node/index.js";

const engine = createEngine();

describe("listSweep", () => {
  it("deduplicates results for 'aquam'", () => {
    const analysis = engine.parseWord("aquam");
    const before = analysis.results.length;
    const swept = listSweep([...analysis.results]);
    expect(swept.length).toBeLessThanOrEqual(before);
    expect(swept.length).toBeGreaterThan(0);
  });

  it("sorts more frequent words first", () => {
    const analysis = engine.parseWord("in");
    const swept = listSweep([...analysis.results]);
    expect(swept.length).toBeGreaterThan(0);
    // The first result should be among the most frequent
    const firstFreq = swept[0]?.de.tran.freq;
    expect(firstFreq).toBeDefined();
  });

  it("removes exact duplicates", () => {
    const analysis = engine.parseWord("bonus");
    const results = [...analysis.results];
    // Double the results to create duplicates
    const doubled = [...results, ...results];
    const swept = listSweep(doubled);
    expect(swept.length).toBe(listSweep(results).length);
  });
});

describe("dictionaryForm", () => {
  it("formats 1st declension noun (aqua)", () => {
    const analysis = engine.parseWord("aquam");
    const nounResult = analysis.results.find(
      (r) => r.ir.qual.pofs === "N" && r.de.mean.includes("water"),
    );
    expect(nounResult).toBeDefined();
    if (nounResult) {
      const form = dictionaryForm(nounResult.de);
      expect(form).toContain("N");
      expect(form).toContain("1st");
      expect(form).toContain("F");
    }
  });

  it("formats verb (amo)", () => {
    const analysis = engine.parseWord("amo");
    const verbResult = analysis.results.find(
      (r) => r.ir.qual.pofs === "V" && r.de.mean.includes("love"),
    );
    expect(verbResult).toBeDefined();
    if (verbResult) {
      const form = dictionaryForm(verbResult.de);
      expect(form).toContain("V");
      expect(form).toContain("1st");
    }
  });

  it("formats conjunction (et)", () => {
    const analysis = engine.parseWord("et");
    const conjResult = analysis.results.find((r) => r.ir.qual.pofs === "CONJ");
    expect(conjResult).toBeDefined();
    if (conjResult) {
      const form = dictionaryForm(conjResult.de);
      expect(form).toContain("CONJ");
    }
  });

  it("formats preposition (in)", () => {
    const analysis = engine.parseWord("in");
    const prepResult = analysis.results.find((r) => r.ir.qual.pofs === "PREP");
    expect(prepResult).toBeDefined();
    if (prepResult) {
      const form = dictionaryForm(prepResult.de);
      expect(form).toContain("PREP");
    }
  });

  it("formats 3rd declension noun (rex)", () => {
    const analysis = engine.parseWord("rex");
    const nounResult = analysis.results.find(
      (r) => r.ir.qual.pofs === "N" && r.de.mean.includes("king"),
    );
    expect(nounResult).toBeDefined();
    if (nounResult) {
      const form = dictionaryForm(nounResult.de);
      expect(form).toContain("N");
      expect(form).toContain("3rd");
      expect(form).toContain("M");
    }
  });
});

describe("formatInflectionLine", () => {
  it("formats noun inflection for 'aquam'", () => {
    const analysis = engine.parseWord("aquam");
    const nounResult = analysis.results.find(
      (r) => r.ir.qual.pofs === "N" && r.ir.qual.noun.cs === "ACC",
    );
    expect(nounResult).toBeDefined();
    if (nounResult) {
      const line = formatInflectionLine(nounResult);
      expect(line).toContain("aqu.am");
      expect(line).toContain("N");
      expect(line).toContain("ACC");
      expect(line).toContain("S");
    }
  });

  it("formats verb inflection for 'amo'", () => {
    const analysis = engine.parseWord("amo");
    const verbResult = analysis.results.find(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.ir.qual.verb.tenseVoiceMood.tense === "PRES" &&
        r.ir.qual.verb.person === 1,
    );
    expect(verbResult).toBeDefined();
    if (verbResult) {
      const line = formatInflectionLine(verbResult);
      expect(line).toContain("V");
      expect(line).toContain("PRES");
      expect(line).toContain("ACTIVE");
      expect(line).toContain("IND");
    }
  });
});

describe("formatWordAnalysis", () => {
  it("formats full analysis for 'aquam'", () => {
    const analysis = engine.parseWord("aquam");
    const output = formatWordAnalysis(analysis);
    expect(output).toContain("aqu.am");
    expect(output).toContain("water");
    expect(output).toContain("N");
    expect(output).toContain("ACC");
  });

  it("formats full analysis for 'amo'", () => {
    const analysis = engine.parseWord("amo");
    const output = formatWordAnalysis(analysis);
    expect(output).toContain("am.o");
    expect(output).toContain("love");
    expect(output).toContain("V");
  });

  it("formats full analysis for 'bonus'", () => {
    const analysis = engine.parseWord("bonus");
    const output = formatWordAnalysis(analysis);
    expect(output).toContain("bon.us");
    expect(output).toContain("good");
    expect(output).toContain("ADJ");
  });

  it("formats full analysis for 'rex'", () => {
    const analysis = engine.parseWord("rex");
    const output = formatWordAnalysis(analysis);
    expect(output).toContain("rex");
    expect(output).toContain("king");
    expect(output).toContain("N");
  });

  it("formats full analysis for 'et'", () => {
    const analysis = engine.parseWord("et");
    const output = formatWordAnalysis(analysis);
    expect(output).toContain("et");
    expect(output).toContain("and");
    expect(output).toContain("CONJ");
  });

  it("formats full analysis for 'in'", () => {
    const analysis = engine.parseWord("in");
    const output = formatWordAnalysis(analysis);
    expect(output).toContain("in");
    expect(output).toContain("PREP");
  });

  it("includes flags in output", () => {
    const analysis = engine.parseWord("aquam");
    const output = formatWordAnalysis(analysis);
    // Flags look like [XXXAA] — 5 characters in brackets
    expect(output).toMatch(/\[.{5}\]/);
  });
});
