import { describe, expect, it } from "vitest";
import { dictionaryForm } from "../../../src/lib/formatter/dictionary-form.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";
import { createEngine } from "../../../src/node/index.js";

const engine = createEngine();

function makeVerb(
  stems: [string, string, string, string],
  which: number,
  variant: number,
  kind: string,
): DictionaryEntry {
  return {
    stems,
    part: {
      pofs: "V" as const,
      v: {
        con: { which: which as 1, var: variant as 1 },
        kind: kind as "X",
      },
    },
    tran: {
      age: "X" as const,
      area: "X" as const,
      geo: "X" as const,
      freq: "X" as const,
      source: "X" as const,
    },
    mean: "test",
  };
}

describe("dictionaryForm: deponent verbs", () => {
  it("1st conjugation DEP", () => {
    const form = dictionaryForm(makeVerb(["hort", "hort", "", "hortat"], 1, 1, "DEP"));
    expect(form).toContain("hortor");
    expect(form).toContain("hortari");
    expect(form).toContain("hortatus sum");
    expect(form).toContain("DEP");
  });

  it("2nd conjugation DEP", () => {
    const form = dictionaryForm(makeVerb(["ver", "ver", "", "verit"], 2, 1, "DEP"));
    expect(form).toContain("vereor");
    expect(form).toContain("vereri");
  });

  it("3rd conjugation DEP, var 4 (-iri)", () => {
    const form = dictionaryForm(makeVerb(["part", "part", "", "partit"], 3, 4, "DEP"));
    expect(form).toContain("partiri");
  });

  it("DEP with missing stem4 shows dash", () => {
    const form = dictionaryForm(makeVerb(["hort", "hort", "", "zzz"], 1, 1, "DEP"));
    expect(form).toContain("-");
  });
});

describe("dictionaryForm: PERFDEF verbs", () => {
  it("basic PERFDEF", () => {
    const form = dictionaryForm(makeVerb(["", "", "od", ""], 0, 0, "PERFDEF"));
    expect(form).toContain("odi");
    expect(form).toContain("odisse");
  });

  it("PERFDEF with stem4", () => {
    const form = dictionaryForm(makeVerb(["", "", "od", "os"], 0, 0, "PERFDEF"));
    expect(form).toContain("osus");
  });
});

describe("dictionaryForm: IMPERS verbs", () => {
  it("3rd conjugation IMPERS", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "placu", "placit"], 3, 1, "IMPERS"));
    expect(form).toContain("placit");
    expect(form).toContain("placuit");
    expect(form).toContain("placitus est");
  });

  it("5,1 IMPERS (est)", () => {
    const form = dictionaryForm(makeVerb(["", "es", "fu", ""], 5, 1, "IMPERS"));
    expect(form).toContain("est");
    expect(form).toContain("esse");
  });

  it("IMPERS with stem3 but no stem4", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "placu", "zzz"], 2, 1, "IMPERS"));
    expect(form).toContain("placuit");
    expect(form).toContain("-");
  });

  it("IMPERS with stem4 but no stem3", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "zzz", "placit"], 2, 1, "IMPERS"));
    expect(form).toContain("-");
    expect(form).toContain("placitus est");
  });
});

describe("dictionaryForm: SEMIDEP verbs", () => {
  it("basic SEMIDEP", () => {
    const form = dictionaryForm(makeVerb(["aud", "aud", "", "aus"], 2, 1, "SEMIDEP"));
    expect(form).toContain("audeo");
    expect(form).toContain("ausus sum");
  });
});

describe("dictionaryForm: irregular conjugations", () => {
  it("con 5,1 — sum, esse", () => {
    const form = dictionaryForm(makeVerb(["s", "", "fu", "fut"], 5, 1, "TO_BE"));
    expect(form).toContain("sum");
    expect(form).toContain("esse");
    expect(form).toContain("fui");
    expect(form).toContain("futurus");
  });

  it("con 5,2 — possum type", () => {
    const form = dictionaryForm(makeVerb(["poss", "pot", "potu", ""], 5, 2, "X"));
    expect(form).toContain("possum");
    expect(form).toContain("posse");
  });

  it("con 6,1 — eo/ire class appends (ii)", () => {
    const form = dictionaryForm(makeVerb(["", "", "i", "it"], 6, 1, "X"));
    expect(form).toContain("(ii)");
  });

  it("con 3,4 displays as 4th conjugation", () => {
    const form = dictionaryForm(makeVerb(["aud", "aud", "audiv", "audit"], 3, 4, "X"));
    expect(form).toContain("(4th)");
    expect(form).toContain("audire");
  });

  it("con 3,2 — fio type", () => {
    const form = dictionaryForm(makeVerb(["f", "f", "", "fact"], 3, 2, "X"));
    expect(form).toContain("fre");
  });

  it("con 7,2 — am type", () => {
    const form = dictionaryForm(makeVerb(["vol", "vel", "volu", ""], 7, 2, "X"));
    expect(form).toContain("volam");
  });

  it("con 7,3 — se infinitive", () => {
    const form = dictionaryForm(makeVerb(["vol", "vel", "volu", ""], 7, 3, "X"));
    expect(form).toContain("velse");
  });

  it("missing stem3 and stem4 shows dashes", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "zzz", "zzz"], 1, 1, "X"));
    expect(form).toContain("-, -");
  });
});

describe("dictionaryForm: verb IMPERS OX3/OX4 stem combos", () => {
  function makeVerb(
    stems: [string, string, string, string],
    which: number,
    variant: number,
    kind: string,
  ): DictionaryEntry {
    return {
      stems,
      part: {
        pofs: "V" as const,
        v: { con: { which: which as 1, var: variant as 1 }, kind: kind as "X" },
      },
      tran: {
        age: "X" as const,
        area: "X" as const,
        geo: "X" as const,
        freq: "X" as const,
        source: "X" as const,
      },
      mean: "test",
    };
  }

  it("IMPERS with both stem3 and stem4", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "placu", "placit"], 2, 1, "IMPERS"));
    expect(form).toContain("placuit");
    expect(form).toContain("placitus est");
  });

  it("IMPERS with stem3 only (no stem4)", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "placu", "zzz"], 2, 1, "IMPERS"));
    expect(form).toContain("placuit");
    expect(form).toContain("-");
    expect(form).not.toContain("est");
  });

  it("IMPERS with stem4 only (no stem3)", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "zzz", "placit"], 2, 1, "IMPERS"));
    expect(form).toContain("-");
    expect(form).toContain("placitus est");
  });

  it("IMPERS with neither stem3 nor stem4", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "zzz", "zzz"], 2, 1, "IMPERS"));
    // No OX3/OX4 at all
    expect(form).toContain("placet");
    expect(form).toContain("placere");
  });

  it("regular verb with both stem3 and stem4", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "amav", "amat"], 1, 1, "X"));
    expect(form).toContain("amavi");
    expect(form).toContain("amatus");
  });

  it("regular verb with neither stem3 nor stem4", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "zzz", "zzz"], 1, 1, "X"));
    expect(form).toContain("-, -");
  });

  it("regular verb with stem3 only", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "amav", "zzz"], 1, 1, "X"));
    expect(form).toContain("amavi");
    expect(form).toContain("-");
  });

  it("regular verb with stem4 only", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "zzz", "amat"], 1, 1, "X"));
    expect(form).toContain("-");
    expect(form).toContain("amatus");
  });

  it("sum/esse (5,1) with both stem3 and stem4", () => {
    const form = dictionaryForm(makeVerb(["s", "", "fu", "fut"], 5, 1, "TO_BE"));
    expect(form).toContain("fui");
    expect(form).toContain("futurus");
  });

  it("sum/esse (5,1) with stem3 only", () => {
    const form = dictionaryForm(makeVerb(["s", "", "fu", "zzz"], 5, 1, "TO_BE"));
    expect(form).toContain("fui");
    expect(form).not.toContain("futurus");
  });

  it("sum/esse (5,1) with stem4 only", () => {
    const form = dictionaryForm(makeVerb(["s", "", "zzz", "fut"], 5, 1, "TO_BE"));
    expect(form).not.toContain("fui");
    expect(form).toContain("futurus");
  });

  it("SEMIDEP with no stem4", () => {
    const form = dictionaryForm(makeVerb(["aud", "aud", "", "zzz"], 2, 1, "SEMIDEP"));
    expect(form).toContain("audeo");
    expect(form).not.toContain("sum");
  });

  it("con 6,1 with perf as dash does not append (ii)", () => {
    const form = dictionaryForm(makeVerb(["e", "i", "zzz", "it"], 6, 1, "X"));
    expect(form).not.toContain("(ii)");
    expect(form).toContain("-");
  });

  it("formatVerbResult with kind=X omits kind suffix", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "amav", "amat"], 1, 1, "X"));
    expect(form).toMatch(/V\s+\(1st\)$/);
  });

  it("formatVerbResult with kind=TRANS shows TRANS", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "amav", "amat"], 1, 1, "TRANS"));
    expect(form).toContain("TRANS");
  });

  // IMPERS with different conjugations for OX1
  it("IMPERS 1st conj → at", () => {
    const f = dictionaryForm(makeVerb(["plac", "plac", "", ""], 1, 1, "IMPERS"));
    expect(f).toContain("placat");
  });

  it("IMPERS 3rd conj → it", () => {
    const f = dictionaryForm(makeVerb(["plac", "plac", "", ""], 3, 1, "IMPERS"));
    expect(f).toContain("placit");
  });

  it("IMPERS 5,1 with stem3 and no stem4", () => {
    const f = dictionaryForm(makeVerb(["", "es", "fu", "zzz"], 5, 1, "IMPERS"));
    expect(f).toContain("fuit");
    // stem4 missing so OX4 gets "-"
    expect(f).toMatch(/, -\s/);
  });

  it("IMPERS 5,1 with no stem3 and stem4", () => {
    const f = dictionaryForm(makeVerb(["", "es", "zzz", "fut"], 5, 1, "IMPERS"));
    // stem3 missing so OX3 gets "-"
    expect(f).toContain("futus est");
  });

  it("DEP 3rd conj base (-i inf)", () => {
    const f = dictionaryForm(makeVerb(["sequ", "sequ", "", "secut"], 3, 1, "DEP"));
    expect(f).toContain("sequor");
    expect(f).toContain("sequi");
  });

  it("verb stem2 fallback to stem1 when stem2 empty", () => {
    const f = dictionaryForm(makeVerb(["am", "", "amav", "amat"], 1, 1, "X"));
    expect(f).toContain("amare"); // infStem = stem2 || stem1 = "am"
  });
});

describe("dictionaryForm: verb integration with real entries", () => {
  it("hortor (DEP) through engine", () => {
    const a = engine.parseWord("hortatur");
    const dep = a.results.find((r) => r.de.part.pofs === "V" && r.de.part.v.kind === "DEP");
    expect(dep).toBeDefined();
    if (dep) {
      const form = dictionaryForm(dep.de);
      expect(form).toContain("DEP");
    }
  });

  it("odi (PERFDEF) through engine", () => {
    const a = engine.parseWord("odi");
    const perfdef = a.results.find((r) => r.de.part.pofs === "V" && r.de.part.v.kind === "PERFDEF");
    if (perfdef) {
      const form = dictionaryForm(perfdef.de);
      expect(form).toContain("PERFDEF");
    }
  });

  it("placet (IMPERS) through engine", () => {
    const a = engine.parseWord("placet");
    const impers = a.results.find((r) => r.de.part.pofs === "V" && r.de.part.v.kind === "IMPERS");
    if (impers) {
      const form = dictionaryForm(impers.de);
      expect(form).toContain("IMPERS");
    }
  });
});
