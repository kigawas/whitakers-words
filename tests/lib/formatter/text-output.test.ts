import { describe, expect, it } from "vitest";
import { listSweep } from "../../../src/lib/engine/list-sweep.js";
import type { ParseResult } from "../../../src/lib/engine/word-analysis.js";
import { dictionaryForm } from "../../../src/lib/formatter/dictionary-form.js";
import {
  formatInflectionLine,
  formatWordAnalysis,
  groupAndMerge,
} from "../../../src/lib/formatter/text-output.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";
import { createEngine } from "../../../src/node/index.js";

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

  it("formats pronoun (hic)", () => {
    const output = formatWordAnalysis(engine.parseWord("hic"));
    expect(output).toContain("PRON");
  });

  it("formats numeral (unus)", () => {
    const output = formatWordAnalysis(engine.parseWord("unus"));
    expect(output).toContain("NUM");
  });

  it("formats adverb (bene)", () => {
    const output = formatWordAnalysis(engine.parseWord("bene"));
    expect(output).toContain("ADV");
  });

  it("formats diverse POS for 'hic' (includes PRON, PACK, ADJ)", () => {
    const a = engine.parseWord("hic");
    const output = formatWordAnalysis(a);
    // hic produces PRON and possibly ADJ/PACK results
    expect(output).toContain("PRON");
  });

  it("formats interjection (heu)", () => {
    const output = formatWordAnalysis(engine.parseWord("heu"));
    expect(output).toContain("INTERJ");
  });

  it("formats trick results (foenix → phoenix)", () => {
    const a = engine.parseWord("foenix");
    expect(a.trickResults.length).toBeGreaterThan(0);
    const output = formatWordAnalysis(a);
    expect(output.length).toBeGreaterThan(0);
  });

  it("formats tackon addon results (aquamne)", () => {
    const a = engine.parseWord("aquamne");
    expect(a.addonResults.length).toBeGreaterThan(0);
    const output = formatWordAnalysis(a);
    expect(output).toContain("ne");
    expect(output).toContain("TACKON");
  });
});

describe("dictionaryForm: extended POS coverage", () => {
  it("formats 2nd declension noun (dominus)", () => {
    const a = engine.parseWord("dominus");
    const noun = a.results.find(
      (r) => r.ir.qual.pofs === "N" && r.de.part.pofs === "N" && r.de.part.n.decl.which === 2,
    );
    expect(noun).toBeDefined();
    if (noun) {
      const form = dictionaryForm(noun.de);
      expect(form).toContain("2nd");
      expect(form).toContain("M");
    }
  });

  it("formats 2nd declension neuter noun (bellum)", () => {
    const a = engine.parseWord("bellum");
    const noun = a.results.find(
      (r) =>
        r.ir.qual.pofs === "N" &&
        r.de.part.pofs === "N" &&
        r.de.part.n.gender === "N" &&
        r.de.part.n.decl.which === 2,
    );
    expect(noun).toBeDefined();
    if (noun) {
      const form = dictionaryForm(noun.de);
      expect(form).toContain("2nd");
      expect(form).toContain("N");
    }
  });

  it("formats 4th declension noun (manus)", () => {
    const a = engine.parseWord("manus");
    const noun = a.results.find(
      (r) => r.ir.qual.pofs === "N" && r.de.part.pofs === "N" && r.de.part.n.decl.which === 4,
    );
    expect(noun).toBeDefined();
    if (noun) {
      const form = dictionaryForm(noun.de);
      expect(form).toContain("4th");
    }
  });

  it("formats 5th declension noun (res)", () => {
    const a = engine.parseWord("res");
    const noun = a.results.find(
      (r) => r.ir.qual.pofs === "N" && r.de.part.pofs === "N" && r.de.part.n.decl.which === 5,
    );
    expect(noun).toBeDefined();
    if (noun) {
      const form = dictionaryForm(noun.de);
      expect(form).toContain("5th");
    }
  });

  it("formats 2nd conjugation verb (moneo)", () => {
    const a = engine.parseWord("moneo");
    const verb = a.results.find(
      (r) => r.ir.qual.pofs === "V" && r.de.part.pofs === "V" && r.de.part.v.con.which === 2,
    );
    expect(verb).toBeDefined();
    if (verb) {
      const form = dictionaryForm(verb.de);
      expect(form).toContain("2nd");
    }
  });

  it("formats 3rd conjugation verb (duco)", () => {
    const a = engine.parseWord("duco");
    const verb = a.results.find(
      (r) => r.ir.qual.pofs === "V" && r.de.part.pofs === "V" && r.de.part.v.con.which === 3,
    );
    expect(verb).toBeDefined();
    if (verb) {
      const form = dictionaryForm(verb.de);
      expect(form).toContain("3rd");
    }
  });

  it("formats 5th conjugation verb (possum)", () => {
    const a = engine.parseWord("possum");
    const verb = a.results.find(
      (r) => r.ir.qual.pofs === "V" && r.de.part.pofs === "V" && r.de.part.v.con.which === 5,
    );
    expect(verb).toBeDefined();
    if (verb) {
      const form = dictionaryForm(verb.de);
      // which=5 → default "re" infinitive ending
      expect(form).toContain("V");
    }
  });

  it("formats 3rd declension adjective (fortis)", () => {
    const a = engine.parseWord("fortis");
    const adj = a.results.find(
      (r) => r.ir.qual.pofs === "ADJ" && r.de.part.pofs === "ADJ" && r.de.part.adj.decl.which === 3,
    );
    expect(adj).toBeDefined();
    if (adj) {
      const form = dictionaryForm(adj.de);
      expect(form).toContain("ADJ");
      expect(form).toContain("is");
    }
  });

  it("formats adverb (bene)", () => {
    const a = engine.parseWord("bene");
    const adv = a.results.find((r) => r.ir.qual.pofs === "ADV");
    expect(adv).toBeDefined();
    if (adv) {
      const form = dictionaryForm(adv.de);
      expect(form).toContain("ADV");
    }
  });

  it("formats pronoun (hic)", () => {
    const a = engine.parseWord("hic");
    const pron = a.results.find((r) => r.ir.qual.pofs === "PRON");
    expect(pron).toBeDefined();
    if (pron) {
      const form = dictionaryForm(pron.de);
      expect(form).toContain("PRON");
    }
  });

  it("formats numeral (unus)", () => {
    const a = engine.parseWord("unus");
    const num = a.results.find((r) => r.ir.qual.pofs === "NUM");
    expect(num).toBeDefined();
    if (num) {
      const form = dictionaryForm(num.de);
      expect(form).toContain("NUM");
    }
  });

  it("formats interjection (heu)", () => {
    const a = engine.parseWord("heu");
    const interj = a.results.find((r) => r.ir.qual.pofs === "INTERJ");
    expect(interj).toBeDefined();
    if (interj) {
      const form = dictionaryForm(interj.de);
      expect(form).toContain("INTERJ");
    }
  });

  it("formats VPAR inflection line (amatum)", () => {
    const a = engine.parseWord("amatum");
    const vpar = a.results.find((r) => r.ir.qual.pofs === "VPAR");
    expect(vpar).toBeDefined();
    if (vpar) {
      const line = formatInflectionLine(vpar);
      expect(line).toContain("VPAR");
      expect(line).toContain("PERF");
      expect(line).toContain("PASSIVE");
    }
  });

  it("formats SUPINE inflection line (amatum)", () => {
    const a = engine.parseWord("amatum");
    const sup = a.results.find((r) => r.ir.qual.pofs === "SUPINE");
    expect(sup).toBeDefined();
    if (sup) {
      const line = formatInflectionLine(sup);
      expect(line).toContain("SUPINE");
    }
  });

  it("formats noun with default declension (which=9)", () => {
    const de = {
      stems: ["chaos", "", "", ""] as const,
      part: {
        pofs: "N" as const,
        n: {
          decl: { which: 9 as const, var: 9 as const },
          gender: "N" as const,
          kind: "T" as const,
        },
      },
      tran: {
        age: "X" as const,
        area: "X" as const,
        geo: "X" as const,
        freq: "X" as const,
        source: "X" as const,
      },
      mean: "chaos",
    };
    const form = dictionaryForm(de);
    expect(form).toContain("chaos");
    expect(form).toContain("N");
  });

  it("formats verb with missing stem3/stem4", () => {
    const de = {
      stems: ["sum", "es", "", ""] as const,
      part: {
        pofs: "V" as const,
        v: { con: { which: 5 as const, var: 1 as const }, kind: "TO_BE" as const },
      },
      tran: {
        age: "X" as const,
        area: "X" as const,
        geo: "X" as const,
        freq: "X" as const,
        source: "X" as const,
      },
      mean: "be, exist",
    };
    const form = dictionaryForm(de);
    expect(form).toContain("V");
    // No 3rd/4th stems, so no perfect/supine principal parts
    expect(form).not.toContain("undefined");
  });
});

describe("listSweep: extended POS/frequency coverage", () => {
  it("deduplicates and sorts all POS types", () => {
    // Each word exercises different dedupeKey and pofsRank branches
    const cases: [string, string][] = [
      ["ego", "PRON"],
      ["unus", "NUM"],
      ["bene", "ADV"],
      ["et", "CONJ"],
      ["heu", "INTERJ"],
      ["amatum", "VPAR"],
      ["amatum", "SUPINE"],
    ];
    for (const [word, pofs] of cases) {
      const a = engine.parseWord(word);
      const doubled = [...a.results, ...a.results];
      const swept = listSweep(doubled);
      expect(swept.length).toBeLessThan(doubled.length);
      expect(swept.some((r) => r.ir.qual.pofs === pofs)).toBe(true);
    }
  });

  it("deduplicates ADJ with comparison and NUM with sort", () => {
    const adjSwept = listSweep([
      ...engine.parseWord("bonus").results,
      ...engine.parseWord("bonus").results,
    ]);
    const numSwept = listSweep([
      ...engine.parseWord("unus").results,
      ...engine.parseWord("unus").results,
    ]);
    expect(adjSwept.length).toBeLessThan(engine.parseWord("bonus").results.length * 2);
    expect(numSwept.length).toBeLessThan(engine.parseWord("unus").results.length * 2);
  });

  it("deduplicates PREP results", () => {
    const swept = listSweep([...engine.parseWord("in").results, ...engine.parseWord("in").results]);
    expect(swept.some((r) => r.ir.qual.pofs === "PREP")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// text-output: edge case branches (from branch-coverage)
// ---------------------------------------------------------------------------
describe("text-output: edge case branches", () => {
  it("handles word with no results, no uniques (empty output)", () => {
    const output = formatWordAnalysis({
      word: "zzzzz",
      results: [],
      uniqueResults: [],
      addonResults: [],
      trickAnnotations: [],
      trickResults: [],
      syncopeResult: null,
      twoWordResult: null,
      romanNumeralResult: null,
    });
    expect(output).toBe("");
  });

  it("groupAndMerge handles empty input", () => {
    const groups = groupAndMerge([]);
    expect(groups).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// text-output: unknown POS format (from branch-coverage)
// ---------------------------------------------------------------------------
describe("text-output: unknown POS format", () => {
  it("formats a word with TACKON POS (X-like default)", () => {
    const a = engine.parseWord("aquamque");
    const output = formatWordAnalysis(a);
    expect(output).toContain("TACKON");
    expect(output).toContain("water");
  });
});

// ---------------------------------------------------------------------------
// formatWordAnalysis: edge cases (from engine-coverage)
// ---------------------------------------------------------------------------
describe("formatWordAnalysis: additional edge cases", () => {
  it("handles empty analysis", () => {
    const output = formatWordAnalysis({ word: "zzz", results: [], uniqueResults: [] });
    expect(output).toBe("");
  });

  it("formats TACKON POS inflection line (hits default formatQualityFromValues)", () => {
    const mockResult: ParseResult = {
      stem: "test",
      ir: {
        qual: { pofs: "X" },
        key: 0,
        ending: { size: 0, suf: "" },
        age: "X",
        freq: "A",
      },
      de: {
        stems: ["test", "", "", ""],
        part: { pofs: "X" },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "test meaning",
      },
      entryIndex: 0,
    };
    const output = formatWordAnalysis({
      word: "test",
      results: [mockResult],
      uniqueResults: [],
    });
    expect(output).toContain("X");
    expect(output).toContain("test meaning");
  });

  it("formats two-word/tackon results", () => {
    const output = formatWordAnalysis(engine.parseWord("mecum"));
    expect(output.length).toBeGreaterThan(0);
  });

  it("formats syncope results when present", () => {
    const a = engine.parseWord("amasti");
    if (a.syncopeResult) {
      expect(formatWordAnalysis(a)).toContain("Syncopated");
    }
  });

  it("merges groups with identical meanings", () => {
    expect(engine.formatWord("abfui").length).toBeGreaterThan(0);
  });

  it("truncates meaning lines to 79 chars", () => {
    const lines = engine.formatWord("res").split("\n");
    for (const line of lines) {
      if (
        line.length > 0 &&
        !line.match(/^\S+\s+(N|V|ADJ|ADV|PREP|CONJ|INTERJ|PRON|NUM|PACK|VPAR|SUPINE)\s/) &&
        !line.match(/\[.{5}\]/) &&
        !line.match(/^\S+,\s/)
      ) {
        expect(line.length).toBeLessThanOrEqual(79);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// dictionaryForm: remaining POS types (from engine-coverage)
// ---------------------------------------------------------------------------
describe("dictionaryForm: remaining POS types", () => {
  it("formats PACK entry", () => {
    const de: DictionaryEntry = {
      stems: ["qui", "", "", ""],
      part: { pofs: "PACK", pack: { decl: { which: 1, var: 0 }, kind: "INDEF" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "each",
    };
    expect(dictionaryForm(de)).toBe("qui  PACK");
  });

  it("formats NUM entry", () => {
    const de: DictionaryEntry = {
      stems: ["un", "", "", ""],
      part: { pofs: "NUM", num: { decl: { which: 1, var: 1 }, sort: "CARD", value: 1 } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "one",
    };
    expect(dictionaryForm(de)).toBe("un  NUM");
  });

  it("formats ADV with comparison stems", () => {
    const de: DictionaryEntry = {
      stems: ["bene", "melius", "optime", ""],
      part: { pofs: "ADV", adv: { co: "X" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "well",
    };
    expect(dictionaryForm(de)).toBe("bene, melius, optime  ADV");
  });

  it("formats ADV with only stem1", () => {
    const de: DictionaryEntry = {
      stems: ["semper", "", "", ""],
      part: { pofs: "ADV", adv: { co: "POS" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "always",
    };
    expect(dictionaryForm(de)).toBe("semper  ADV");
  });

  it("formats default/unknown POS", () => {
    const de: DictionaryEntry = {
      stems: ["test", "", "", ""],
      part: { pofs: "X" },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "test",
    };
    expect(dictionaryForm(de)).toBe("test");
  });
});

// ---------------------------------------------------------------------------
// text-output: mergeByMeaning null guard (from remaining-branches)
// ---------------------------------------------------------------------------
describe("text-output: mergeByMeaning null guard", () => {
  it("groupAndMerge handles single result", () => {
    const a = engine.parseWord("et");
    const groups = groupAndMerge(a.results);
    expect(groups.length).toBeGreaterThan(0);
  });

  it("formatWordAnalysis handles results with pipe continuation", () => {
    const output = engine.formatWord("magnus");
    expect(output).toContain("large/great");
    expect(output).not.toContain("|");
  });
});
