import { describe, expect, it } from "vitest";
import { createEngine } from "../../src/node";

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
