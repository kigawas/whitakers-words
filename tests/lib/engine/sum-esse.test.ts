/**
 * Comprehensive tests for sum/esse (to be) — V 5 1.
 *
 * sum/esse is special: its stem2 is blank, meaning forms like "est", "esse",
 * "erat" have the entire word as the inflection ending. This requires the
 * blankStems index in the dictionary. These tests verify every form of sum
 * is found, plus compound verbs (adsum, possum, absum).
 */
import { describe, expect, it } from "vitest";
import { createEngine } from "../../../src/node";

const engine = createEngine();

function hasSumResult(word: string): boolean {
  const a = engine.parseWord(word);
  return a.results.some((r) => r.ir.qual.pofs === "V" && r.de.mean.includes("be; exist"));
}

function findSum(word: string) {
  const a = engine.parseWord(word);
  return a.results.find((r) => r.ir.qual.pofs === "V" && r.de.mean.includes("be; exist"));
}

// ---------------------------------------------------------------------------
// Present indicative active
// ---------------------------------------------------------------------------

describe("sum/esse: present indicative", () => {
  it("sum: 1 S", () => {
    const r = findSum("sum");
    expect(r).toBeDefined();
    expect(r!.ir.qual.verb.person).toBe(1);
    expect(r!.ir.qual.verb.number).toBe("S");
  });

  it("es: 2 S", () => expect(hasSumResult("es")).toBe(true));
  it("est: 3 S", () => expect(hasSumResult("est")).toBe(true));
  it("sumus: 1 P", () => expect(hasSumResult("sumus")).toBe(true));
  it("estis: 2 P", () => expect(hasSumResult("estis")).toBe(true));
  it("sunt: 3 P", () => expect(hasSumResult("sunt")).toBe(true));
});

// ---------------------------------------------------------------------------
// Imperfect indicative active
// ---------------------------------------------------------------------------

describe("sum/esse: imperfect indicative", () => {
  it("eram: 1 S", () => expect(hasSumResult("eram")).toBe(true));
  it("eras: 2 S", () => expect(hasSumResult("eras")).toBe(true));
  it("erat: 3 S", () => expect(hasSumResult("erat")).toBe(true));
  it("eramus: 1 P", () => expect(hasSumResult("eramus")).toBe(true));
  it("eratis: 2 P", () => expect(hasSumResult("eratis")).toBe(true));
  it("erant: 3 P", () => expect(hasSumResult("erant")).toBe(true));
});

// ---------------------------------------------------------------------------
// Future indicative active
// ---------------------------------------------------------------------------

describe("sum/esse: future indicative", () => {
  it("ero: 1 S", () => expect(hasSumResult("ero")).toBe(true));
  it("eris: 2 S", () => expect(hasSumResult("eris")).toBe(true));
  it("erit: 3 S", () => expect(hasSumResult("erit")).toBe(true));
  it("erimus: 1 P", () => expect(hasSumResult("erimus")).toBe(true));
  it("eritis: 2 P", () => expect(hasSumResult("eritis")).toBe(true));
  it("erunt: 3 P", () => expect(hasSumResult("erunt")).toBe(true));
});

// ---------------------------------------------------------------------------
// Present subjunctive active
// ---------------------------------------------------------------------------

describe("sum/esse: present subjunctive", () => {
  it("sim: 1 S", () => expect(hasSumResult("sim")).toBe(true));
  it("sis: 2 S", () => expect(hasSumResult("sis")).toBe(true));
  it("sit: 3 S", () => expect(hasSumResult("sit")).toBe(true));
  it("simus: 1 P", () => expect(hasSumResult("simus")).toBe(true));
  it("sitis: 2 P", () => expect(hasSumResult("sitis")).toBe(true));
  it("sint: 3 P", () => expect(hasSumResult("sint")).toBe(true));
});

// ---------------------------------------------------------------------------
// Imperfect subjunctive active (essem + forem)
// ---------------------------------------------------------------------------

describe("sum/esse: imperfect subjunctive", () => {
  it("essem: 1 S", () => expect(hasSumResult("essem")).toBe(true));
  it("esses: 2 S", () => expect(hasSumResult("esses")).toBe(true));
  it("esset: 3 S", () => expect(hasSumResult("esset")).toBe(true));
  it("essemus: 1 P", () => expect(hasSumResult("essemus")).toBe(true));
  it("essetis: 2 P", () => expect(hasSumResult("essetis")).toBe(true));
  it("essent: 3 P", () => expect(hasSumResult("essent")).toBe(true));

  // Alternate forms (forem)
  it("forem: 1 S (alternate)", () => expect(hasSumResult("forem")).toBe(true));
  it("fores: 2 S (alternate)", () => expect(hasSumResult("fores")).toBe(true));
  it("foret: 3 S (alternate)", () => expect(hasSumResult("foret")).toBe(true));
  it("forent: 3 P (alternate)", () => expect(hasSumResult("forent")).toBe(true));
});

// ---------------------------------------------------------------------------
// Infinitive and participle
// ---------------------------------------------------------------------------

describe("sum/esse: infinitive and participle", () => {
  it("esse: present active infinitive", () => {
    const r = findSum("esse");
    expect(r).toBeDefined();
    expect(r!.ir.qual.verb.tenseVoiceMood.mood).toBe("INF");
  });

  it("fuisse: perfect active infinitive", () => expect(hasSumResult("fuisse")).toBe(true));

  it("futurus: future active participle", () => {
    const a = engine.parseWord("futurus");
    const vpar = a.results.find(
      (r) => r.ir.qual.pofs === "VPAR" && r.de.mean.includes("be; exist"),
    );
    expect(vpar).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Perfect system (stem3 = fu)
// ---------------------------------------------------------------------------

describe("sum/esse: perfect system", () => {
  it("fui: PERF 1 S", () => expect(hasSumResult("fui")).toBe(true));
  it("fuisti: PERF 2 S", () => expect(hasSumResult("fuisti")).toBe(true));
  it("fuit: PERF 3 S", () => expect(hasSumResult("fuit")).toBe(true));
  it("fuimus: PERF 1 P", () => expect(hasSumResult("fuimus")).toBe(true));
  it("fuistis: PERF 2 P", () => expect(hasSumResult("fuistis")).toBe(true));
  it("fuerunt: PERF 3 P", () => expect(hasSumResult("fuerunt")).toBe(true));

  it("fueram: PLUP 3 S", () => expect(hasSumResult("fueram")).toBe(true));
  it("fuerat: PLUP 3 S", () => expect(hasSumResult("fuerat")).toBe(true));
  it("fuerant: PLUP 3 P", () => expect(hasSumResult("fuerant")).toBe(true));

  it("fuero: FUTP 1 S", () => expect(hasSumResult("fuero")).toBe(true));
  it("fuerit: FUTP 3 S", () => expect(hasSumResult("fuerit")).toBe(true));
  it("fuerint: FUTP 3 P", () => expect(hasSumResult("fuerint")).toBe(true));

  it("fuerim: PERF SUB 1 S", () => expect(hasSumResult("fuerim")).toBe(true));
  it("fueris: PERF SUB 2 S", () => expect(hasSumResult("fueris")).toBe(true));
  it("fuerint: PERF SUB 3 P", () => expect(hasSumResult("fuerint")).toBe(true));
});

// ---------------------------------------------------------------------------
// Compound verbs (V 5 1 — adsum, absum, possum)
// ---------------------------------------------------------------------------

describe("sum/esse: compound verbs", () => {
  function hasCompound(word: string, meanFragment: string): boolean {
    const a = engine.parseWord(word);
    return a.results.some((r) => r.ir.qual.pofs === "V" && r.de.mean.includes(meanFragment));
  }

  it("adest: adsum (be present)", () => expect(hasCompound("adest", "present")).toBe(true));
  it("adesse: adsum infinitive", () => expect(hasCompound("adesse", "present")).toBe(true));
  it("adfui: adsum perfect", () => expect(hasCompound("adfui", "present")).toBe(true));

  it("abest: absum (be absent)", () => expect(hasCompound("abest", "absent")).toBe(true));
  it("abesse: absum infinitive", () => expect(hasCompound("abesse", "absent")).toBe(true));

  it("possum: possum (be able)", () => expect(hasCompound("possum", "able")).toBe(true));
  it("potest: possum 3 S", () => expect(hasCompound("potest", "able")).toBe(true));
  it("potuit: possum perfect", () => expect(hasCompound("potuit", "able")).toBe(true));
});

// ---------------------------------------------------------------------------
// Dictionary form and output
// ---------------------------------------------------------------------------

describe("sum/esse: dictionary form", () => {
  it("dict form: 'sum, esse, fui, futurus'", () => {
    const output = engine.formatWord("est");
    expect(output).toContain("sum, esse, fui, futurus");
  });

  it("shows V (5th) TO_BE", () => {
    const output = engine.formatWord("est");
    expect(output).toContain("V (5th) TO_BE");
  });
});

// ---------------------------------------------------------------------------
// No false positives from blankStems
// ---------------------------------------------------------------------------

describe("sum/esse: no blankStems false positives", () => {
  it("'a' does not match sum/esse", () => {
    const a = engine.parseWord("a");
    const sum = a.results.filter((r) => r.de.mean.includes("be; exist"));
    expect(sum.length).toBe(0);
  });

  it("'e' does not match sum/esse via blank stem", () => {
    const a = engine.parseWord("e");
    const sum = a.results.filter((r) => r.de.mean.includes("be; exist"));
    expect(sum.length).toBe(0);
  });
});
