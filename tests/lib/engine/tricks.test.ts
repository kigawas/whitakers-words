import { describe, expect, it } from "vitest";
import { isRomanNumeral, parseRomanNumeral } from "../../../src/lib/engine/roman-numerals.js";
import {
  applyTrick,
  applyTricks,
  getMedievalTricks,
  getTricksForWord,
  type Trick,
  trickAnnotation,
} from "../../../src/lib/engine/tricks.js";
import { createEngine } from "../../../src/node/index.js";

// ---------------------------------------------------------------------------
// Tricks
// ---------------------------------------------------------------------------

describe("applyTrick", () => {
  it("flip: replaces old at start with new", () => {
    const trick: Trick = { old: "ae", new: "e", op: "flip" };
    expect(applyTrick("aequus", trick)).toEqual(["equus"]);
  });

  it("flip: returns empty if pattern not at start", () => {
    const trick: Trick = { old: "ae", new: "e", op: "flip" };
    expect(applyTrick("praeda", trick)).toEqual([]);
  });

  it("flip_flop: tries both directions", () => {
    const trick: Trick = { old: "adgn", new: "agn", op: "flip_flop" };
    // old -> new
    expect(applyTrick("adgnosco", trick)).toEqual(["agnosco"]);
    // new -> old
    expect(applyTrick("agnosco", trick)).toEqual(["adgnosco"]);
  });

  it("flip_flop: returns empty when neither direction matches", () => {
    const trick: Trick = { old: "adgn", new: "agn", op: "flip_flop" };
    expect(applyTrick("bellum", trick)).toEqual([]);
  });

  it("internal: replaces each occurrence individually", () => {
    const trick: Trick = { old: "ae", new: "e", op: "internal" };
    expect(applyTrick("praedae", trick)).toEqual(["predae", "praede"]);
  });

  it("internal: returns empty if pattern not found", () => {
    const trick: Trick = { old: "ph", new: "f", op: "internal" };
    expect(applyTrick("bellum", trick)).toEqual([]);
  });
});

describe("getTricksForWord", () => {
  it("returns empty array for empty string", () => {
    expect(getTricksForWord("")).toEqual([]);
  });

  it("includes character-specific tricks for 'a' words", () => {
    const tricks = getTricksForWord("adgnoscere");
    const hasAdgn = tricks.some((t) => t.old === "adgn" && t.new === "agn");
    expect(hasAdgn).toBe(true);
  });

  it("includes ANY_TRICKS for all words", () => {
    const tricks = getTricksForWord("bellum");
    // ANY_TRICKS includes ae->e internal
    const hasAeToE = tricks.some((t) => t.old === "ae" && t.new === "e" && t.op === "internal");
    expect(hasAeToE).toBe(true);
  });

  it("returns only ANY_TRICKS when no char-specific tricks exist", () => {
    // 'b' has no char-specific tricks in CHAR_TRICKS
    const tricks = getTricksForWord("bellum");
    // All tricks should be from ANY_TRICKS (internal ops)
    const nonInternalTricks = tricks.filter((t) => t.op !== "internal");
    expect(nonInternalTricks).toEqual([]);
  });

  it("returns tricks for 'p' words", () => {
    const tricks = getTricksForWord("philosophia");
    const hasPhToF = tricks.some((t) => t.old === "ph" && t.new === "f" && t.op === "flip");
    expect(hasPhToF).toBe(true);
  });
});

describe("getMedievalTricks", () => {
  it("returns a non-empty array of tricks", () => {
    const tricks = getMedievalTricks();
    expect(tricks.length).toBeGreaterThan(0);
  });

  it("all tricks are internal operations", () => {
    const tricks = getMedievalTricks();
    for (const t of tricks) {
      expect(t.op).toBe("internal");
    }
  });
});

// ---------------------------------------------------------------------------
// Roman Numerals
// ---------------------------------------------------------------------------

describe("isRomanNumeral", () => {
  it("returns true for valid roman characters", () => {
    expect(isRomanNumeral("XIV")).toBe(true);
    expect(isRomanNumeral("MCMXCIV")).toBe(true);
    expect(isRomanNumeral("I")).toBe(true);
  });

  it("returns false for empty string", () => {
    expect(isRomanNumeral("")).toBe(false);
  });

  it("returns false for non-roman characters", () => {
    expect(isRomanNumeral("ABC")).toBe(false);
    expect(isRomanNumeral("hello")).toBe(false);
  });
});

describe("parseRomanNumeral", () => {
  it("parses simple numerals", () => {
    expect(parseRomanNumeral("I")).toBe(1);
    expect(parseRomanNumeral("V")).toBe(5);
    expect(parseRomanNumeral("X")).toBe(10);
  });

  it("parses VIII = 8", () => {
    expect(parseRomanNumeral("VIII")).toBe(8);
  });

  it("parses XIV = 14", () => {
    expect(parseRomanNumeral("XIV")).toBe(14);
  });

  it("parses MCMXCIV = 1994", () => {
    expect(parseRomanNumeral("MCMXCIV")).toBe(1994);
  });

  it("parses MMXXVI = 2026", () => {
    expect(parseRomanNumeral("MMXXVI")).toBe(2026);
  });

  it("rejects IIII (more than 3 identical in sequence)", () => {
    expect(parseRomanNumeral("IIII")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseRomanNumeral("")).toBeNull();
  });

  it("returns null for non-roman characters", () => {
    expect(parseRomanNumeral("ABC")).toBeNull();
  });

  it("rejects invalid subtractive usage (e.g. VX)", () => {
    // V cannot be subtractive
    expect(parseRomanNumeral("VX")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// tricks: edge cases (from branch-coverage)
// ---------------------------------------------------------------------------
describe("tricks: edge cases", () => {
  it("getTricksForWord returns empty for empty string", () => {
    expect(getTricksForWord("")).toHaveLength(0);
  });

  it("applyTricks returns TrickResult array", () => {
    const results = applyTricks("aqua");
    expect(Array.isArray(results)).toBe(true);
  });

  it("applyTricks applies word-initial tricks", () => {
    const results = applyTricks("aequus");
    expect(Array.isArray(results)).toBe(true);
    const equus = results.find((r) => r.word === "equus");
    expect(equus).toBeDefined();
    expect(equus?.trick.op).toBe("flip");
  });
});

// ---------------------------------------------------------------------------
// applyTricks: identity transformation filter (from remaining-branches)
// ---------------------------------------------------------------------------
describe("applyTricks: identity transformation filter", () => {
  it("does not include identity transformations in results", () => {
    const results = applyTricks("aqua");
    for (const r of results) {
      expect(r.word).not.toBe("aqua");
    }
  });

  it("handles word with no applicable tricks", () => {
    const results = applyTricks("z");
    for (const r of results) {
      expect(r.word).not.toBe("z");
    }
  });
});

// ---------------------------------------------------------------------------
// trickAnnotation: Ada-style annotation lines
// ---------------------------------------------------------------------------
describe("trickAnnotation", () => {
  it("generates annotation for flip trick", () => {
    const trick: Trick = { old: "ham", new: "am", op: "flip" };
    const lines = trickAnnotation(trick);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Word mod ham/am");
    expect(lines[1]).toContain("An initial 'ham'");
    expect(lines[1]).toContain("'am'");
  });

  it("generates annotation for flip_flop trick", () => {
    const trick: Trick = { old: "pre", new: "prae", op: "flip_flop" };
    const lines = trickAnnotation(trick);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("Slur");
    expect(lines[0]).toContain("pre/prae");
  });

  it("generates annotation for internal trick", () => {
    const trick: Trick = { old: "ae", new: "e", op: "internal" };
    const lines = trickAnnotation(trick);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Word mod ae/e");
    expect(lines[1]).toContain("An internal 'ae'");
    expect(lines[1]).toContain("'e'");
  });

  it("generates annotation for double_consonant trick", () => {
    const trick: Trick = { old: "r", new: "rr", op: "double_consonant" };
    const lines = trickAnnotation(trick);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe("Word mod r -> rr");
    expect(lines[1]).toContain("doubled consonant");
    expect(lines[1]).toContain("MEDIEVAL");
  });
});

// ---------------------------------------------------------------------------
// Medieval double-consonant trick
// ---------------------------------------------------------------------------
describe("double consonant medieval trick", () => {
  it("iritata → irritata via doubling r", () => {
    const results = applyTricks("iritata");
    const doubled = results.find((r) => r.word === "irritata");
    expect(doubled).toBeDefined();
    expect(doubled?.trick.op).toBe("double_consonant");
    expect(doubled?.trick.old).toBe("r");
    expect(doubled?.trick.new).toBe("rr");
  });

  it("does not double vowels", () => {
    const results = applyTricks("aaa");
    const dbl = results.filter((r) => r.trick.op === "double_consonant");
    expect(dbl).toHaveLength(0);
  });

  it("engine: iritata produces trick results with correct annotation", () => {
    const engine = createEngine();
    const a = engine.parseWord("iritata");
    expect(a.trickResults.length).toBeGreaterThan(0);
    expect(a.trickAnnotations[0]).toBe("Word mod r -> rr");

    const output = engine.formatWord("iritata");
    expect(output).toContain("Word mod r -> rr");
    expect(output).toContain("irrito");
  });
});

// ---------------------------------------------------------------------------
// Engine integration: trick annotations in formatted output
// ---------------------------------------------------------------------------
describe("trick annotations in engine output", () => {
  it("hamavit shows flip trick annotation for ham→am", () => {
    const engine = createEngine();
    const a = engine.parseWord("hamavit");
    expect(a.trickResults.length).toBeGreaterThan(0);
    expect(a.trickResults.length).toBeGreaterThan(0);
    expect(a.trickAnnotations).toHaveLength(2);
    expect(a.trickAnnotations[0]).toBe("Word mod ham/am");

    const output = engine.formatWord("hamavit");
    expect(output).toContain("Word mod ham/am");
    expect(output).toContain("amo");
  });

  it("predam shows flip_flop trick annotation for pre→prae", () => {
    const engine = createEngine();
    const a = engine.parseWord("predam");
    expect(a.trickResults.length).toBeGreaterThan(0);
    expect(a.trickAnnotations[0]).toContain("Slur");

    const output = engine.formatWord("predam");
    expect(output).toContain("Slur");
    expect(output).toContain("praed");
  });

  it("no trick annotations when word parses directly", () => {
    const engine = createEngine();
    const a = engine.parseWord("aquam");
    expect(a.trickResults.length).toBe(0);
  });
});
