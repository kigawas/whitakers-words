import { describe, expect, it } from "vitest";
import { formatWordAnalysis } from "../../../src/lib/formatter/text-output.js";
import { createEngine } from "../../../src/node/index.js";

const engine = createEngine();

// ---------------------------------------------------------------------------
// Roman numeral detection in engine pipeline
// ---------------------------------------------------------------------------
describe("roman numeral: engine integration", () => {
  it("detects 'i' as roman numeral value 1", () => {
    const a = engine.parseWord("i");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(1);
  });

  it("detects 'v' as roman numeral value 5", () => {
    const a = engine.parseWord("v");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(5);
  });

  it("detects 'x' as roman numeral value 10", () => {
    const a = engine.parseWord("x");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(10);
  });

  it("detects 'di' as roman numeral value 501", () => {
    const a = engine.parseWord("di");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(501);
  });

  it("detects 'xiv' as roman numeral value 14", () => {
    const a = engine.parseWord("xiv");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(14);
  });

  it("detects 'mdclxvi' as roman numeral value 1666", () => {
    const a = engine.parseWord("mdclxvi");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(1666);
  });

  it("does not detect 'aquam' as roman numeral", () => {
    const a = engine.parseWord("aquam");
    expect(a.romanNumeralResult).toBeNull();
  });

  it("does not detect 'et' as roman numeral", () => {
    const a = engine.parseWord("et");
    expect(a.romanNumeralResult).toBeNull();
  });

  it("roman numeral appears alongside other results (not exclusive)", () => {
    const a = engine.parseWord("i");
    // 'i' should have both roman numeral AND other results (pronouns, etc.)
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.results.length).toBeGreaterThan(0);
  });

  it("handles case-insensitive input", () => {
    const lower = engine.parseWord("xiv");
    const upper = engine.parseWord("XIV");
    expect(lower.romanNumeralResult?.value).toBe(upper.romanNumeralResult?.value);
  });
});

// ---------------------------------------------------------------------------
// Roman numeral formatting
// ---------------------------------------------------------------------------
describe("roman numeral: output formatting", () => {
  it("formats 'i' with NUM 2 0 CARD line and meaning", () => {
    const a = engine.parseWord("i");
    const output = formatWordAnalysis(a);
    expect(output).toContain("i                    NUM    2 0 X   X X CARD");
    expect(output).toContain("1  as a ROMAN NUMERAL;");
  });

  it("formats 'di' with value 501", () => {
    const a = engine.parseWord("di");
    const output = formatWordAnalysis(a);
    expect(output).toContain("di                   NUM    2 0 X   X X CARD");
    expect(output).toContain("501  as a ROMAN NUMERAL;");
  });

  it("formats 'v' with value 5", () => {
    const a = engine.parseWord("v");
    const output = formatWordAnalysis(a);
    expect(output).toContain("NUM    2 0 X   X X CARD");
    expect(output).toContain("5  as a ROMAN NUMERAL;");
  });

  it("does not include ROMAN NUMERAL for non-numeral words", () => {
    const a = engine.parseWord("aquam");
    const output = formatWordAnalysis(a);
    expect(output).not.toContain("ROMAN NUMERAL");
  });

  it("roman numeral output uses lowercase word", () => {
    const a = engine.parseWord("XIV");
    const output = formatWordAnalysis(a);
    expect(output).toContain("xiv");
    expect(output).toContain("14  as a ROMAN NUMERAL;");
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe("roman numeral: edge cases", () => {
  it("rejects words with more than 3 identical chars (iiii)", () => {
    const a = engine.parseWord("iiii");
    expect(a.romanNumeralResult).toBeNull();
  });

  it("single character 'c' is detected", () => {
    const a = engine.parseWord("c");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(100);
  });

  it("single character 'm' is detected", () => {
    const a = engine.parseWord("m");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(1000);
  });

  it("'l' is detected as 50", () => {
    const a = engine.parseWord("l");
    expect(a.romanNumeralResult).not.toBeNull();
    expect(a.romanNumeralResult?.value).toBe(50);
  });
});
