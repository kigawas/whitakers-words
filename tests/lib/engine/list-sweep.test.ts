import { describe, expect, it } from "vitest";
import { filterByPOS, listSweep, rank } from "../../../src/lib/engine/list-sweep.js";
import type { ParseResult } from "../../../src/lib/engine/word-analysis.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";
import { createEngine } from "../../../src/node/index.js";

const engine = createEngine();

// ---------------------------------------------------------------------------
// Preposition inflection filtering
// ---------------------------------------------------------------------------
describe("listSweep: preposition case filtering", () => {
  it("ab — only shows ABL inflection (not GEN/ACC)", () => {
    const a = engine.parseWord("ab");
    const prepResults = a.results.filter((r) => r.ir.qual.pofs === "PREP");
    expect(prepResults).toHaveLength(1);
    expect(prepResults[0]?.ir.qual.prep.cs).toBe("ABL");
  });

  it("in — shows ACC inflection (for in + ACC meaning)", () => {
    const a = engine.parseWord("in");
    const prepResults = a.results.filter((r) => r.ir.qual.pofs === "PREP");
    // 'in' takes both ACC and ABL, but each entry should match its dict obj
    expect(prepResults.length).toBeGreaterThan(0);
    for (const r of prepResults) {
      if (r.de.part.pofs === "PREP") {
        expect(r.ir.qual.prep.cs).toBe(r.de.part.prep.obj);
      }
    }
  });

  it("ex — only shows ABL inflection", () => {
    const a = engine.parseWord("ex");
    const prepResults = a.results.filter((r) => r.ir.qual.pofs === "PREP");
    for (const r of prepResults) {
      if (r.de.part.pofs === "PREP") {
        expect(r.ir.qual.prep.cs).toBe(r.de.part.prep.obj);
      }
    }
  });

  it("ad — only shows ACC inflection", () => {
    const a = engine.parseWord("ad");
    const prepResults = a.results.filter((r) => r.ir.qual.pofs === "PREP");
    for (const r of prepResults) {
      if (r.de.part.pofs === "PREP") {
        expect(r.ir.qual.prep.cs).toBe("ACC");
      }
    }
  });

  it("cum — only shows ABL inflection", () => {
    const a = engine.parseWord("cum");
    const prepResults = a.results.filter((r) => r.ir.qual.pofs === "PREP");
    for (const r of prepResults) {
      if (r.de.part.pofs === "PREP") {
        expect(r.ir.qual.prep.cs).toBe("ABL");
      }
    }
  });

  it("per — only shows ACC inflection", () => {
    const a = engine.parseWord("per");
    const prepResults = a.results.filter((r) => r.ir.qual.pofs === "PREP");
    for (const r of prepResults) {
      if (r.de.part.pofs === "PREP") {
        expect(r.ir.qual.prep.cs).toBe("ACC");
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Preposition formatted output
// ---------------------------------------------------------------------------
describe("preposition: formatted output", () => {
  it("ab — shows only PREP ABL (not GEN or ACC)", () => {
    const output = engine.formatWord("ab");
    const lines = output.split("\n");
    const prepLines = lines.filter((l) => l.includes("PREP"));
    // Should have inflection line with ABL and dict form line
    expect(prepLines.some((l) => l.includes("PREP   ABL"))).toBe(true);
    expect(prepLines.some((l) => l.includes("PREP   GEN"))).toBe(false);
    expect(prepLines.some((l) => l.includes("PREP   ACC"))).toBe(false);
  });

  it("ad — shows only PREP ACC", () => {
    const a = engine.parseWord("ad");
    const prepResults = a.results.filter((r) => r.ir.qual.pofs === "PREP");
    expect(prepResults).toHaveLength(1);
    expect(prepResults[0]?.ir.qual.prep.cs).toBe("ACC");
  });

  it("ex — shows only PREP ABL", () => {
    const output = engine.formatWord("ex");
    const lines = output.split("\n");
    const inflLines = lines.filter((l) => /^\S+\s+PREP\s+/.test(l));
    for (const l of inflLines) {
      expect(l).toContain("ABL");
    }
  });

  it("non-PREP results are unaffected by PREP filter", () => {
    // 'ad' has both PREP and ADV results
    const a = engine.parseWord("ad");
    const nonPrep = a.results.filter((r) => r.ir.qual.pofs !== "PREP");
    expect(nonPrep.length).toBeGreaterThan(0);
    expect(nonPrep.some((r) => r.ir.qual.pofs === "ADV")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Ensure filter doesn't break dedupe behavior
// ---------------------------------------------------------------------------
describe("listSweep: PREP filtering + deduplication", () => {
  it("deduplication still works with PREP filtering", () => {
    const a = engine.parseWord("ab");
    const doubled = [...a.results, ...a.results];
    const swept = listSweep(doubled);
    expect(swept.length).toBe(a.results.length);
  });

  it("PREP filtering doesn't affect non-PREP results", () => {
    const a = engine.parseWord("bonus");
    const swept = listSweep([...a.results]);
    // No PREP results for 'bonus'
    expect(swept.filter((r) => r.ir.qual.pofs === "PREP")).toHaveLength(0);
    expect(swept.filter((r) => r.ir.qual.pofs === "ADJ")).not.toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// listSweep: SEMIDEP filtering branches (from branch-coverage)
// ---------------------------------------------------------------------------
describe("listSweep: SEMIDEP filtering branches", () => {
  it("audeo has no passive PRES/IMPF/FUT forms", () => {
    const a = engine.parseWord("audeo");
    for (const r of a.results) {
      if (r.ir.qual.pofs !== "V" || r.de.part.pofs !== "V") continue;
      if (r.de.part.v.kind !== "SEMIDEP") continue;
      const tvm = r.ir.qual.verb.tenseVoiceMood;
      if (tvm.mood === "IND" || tvm.mood === "IMP") {
        if (tvm.voice === "PASSIVE") {
          expect(["PERF", "PLUP", "FUTP"]).toContain(tvm.tense);
        }
        if (tvm.voice === "ACTIVE") {
          expect(["PRES", "IMPF", "FUT"]).toContain(tvm.tense);
        }
      }
    }
  });

  it("audeat (SEMIDEP subjunctive) not filtered", () => {
    const a = engine.parseWord("audeat");
    const semidepSub = a.results.filter(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.de.part.pofs === "V" &&
        r.de.part.v.kind === "SEMIDEP" &&
        r.ir.qual.verb.tenseVoiceMood.mood === "SUB",
    );
    expect(semidepSub.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// listSweep: SEMIDEP filter with crafted results (from defensive-branches)
// ---------------------------------------------------------------------------
describe("listSweep: SEMIDEP filter with crafted results", () => {
  const semidepEntry: DictionaryEntry = {
    stems: ["aud", "aud", "", "aus"],
    part: { pofs: "V", v: { con: { which: 2, var: 1 }, kind: "SEMIDEP" } },
    tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
    mean: "dare",
  };

  function makeResult(tense: string, voice: string, mood: string): ParseResult {
    return {
      stem: "aud",
      ir: {
        qual: {
          pofs: "V",
          verb: {
            con: { which: 2, var: 1 },
            tenseVoiceMood: { tense, voice, mood },
            person: 1,
            number: "S",
          },
        },
        key: 1,
        ending: { size: 2, suf: "eo" },
        age: "X",
        freq: "A",
      },
      de: semidepEntry,
      entryIndex: 0,
    } as ParseResult;
  }

  it("filters SEMIDEP passive PRES IND (line 57)", () => {
    const results = [makeResult("PRES", "PASSIVE", "IND")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(0);
  });

  it("filters SEMIDEP passive IMPF IND", () => {
    const results = [makeResult("IMPF", "PASSIVE", "IND")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(0);
  });

  it("filters SEMIDEP passive FUT IMP", () => {
    const results = [makeResult("FUT", "PASSIVE", "IMP")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(0);
  });

  it("filters SEMIDEP active PERF IND (line 62)", () => {
    const results = [makeResult("PERF", "ACTIVE", "IND")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(0);
  });

  it("filters SEMIDEP active PLUP IND", () => {
    const results = [makeResult("PLUP", "ACTIVE", "IND")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(0);
  });

  it("filters SEMIDEP active FUTP IND", () => {
    const results = [makeResult("FUTP", "ACTIVE", "IND")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(0);
  });

  it("keeps SEMIDEP active PRES IND", () => {
    const results = [makeResult("PRES", "ACTIVE", "IND")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(1);
  });

  it("keeps SEMIDEP passive PERF IND", () => {
    const results = [makeResult("PERF", "PASSIVE", "IND")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(1);
  });

  it("keeps SEMIDEP in SUB mood (not filtered)", () => {
    const results = [makeResult("PRES", "PASSIVE", "SUB")];
    const swept = listSweep(results);
    expect(swept).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// listSweep: SEMIDEP verb filtering (from engine-coverage)
// ---------------------------------------------------------------------------
describe("listSweep: SEMIDEP verb filtering", () => {
  it("filters SEMIDEP passive in PRES/IMPF/FUT IND/IMP", () => {
    const a = engine.parseWord("audeo");
    const semidep = a.results.filter(
      (r) => r.de.part.pofs === "V" && r.de.part.v.kind === "SEMIDEP",
    );
    expect(semidep.length).toBeGreaterThan(0);
    for (const r of semidep) {
      if (r.ir.qual.pofs !== "V") continue;
      const tvm = r.ir.qual.verb.tenseVoiceMood;
      if (tvm.mood === "IND" || tvm.mood === "IMP") {
        if (tvm.tense === "PRES" || tvm.tense === "IMPF" || tvm.tense === "FUT") {
          expect(tvm.voice).not.toBe("PASSIVE");
        }
      }
    }
  });

  it("allows SEMIDEP active PRES in IND mood", () => {
    const a = engine.parseWord("audeo");
    const activePres = a.results.filter(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.de.part.pofs === "V" &&
        r.de.part.v.kind === "SEMIDEP" &&
        r.ir.qual.verb.tenseVoiceMood.voice === "ACTIVE" &&
        r.ir.qual.verb.tenseVoiceMood.tense === "PRES",
    );
    expect(activePres.length).toBeGreaterThan(0);
  });

  it("produces VPAR for SEMIDEP perfect participle", () => {
    const a = engine.parseWord("gavisus");
    const vpar = a.results.filter(
      (r) => r.ir.qual.pofs === "VPAR" && r.de.part.pofs === "V" && r.de.part.v.kind === "SEMIDEP",
    );
    expect(vpar.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// listSweep: blank-ending imperative filter (from engine-coverage)
// ---------------------------------------------------------------------------
describe("listSweep: blank-ending imperative filter", () => {
  it("illud does not produce a verb result (V 3,1 IMP with stem not ending in c)", () => {
    const a = engine.parseWord("illud");
    const verbResults = a.results.filter((r) => r.ir.qual.pofs === "V");
    expect(verbResults).toHaveLength(0);
  });

  it("dic still produces V 3,1 PRES ACTIVE IMP (stem ends in c)", () => {
    const a = engine.parseWord("dic");
    const imp = a.results.filter(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.ir.qual.verb.tenseVoiceMood.mood === "IMP" &&
        r.ir.qual.verb.tenseVoiceMood.tense === "PRES" &&
        r.ir.ending.size === 0,
    );
    expect(imp.length).toBeGreaterThan(0);
  });

  it("duc still produces V 3,1 PRES ACTIVE IMP", () => {
    const a = engine.parseWord("duc");
    const imp = a.results.filter(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.ir.qual.verb.tenseVoiceMood.mood === "IMP" &&
        r.ir.ending.size === 0,
    );
    expect(imp.length).toBeGreaterThan(0);
  });

  it("fac still produces V 3,1 PRES ACTIVE IMP", () => {
    const a = engine.parseWord("fac");
    const imp = a.results.filter(
      (r) =>
        r.ir.qual.pofs === "V" &&
        r.ir.qual.verb.tenseVoiceMood.mood === "IMP" &&
        r.ir.ending.size === 0,
    );
    expect(imp.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// filterByPOS: DEP future active infinitive exception (from remaining-branches)
// ---------------------------------------------------------------------------
describe("filterByPOS: DEP future active infinitive exception", () => {
  it("keeps DEP FUT ACTIVE INF (line 85)", () => {
    const depEntry: DictionaryEntry = {
      stems: ["hort", "hort", "", "hortat"],
      part: { pofs: "V", v: { con: { which: 1, var: 1 }, kind: "DEP" } },
      tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
      mean: "urge",
    };
    const futActInf: ParseResult = {
      stem: "hortat",
      ir: {
        qual: {
          pofs: "V",
          verb: {
            con: { which: 1, var: 1 },
            tenseVoiceMood: { tense: "FUT", voice: "ACTIVE", mood: "INF" },
            person: 0,
            number: "X",
          },
        },
        key: 4,
        ending: { size: 4, suf: "urus" },
        age: "X",
        freq: "A",
      },
      de: depEntry,
      entryIndex: 0,
    };
    const filtered = filterByPOS([futActInf]);
    expect(filtered).toHaveLength(1);
  });

  it("filters DEP ACTIVE IND (not the exception)", () => {
    const depEntry: DictionaryEntry = {
      stems: ["hort", "hort", "", "hortat"],
      part: { pofs: "V", v: { con: { which: 1, var: 1 }, kind: "DEP" } },
      tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
      mean: "urge",
    };
    const activeInd: ParseResult = {
      stem: "hort",
      ir: {
        qual: {
          pofs: "V",
          verb: {
            con: { which: 1, var: 1 },
            tenseVoiceMood: { tense: "PRES", voice: "ACTIVE", mood: "IND" },
            person: 1,
            number: "S",
          },
        },
        key: 1,
        ending: { size: 1, suf: "o" },
        age: "X",
        freq: "A",
      },
      de: depEntry,
      entryIndex: 0,
    };
    const filtered = filterByPOS([activeInd]);
    expect(filtered).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// rank: unknown frequency and POS fallback (from remaining-branches)
// ---------------------------------------------------------------------------
describe("rank: unknown frequency and POS fallback", () => {
  it("handles unknown frequency value (falls back to rank 10)", () => {
    const entry: DictionaryEntry = {
      stems: ["test", "", "", ""],
      part: { pofs: "N", n: { decl: { which: 1, var: 1 }, gender: "M", kind: "T" } },
      tran: { age: "X", area: "X", geo: "X", freq: "Z" as "X", source: "X" },
      mean: "test",
    };
    const result: ParseResult = {
      stem: "test",
      ir: {
        qual: {
          pofs: "N",
          noun: { decl: { which: 1, var: 1 }, cs: "NOM", number: "S", gender: "M" },
        },
        key: 1,
        ending: { size: 0, suf: "" },
        age: "X",
        freq: "A",
      },
      de: entry,
      entryIndex: 0,
    };
    const ranked = rank([result]);
    expect(ranked).toHaveLength(1);
  });
});
