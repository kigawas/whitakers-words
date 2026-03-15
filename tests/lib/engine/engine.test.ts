import { describe, expect, it } from "vitest";
import { buildEnglishIndex, searchEnglish } from "../../../src/lib/engine/english-search.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";
import { createEngine } from "../../../src/node";

describe("WordsEngine", () => {
  const engine = createEngine();

  it("reports data sizes", () => {
    expect(engine.dictionarySize).toBeGreaterThan(39000);
    expect(engine.inflectionCount).toBeGreaterThan(1700);
    expect(engine.uniqueCount).toBeGreaterThan(70);
  });

  it("has addons data", () => {
    expect(engine.addons.prefixes.length).toBeGreaterThan(50);
    expect(engine.addons.suffixes.length).toBeGreaterThan(80);
    expect(engine.addons.tackons.length).toBeGreaterThan(5);
  });

  it("parses 'aquam' as water", () => {
    const analysis = engine.parseWord("aquam");
    expect(analysis.word).toBe("aquam");
    expect(analysis.results.length).toBeGreaterThan(0);

    const waterResult = analysis.results.find((r) => r.de.mean.includes("water"));
    expect(waterResult).toBeDefined();
  });

  it("finds unique entries for 'memento'", () => {
    const analysis = engine.parseWord("memento");
    expect(analysis.uniqueResults.length).toBeGreaterThan(0);
    expect(analysis.uniqueResults[0]?.de.mean).toContain("remember");
  });

  it("handles case-insensitive input", () => {
    const lower = engine.parseWord("aquam");
    const upper = engine.parseWord("AQUAM");
    expect(lower.results.length).toBe(upper.results.length);
  });
});

const engine = createEngine();

// ---------------------------------------------------------------------------
// engine: edge cases (from branch-coverage)
// ---------------------------------------------------------------------------
describe("engine: edge cases", () => {
  it("handles word with v/j normalization", () => {
    const a = engine.parseWord("juvenis");
    expect(a.results.length + a.trickResults.length + a.addonResults.length).toBeGreaterThan(0);
  });

  it("formatWord returns non-empty for common words", () => {
    expect(engine.formatWord("aquam").length).toBeGreaterThan(0);
    expect(engine.formatWord("est").length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// English search edge cases (from engine-coverage)
// ---------------------------------------------------------------------------
describe("English search edge cases", () => {
  it("returns empty for word not in index", () => {
    expect(engine.searchEnglish("xyzzyplugh")).toHaveLength(0);
  });

  it("returns results for common word", () => {
    expect(engine.searchEnglish("water").length).toBeGreaterThan(0);
  });

  it("respects maxResults limit", () => {
    expect(engine.searchEnglish("be", 2).length).toBeLessThanOrEqual(2);
  });

  it("deduplicates by entry index", () => {
    const results = engine.searchEnglish("love");
    const indices = results.map((r) => r.entryIndex);
    expect(indices.length).toBe(new Set(indices).size);
  });

  it("handles whitespace in input", () => {
    expect(engine.searchEnglish("  water  ").length).toBeGreaterThan(0);
  });

  it("handles single-character search", () => {
    expect(Array.isArray(engine.searchEnglish("a"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// english-search: buildEnglishIndex edge cases (from remaining-branches)
// ---------------------------------------------------------------------------
describe("english-search: buildEnglishIndex edge cases", () => {
  it("skips single-char English words in meaning (line 63)", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["test", "", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "M", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "I a x be do go",
      },
    ];
    const index = buildEnglishIndex(entries);
    expect(searchEnglish(index, "I")).toHaveLength(0);
    expect(searchEnglish(index, "a")).toHaveLength(0);
    expect(searchEnglish(index, "x")).toHaveLength(0);
    expect(searchEnglish(index, "be")).toHaveLength(1);
    expect(searchEnglish(index, "do")).toHaveLength(1);
    expect(searchEnglish(index, "go")).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// buildEnglishIndex: defensive branches (from defensive-branches)
// ---------------------------------------------------------------------------
describe("buildEnglishIndex: defensive branches", () => {
  it("skips entries with empty meaning", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["test", "", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "M", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "",
      },
      {
        stems: ["aqua", "", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "water supply",
      },
    ];
    const index = buildEnglishIndex(entries);
    const results = searchEnglish(index, "water");
    expect(results.length).toBe(1);
    const testResults = searchEnglish(index, "test");
    expect(testResults.length).toBe(0);
  });

  it("skips single-character words during indexing", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["x", "", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "M", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "a b c test",
      },
    ];
    const index = buildEnglishIndex(entries);
    expect(searchEnglish(index, "a")).toHaveLength(0);
    expect(searchEnglish(index, "test")).toHaveLength(1);
  });

  it("deduplicates words within same entry", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["aqua", "", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
        mean: "water water water",
      },
    ];
    const index = buildEnglishIndex(entries);
    const results = searchEnglish(index, "water");
    expect(results).toHaveLength(1);
  });

  it("searchEnglish returns empty for unknown word", () => {
    const index = buildEnglishIndex([]);
    expect(searchEnglish(index, "nonexistent")).toHaveLength(0);
  });

  it("searchEnglish respects maxResults", () => {
    const entries: DictionaryEntry[] = [];
    for (let i = 0; i < 10; i++) {
      entries.push({
        stems: [`word${i}`, "", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "M", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
        mean: "hello world",
      });
    }
    const index = buildEnglishIndex(entries);
    const results = searchEnglish(index, "hello", 3);
    expect(results).toHaveLength(3);
  });

  it("searchEnglish deduplicates entries", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["test", "", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "M", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
        mean: "water water water water water",
      },
    ];
    const index = buildEnglishIndex(entries);
    const results = searchEnglish(index, "water");
    expect(results).toHaveLength(1);
  });

  it("searchEnglish handles entry with parenthetical and bracket removal", () => {
    const entries: DictionaryEntry[] = [
      {
        stems: ["test", "", "", ""],
        part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "M", kind: "T" } },
        tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
        mean: "hello (greeting) [formal]; world/earth",
      },
    ];
    const index = buildEnglishIndex(entries);
    expect(searchEnglish(index, "hello")).toHaveLength(1);
    expect(searchEnglish(index, "greeting")).toHaveLength(0);
    expect(searchEnglish(index, "formal")).toHaveLength(0);
    expect(searchEnglish(index, "world")).toHaveLength(1);
    expect(searchEnglish(index, "earth")).toHaveLength(1);
  });
});
