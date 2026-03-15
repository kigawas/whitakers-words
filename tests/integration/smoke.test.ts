import { describe, expect, it } from "vitest";
import { createEngine } from "../../src/node";
import { formatWordAnalysis, groupAndMerge, dictionaryForm } from "../../src/lib";

describe("integration: smoke test (rem acu tetigisti)", () => {
  const engine = createEngine();

  it("parses 'rem' as thing (N 5 1 ACC S)", () => {
    const a = engine.parseWord("rem");
    const noun = a.results.find(
      (r) => r.ir.qual.pofs === "N" && r.ir.qual.noun.cs === "ACC" && r.ir.qual.noun.number === "S",
    );
    expect(noun).toBeDefined();
    expect(noun?.de.mean).toContain("thing");
  });

  it("parses 'acu' as needle (N 4 1 ABL S)", () => {
    const a = engine.parseWord("acu");
    const noun = a.results.find((r) => r.ir.qual.pofs === "N" && r.de.mean.includes("needle"));
    expect(noun).toBeDefined();
  });

  it("parses 'tetigisti' as touch (V PERF ACTIVE IND 2 S)", () => {
    const a = engine.parseWord("tetigisti");
    const verb = a.results.find(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.ir.qual.verb.tenseVoiceMood.tense === "PERF" &&
        r.ir.qual.verb.person === 2,
    );
    expect(verb).toBeDefined();
    expect(verb?.de.mean).toContain("touch");
  });

  it("formats output with stem.ending notation", () => {
    const output = engine.formatWord("rem");
    expect(output).toContain("r.em");
    expect(output).toContain("N");
    expect(output).toContain("ACC");
    expect(output).toContain("thing");
  });
});

describe("integration: aeneid opening", () => {
  const engine = createEngine();

  it("parses 'at' as conjunction", () => {
    const a = engine.parseWord("at");
    expect(a.results.some((r) => r.ir.qual.pofs === "CONJ")).toBe(true);
    expect(a.results.some((r) => r.de.mean.includes("but"))).toBe(true);
  });

  it("parses 'regina' as queen (N 1 1 NOM/VOC/ABL S F)", () => {
    const a = engine.parseWord("regina");
    const noms = a.results.filter((r) => r.ir.qual.pofs === "N" && r.de.mean.includes("queen"));
    expect(noms.length).toBeGreaterThan(0);
    const cases = noms.map((r) => (r.ir.qual.pofs === "N" ? r.ir.qual.noun.cs : ""));
    expect(cases).toContain("NOM");
  });

  it("parses 'gravi' as heavy (ADJ 3 2 DAT/ABL S)", () => {
    const a = engine.parseWord("gravi");
    const adj = a.results.find((r) => r.ir.qual.pofs === "ADJ" && r.de.mean.includes("heavy"));
    expect(adj).toBeDefined();
  });

  it("parses 'saucia' as wounded (ADJ 1 1)", () => {
    const a = engine.parseWord("saucia");
    const adj = a.results.find((r) => r.ir.qual.pofs === "ADJ" && r.de.mean.includes("wounded"));
    expect(adj).toBeDefined();
  });

  it("parses 'cura' as concern/worry (N 1 1)", () => {
    const a = engine.parseWord("cura");
    const noun = a.results.find((r) => r.ir.qual.pofs === "N" && r.de.mean.includes("concern"));
    expect(noun).toBeDefined();
  });
});

describe("integration: English-to-Latin", () => {
  const engine = createEngine();

  it("finds Latin words for 'water'", () => {
    const results = engine.searchEnglish("water");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.de.stems[0] === "aqu")).toBe(true);
  });

  it("finds Latin words for 'love'", () => {
    const results = engine.searchEnglish("love");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.de.mean.includes("love"))).toBe(true);
  });

  it("finds Latin words for 'king'", () => {
    const results = engine.searchEnglish("king");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.de.mean.includes("king"))).toBe(true);
  });
});

describe("integration: addons", () => {
  const engine = createEngine();

  it("handles enclitic -que in 'aquamque'", () => {
    const a = engine.parseWord("aquamque");
    expect(a.addonResults.length).toBeGreaterThan(0);
    const tackonResult = a.addonResults.find((r) => r.type === "tackon");
    expect(tackonResult).toBeDefined();
    if (tackonResult) {
      expect(tackonResult.baseResults.some((r) => r.de.mean.includes("water"))).toBe(true);
    }
  });
});

describe("integration: unique entries", () => {
  const engine = createEngine();

  it("finds 'memento' as unique verb form", () => {
    const a = engine.parseWord("memento");
    expect(a.uniqueResults.length).toBeGreaterThan(0);
    expect(a.uniqueResults[0]?.de.mean).toContain("remember");
  });

  it("finds 'vis' as unique verb form", () => {
    const a = engine.parseWord("vis");
    expect(a.uniqueResults.length).toBeGreaterThan(0);
    expect(a.uniqueResults.some((u) => u.de.mean.includes("willing"))).toBe(true);
  });
});

describe("integration: engine data sizes", () => {
  const engine = createEngine();

  it("has dictionary entries", () => {
    expect(engine.dictionarySize).toBeGreaterThan(39000);
  });

  it("has inflection records", () => {
    expect(engine.inflectionCount).toBeGreaterThan(1700);
  });

  it("has unique entries", () => {
    expect(engine.uniqueCount).toBeGreaterThan(70);
  });

  it("has addons", () => {
    expect(engine.addons.prefixes.length).toBeGreaterThan(50);
    expect(engine.addons.suffixes.length).toBeGreaterThan(80);
  });
});

describe("integration: edge cases", () => {
  const engine = createEngine();

  it("parses 'amo' as love (V PRES ACTIVE IND 1 S)", () => {
    const a = engine.parseWord("amo");
    const verb = a.results.find(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.ir.qual.verb.tenseVoiceMood.tense === "PRES" &&
        r.ir.qual.verb.person === 1,
    );
    expect(verb).toBeDefined();
    expect(verb?.de.mean).toContain("love");
  });

  it("parses 'in' as preposition", () => {
    const a = engine.parseWord("in");
    expect(a.results.some((r) => r.ir.qual.pofs === "PREP")).toBe(true);
  });

  it("handles case-insensitive input", () => {
    const lower = engine.parseWord("aquam");
    const upper = engine.parseWord("AQUAM");
    expect(lower.results.length).toBe(upper.results.length);
  });

  it("returns empty for nonsense words", () => {
    const a = engine.parseWord("xyzzy");
    expect(a.results).toHaveLength(0);
    expect(a.uniqueResults).toHaveLength(0);
  });
});

describe("integration: formatting", () => {
  const engine = createEngine();

  it("formatWordAnalysis produces stem.ending output", () => {
    const a = engine.parseWord("aquam");
    const output = formatWordAnalysis(a);
    expect(output).toContain("aqu.am");
    expect(output).toContain("water");
  });

  it("merges | continuation lines for 'magnus'", () => {
    const a = engine.parseWord("magnus");
    const output = formatWordAnalysis(a);
    expect(output).not.toContain("|great");
    expect(output).not.toContain("||full");
    expect(output).toContain("large/great");
    expect(output).toContain("mighty");
    expect(output).toContain("intense");
  });

  it("groupAndMerge merges continuation entries", () => {
    const a = engine.parseWord("magnus");
    const groups = groupAndMerge(a.results);
    expect(groups.length).toBe(1);
    expect(groups[0]?.meaning).toContain("large/great");
    expect(groups[0]?.meaning).toContain("mighty");
  });

  it("dictionaryForm formats noun citation", () => {
    const a = engine.parseWord("aquam");
    const noun = a.results.find((r) => r.ir.qual.pofs === "N");
    expect(noun).toBeDefined();
    if (noun) {
      const form = dictionaryForm(noun.de);
      expect(form).toContain("N");
      expect(form).toContain("1st");
      expect(form).toContain("F");
    }
  });

  it("dictionaryForm formats verb citation", () => {
    const a = engine.parseWord("amo");
    const verb = a.results.find((r) => r.ir.qual.pofs === "V");
    expect(verb).toBeDefined();
    if (verb) {
      const form = dictionaryForm(verb.de);
      expect(form).toContain("V");
      expect(form).toContain("1st");
    }
  });
});
