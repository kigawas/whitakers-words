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
// Standard subtractive pairs
// ---------------------------------------------------------------------------
describe("roman numeral: subtractive pairs", () => {
  it("iv = 4", () => {
    expect(engine.parseWord("iv").romanNumeralResult?.value).toBe(4);
  });
  it("ix = 9", () => {
    expect(engine.parseWord("ix").romanNumeralResult?.value).toBe(9);
  });
  it("xl = 40", () => {
    expect(engine.parseWord("xl").romanNumeralResult?.value).toBe(40);
  });
  it("xc = 90", () => {
    expect(engine.parseWord("xc").romanNumeralResult?.value).toBe(90);
  });
  it("cd = 400", () => {
    expect(engine.parseWord("cd").romanNumeralResult?.value).toBe(400);
  });
  it("cm = 900", () => {
    expect(engine.parseWord("cm").romanNumeralResult?.value).toBe(900);
  });
  it("mcmxcix = 1999", () => {
    expect(engine.parseWord("mcmxcix").romanNumeralResult?.value).toBe(1999);
  });
  it("cdxliv = 444", () => {
    expect(engine.parseWord("cdxliv").romanNumeralResult?.value).toBe(444);
  });
  it("MMMCMXCIX = 3999 (max standard numeral)", () => {
    expect(engine.parseWord("MMMCMXCIX").romanNumeralResult?.value).toBe(3999);
  });
});

// ---------------------------------------------------------------------------
// Invalid subtractive pairs — must be rejected
// ---------------------------------------------------------------------------
describe("roman numeral: invalid subtractive pairs rejected", () => {
  it("im is not valid (I before M)", () => {
    expect(engine.parseWord("im").romanNumeralResult).toBeNull();
  });
  it("ic is not valid (I before C)", () => {
    expect(engine.parseWord("ic").romanNumeralResult).toBeNull();
  });
  it("il is not valid (I before L)", () => {
    expect(engine.parseWord("il").romanNumeralResult).toBeNull();
  });
  it("id is not valid (I before D)", () => {
    expect(engine.parseWord("id").romanNumeralResult).toBeNull();
  });
  it("xm is not valid (X before M)", () => {
    expect(engine.parseWord("xm").romanNumeralResult).toBeNull();
  });
  it("xd is not valid (X before D)", () => {
    expect(engine.parseWord("xd").romanNumeralResult).toBeNull();
  });
  it("dm is not valid (D before M as subtractive)", () => {
    expect(engine.parseWord("dm").romanNumeralResult).toBeNull();
  });
  it("lc is not valid (L before C as subtractive)", () => {
    expect(engine.parseWord("lc").romanNumeralResult).toBeNull();
  });
  it("imi is not valid", () => {
    expect(engine.parseWord("imi").romanNumeralResult).toBeNull();
  });
  it("ixi is not valid (subtractive pair followed by same denomination)", () => {
    expect(engine.parseWord("ixi").romanNumeralResult).toBeNull();
  });
  it("vx is not valid (V before X)", () => {
    expect(engine.parseWord("vx").romanNumeralResult).toBeNull();
  });
  it("vv is not valid (V cannot repeat)", () => {
    expect(engine.parseWord("vv").romanNumeralResult).toBeNull();
  });
  it("ll is not valid (L cannot repeat)", () => {
    expect(engine.parseWord("ll").romanNumeralResult).toBeNull();
  });
  it("dd is not valid (D cannot repeat)", () => {
    expect(engine.parseWord("dd").romanNumeralResult).toBeNull();
  });
  it("lm is not valid (L before M)", () => {
    expect(engine.parseWord("lm").romanNumeralResult).toBeNull();
  });
  it("mix = 1009 (M + IX is valid)", () => {
    expect(engine.parseWord("mix").romanNumeralResult?.value).toBe(1009);
  });
  it("cdc is not valid", () => {
    expect(engine.parseWord("cdc").romanNumeralResult).toBeNull();
  });
  it("xcx is not valid", () => {
    expect(engine.parseWord("xcx").romanNumeralResult).toBeNull();
  });
  it("ivi is not valid", () => {
    expect(engine.parseWord("ivi").romanNumeralResult).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Edge cases and repetition rules
// ---------------------------------------------------------------------------
describe("roman numeral: edge cases", () => {
  it("rejects words with more than 3 identical chars (iiii)", () => {
    const a = engine.parseWord("iiii");
    expect(a.romanNumeralResult).toBeNull();
  });

  it("iii = 3 (max allowed repetition)", () => {
    expect(engine.parseWord("iii").romanNumeralResult?.value).toBe(3);
  });

  it("xxx = 30", () => {
    expect(engine.parseWord("xxx").romanNumeralResult?.value).toBe(30);
  });

  it("ccc = 300", () => {
    expect(engine.parseWord("ccc").romanNumeralResult?.value).toBe(300);
  });

  it("mmm = 3000", () => {
    expect(engine.parseWord("mmm").romanNumeralResult?.value).toBe(3000);
  });

  it("mmmm is rejected (4 M's)", () => {
    expect(engine.parseWord("mmmm").romanNumeralResult).toBeNull();
  });

  it("xxxx is rejected (4 X's)", () => {
    expect(engine.parseWord("xxxx").romanNumeralResult).toBeNull();
  });

  it("single character 'c' is detected as 100", () => {
    expect(engine.parseWord("c").romanNumeralResult?.value).toBe(100);
  });

  it("single character 'm' is detected as 1000", () => {
    expect(engine.parseWord("m").romanNumeralResult?.value).toBe(1000);
  });

  it("'l' is detected as 50", () => {
    expect(engine.parseWord("l").romanNumeralResult?.value).toBe(50);
  });

  it("'d' is detected as 500", () => {
    expect(engine.parseWord("d").romanNumeralResult?.value).toBe(500);
  });

  it("empty string is not detected", () => {
    expect(engine.parseWord("").romanNumeralResult).toBeNull();
  });

  it("non-numeral characters rejected", () => {
    expect(engine.parseWord("abc").romanNumeralResult).toBeNull();
    expect(engine.parseWord("rex").romanNumeralResult).toBeNull();
  });

  it("complex valid: mmmdccclxxxviii = 3888", () => {
    expect(engine.parseWord("mmmdccclxxxviii").romanNumeralResult?.value).toBe(3888);
  });

  it("mixed valid: xlii = 42", () => {
    expect(engine.parseWord("xlii").romanNumeralResult?.value).toBe(42);
  });
});
