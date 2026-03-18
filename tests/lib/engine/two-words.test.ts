/**
 * Tests for two-word splitting — the final fallback when all other parsing
 * methods fail. The engine tries splitting the input at every position into
 * two parts, analyzing each independently.
 */
import { describe, expect, it } from "vitest";
import { createEngine } from "../../../src/node";

const engine = createEngine();

// ---------------------------------------------------------------------------
// Two-word splitting: successful splits
// ---------------------------------------------------------------------------

describe("two-words: successful splits", () => {
  it("reginapater splits into regina + pater", () => {
    const a = engine.parseWord("reginapater");
    expect(a.twoWordResult).not.toBeNull();
    expect(a.twoWordResult!.left).toBe("regina");
    expect(a.twoWordResult!.right).toBe("pater");
  });

  it("bonummalum splits into bonum + malum", () => {
    const a = engine.parseWord("bonummalum");
    expect(a.twoWordResult).not.toBeNull();
    expect(a.twoWordResult!.left).toBe("bonum");
    expect(a.twoWordResult!.right).toBe("malum");
  });

  it("estbonus splits into est + bonus", () => {
    const a = engine.parseWord("estbonus");
    expect(a.twoWordResult).not.toBeNull();
    expect(a.twoWordResult!.left).toBe("est");
    expect(a.twoWordResult!.right).toBe("bonus");
  });

  it("suntboni splits into sunt + boni", () => {
    const a = engine.parseWord("suntboni");
    expect(a.twoWordResult).not.toBeNull();
    expect(a.twoWordResult!.left).toBe("sunt");
    expect(a.twoWordResult!.right).toBe("boni");
  });

  it("split result has label and explanation", () => {
    const a = engine.parseWord("reginapater");
    expect(a.twoWordResult!.label).toBe("Two words");
    expect(a.twoWordResult!.explanation).toContain("regina+pater");
    expect(a.twoWordResult!.explanation).toContain("probably incorrect");
  });

  it("split produces left and right parse results", () => {
    const a = engine.parseWord("reginapater");
    const tw = a.twoWordResult!;
    expect(tw.leftResults.some((r) => r.ir.qual.pofs === "N")).toBe(true);
    expect(tw.rightResults.some((r) => r.ir.qual.pofs === "N")).toBe(true);
  });

  it("left results contain meaningful parses", () => {
    const a = engine.parseWord("bonummalum");
    const tw = a.twoWordResult!;
    const leftMean = tw.leftResults.find((r) => r.de.mean.includes("good"));
    expect(leftMean).toBeDefined();
  });

  it("right results contain meaningful parses", () => {
    const a = engine.parseWord("bonummalum");
    const tw = a.twoWordResult!;
    const rightMean = tw.rightResults.find(
      (r) => r.de.mean.includes("apple") || r.de.mean.includes("evil") || r.de.mean.includes("bad"),
    );
    expect(rightMean).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Two-word splitting: should NOT fire when other methods succeed
// ---------------------------------------------------------------------------

describe("two-words: does not fire when other methods succeed", () => {
  it("standard word: regina (direct match)", () => {
    const a = engine.parseWord("regina");
    expect(a.twoWordResult).toBeNull();
    expect(a.results.length).toBeGreaterThan(0);
  });

  it("standard word: aquam (direct match)", () => {
    const a = engine.parseWord("aquam");
    expect(a.twoWordResult).toBeNull();
  });

  it("tackon: amorne (-ne enclitic)", () => {
    const a = engine.parseWord("amorne");
    expect(a.twoWordResult).toBeNull();
    expect(a.addonResults.length).toBeGreaterThan(0);
  });

  it("tackon: aquamque (-que enclitic)", () => {
    const a = engine.parseWord("aquamque");
    expect(a.twoWordResult).toBeNull();
    expect(a.addonResults.length).toBeGreaterThan(0);
  });

  it("prefix: inimicus (in- prefix)", () => {
    const a = engine.parseWord("inimicus");
    expect(a.twoWordResult).toBeNull();
  });

  it("standard word: antiquarum (not split)", () => {
    const a = engine.parseWord("antiquarum");
    expect(a.twoWordResult).toBeNull();
    expect(a.results.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Two-word splitting: no split possible
// ---------------------------------------------------------------------------

describe("two-words: no split possible", () => {
  it("nonsense word: xxxx", () => {
    const a = engine.parseWord("xxxx");
    expect(a.twoWordResult).toBeNull();
  });

  it("nonsense word: zzzzz", () => {
    const a = engine.parseWord("zzzzz");
    expect(a.twoWordResult).toBeNull();
  });

  it("too short: ab is a valid preposition, not split", () => {
    const a = engine.parseWord("ab");
    expect(a.results.length).toBeGreaterThan(0);
    expect(a.twoWordResult).toBeNull();
  });

  it("single char: a cannot be split", () => {
    const a = engine.parseWord("a");
    expect(a.twoWordResult).toBeNull();
  });

  it("three chars: rex has direct results, not split", () => {
    const a = engine.parseWord("rex");
    expect(a.results.length).toBeGreaterThan(0);
    expect(a.twoWordResult).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Two-word splitting: split position and constraints
// ---------------------------------------------------------------------------

describe("two-words: split position", () => {
  it("picks earliest valid split", () => {
    const a = engine.parseWord("estbonus");
    expect(a.twoWordResult).not.toBeNull();
    // "est" (3 chars) is the earliest left part where both sides parse
    expect(a.twoWordResult!.left).toBe("est");
    expect(a.twoWordResult!.right).toBe("bonus");
  });

  it("each part is at least 2 chars", () => {
    const a = engine.parseWord("estbonus");
    const tw = a.twoWordResult!;
    expect(tw.left.length).toBeGreaterThanOrEqual(2);
    expect(tw.right.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Two-word splitting: formatted output
// ---------------------------------------------------------------------------

describe("two-words: formatted output", () => {
  it("output includes 'Two words' label", () => {
    const output = engine.formatWord("reginapater");
    expect(output).toContain("Two words");
  });

  it("output includes split explanation with parts", () => {
    const output = engine.formatWord("reginapater");
    expect(output).toContain("regina+pater");
  });

  it("output includes right word dictionary info", () => {
    const output = engine.formatWord("reginapater");
    expect(output).toContain("father");
  });

  it("output includes left word dictionary info", () => {
    const output = engine.formatWord("reginapater");
    expect(output).toContain("queen");
  });
});
