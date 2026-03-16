import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createEngine, formatWordAnalysis } from "../../src/node";

/**
 * Tests derived from the original Ada Whitaker's Words test suite.
 * Assertions are based on the expected.txt outputs from the Ada version.
 */

const engine = createEngine();

// ---------------------------------------------------------------------------
// "rem acu tetigisti" — the original smoke test (from test/expected.txt)
// ---------------------------------------------------------------------------

describe("original: rem acu tetigisti", () => {
  // Ada expected output (from test/expected.txt):
  //   r.em                 N      5 1 ACC S F
  //   res, rei  N (5th) F   [XXXAX]
  //   thing; event/affair/business; fact; cause; property; ...
  //
  //   ac.u                 N      4 1 ABL S F
  //   acus, acus  N (4th) F   [XXXBO]
  //   needle, pin; hair-pin; ...
  //   *
  //   tetig.isti           V      3 1 PERF ACTIVE  IND 2 S
  //   tango, tangere, tetigi, tactus  V (3rd)   [XXXAX]
  //   touch, strike; border on, influence; mention;

  it("rem: matches Ada expected inflection and dictionary", () => {
    const output = engine.formatWord("rem");
    expect(output).toContain("r.em");
    expect(output).toContain("N      5 1 ACC S");
    expect(output).toContain("res, rei  N (5th) F");
    expect(output).toContain("[XXXAX]");
    expect(output).toContain("thing; event/affair/business; fact; cause; property");
  });

  it("acu: matches Ada expected inflection and dictionary", () => {
    const output = engine.formatWord("acu");
    expect(output).toContain("ac.u");
    expect(output).toContain("N      4");
    expect(output).toContain("ABL S");
    expect(output).toContain("acus, acus  N (4th) F");
    expect(output).toContain("[XXXBO]");
    expect(output).toContain("needle, pin; hair-pin");
  });

  it("tetigisti: matches Ada expected inflection and dictionary", () => {
    const output = engine.formatWord("tetigisti");
    expect(output).toContain("tetig.isti");
    expect(output).toContain("PERF");
    expect(output).toContain("ACTIVE");
    expect(output).toContain("IND 2 S");
    expect(output).toContain("tango, tangere, tetigi, tactus  V (3rd)");
    expect(output).toContain("[XXXAX]");
    expect(output).toContain("touch, strike; border on, influence; mention");
  });
});

// ---------------------------------------------------------------------------
// 02_ius — "nullius" (from test/02_ius/)
// ---------------------------------------------------------------------------

describe("original: 02_ius (nullius)", () => {
  it("nullius → null.ius ADJ 1 3 GEN S X POS, nullus/nulla/nullum", () => {
    const output = engine.formatWord("nullius");
    expect(output).toContain("null.ius");
    expect(output).toContain("ADJ");
    expect(output).toContain("GEN S");
    expect(output).toContain("no; none, not any");
  });
});

// ---------------------------------------------------------------------------
// 03_qualdupes — "ludica" (from test/03_qualdupes/)
// Exercises suffix stripping: "ic" suffix → "lud" → ludus (N 2nd)
// ---------------------------------------------------------------------------

describe("original: 03_qualdupes (ludica)", () => {
  it("ludica → suffix 'ic' stripped, finds ludus (game, play, sport)", () => {
    const a = engine.parseWord("ludica");
    expect(a.addonResults.length).toBeGreaterThan(0);

    // Should find "ic" suffix matching ludus
    const icResult = a.addonResults.find((r) => r.type === "suffix" && r.addon.fix === "ic");
    expect(icResult).toBeDefined();
    if (icResult) {
      expect(icResult.baseResults.some((r) => r.de.mean.includes("game"))).toBe(true);
    }
  });

  it("formats suffix output with SUFFIX label and dictionary form", () => {
    const output = formatWordAnalysis(engine.parseWord("ludica"));
    expect(output).toContain("ic");
    expect(output).toContain("SUFFIX");
    expect(output).toContain("game");
  });
});

// ---------------------------------------------------------------------------
// 04_english — English-to-Latin (from test/04_english/)
// The Ada version produces dictionary entries for each English word.
// ---------------------------------------------------------------------------

describe("original: 04_english", () => {
  const englishWords = [
    "wild",
    "game",
    "grain",
    "fresh",
    "air",
    "are",
    "fun",
    "free",
    "money",
    "do",
    "be",
    "great",
    "hard",
    "never",
    "say",
    "stop",
  ];

  it("finds Latin entries for common English words", () => {
    for (const word of englishWords) {
      const results = engine.searchEnglish(word);
      expect(results.length, `no results for "${word}"`).toBeGreaterThan(0);
    }
  });

  it("'wild' → ferus (savage) as in Ada expected output", () => {
    const results = engine.searchEnglish("wild");
    expect(results.some((r) => r.de.mean.includes("wild"))).toBe(true);
  });

  it("'game' → ludus (play, sport)", () => {
    const results = engine.searchEnglish("game");
    expect(results.some((r) => r.de.mean.includes("game"))).toBe(true);
  });

  it("'free' → liber (free)", () => {
    const results = engine.searchEnglish("free");
    expect(results.some((r) => r.de.mean.includes("free"))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 01_aeneid — bulk parse (Aeneid Book IV opening, 735 lines)
// Kept as file reading test for broad coverage.
// ---------------------------------------------------------------------------

describe("original: 01_aeneid (bulk coverage)", () => {
  const inputPath = resolve(import.meta.dirname, "../original/aeneid-input.txt");
  const expectedPath = resolve(import.meta.dirname, "../original/aeneid-expected.txt");
  let words: string[];
  let expectedLines: string[];

  try {
    const content = readFileSync(inputPath, "utf-8");
    words = [
      ...new Set(
        content
          .replace(/[^a-zA-Z\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 0)
          .map((w) => w.toLowerCase()),
      ),
    ];
    expectedLines = readFileSync(expectedPath, "utf-8").split("\n");
  } catch {
    words = [];
    expectedLines = [];
  }

  it("parses all Aeneid words without throwing", () => {
    expect(words.length).toBeGreaterThan(100);
    let parsed = 0;
    for (const word of words) {
      const a = engine.parseWord(word);
      if (
        a.results.length > 0 ||
        a.uniqueResults.length > 0 ||
        a.trickResults.length > 0 ||
        a.addonResults.length > 0
      ) {
        parsed++;
      }
    }
    expect(parsed / words.length).toBeGreaterThan(0.7);
  });

  it("formats all Aeneid words without throwing", () => {
    for (const word of words.slice(0, 200)) {
      const output = engine.formatWord(word);
      expect(typeof output).toBe("string");
    }
  });

  it("Ada expected output contains expected dictionary entries", () => {
    // Verify the Ada expected output has key entries we can spot-check
    const joined = expectedLines.join("\n");
    // regina → queen
    expect(joined).toContain("queen");
    // gravi → heavy
    expect(joined).toContain("heavy");
    // saucia → wounded
    expect(joined).toContain("wounded");
    // cura → concern
    expect(joined).toContain("concern");
  });

  it("matches Ada meanings for key Aeneid words", () => {
    // Spot-check that our engine finds the same meanings as the Ada expected output
    const checks: [string, string][] = [
      ["regina", "queen"],
      ["gravi", "heavy"],
      ["saucia", "wounded"],
      ["cura", "concern"],
      ["volnus", "wound"],
      ["igni", "fire"],
      ["virtus", "courage"],
      ["honos", "honor"],
      ["pectore", "breast"],
      ["aurora", "dawn"],
      ["soror", "sister"],
      ["hospes", "guest"],
      ["fides", "faith"],
      ["timor", "fear"],
      ["amor", "love"],
    ];
    for (const [word, meaning] of checks) {
      const output = engine.formatWord(word);
      expect(output, `"${word}" should contain "${meaning}"`).toContain(meaning);
    }
  });
});
