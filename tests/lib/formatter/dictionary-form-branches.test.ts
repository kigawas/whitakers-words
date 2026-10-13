/**
 * Branch tests for dictionaryForm on hand-built entries, including shapes
 * DICTLINE does not use. Expected forms follow Ada's Dictionary_Form.
 */
import { describe, expect, it } from "vitest";
import { dictionaryForm } from "../../../src/lib/formatter/dictionary-form.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function noun(s1: string, s2: string, w: number, v: number, g: string): DictionaryEntry {
  return {
    stems: [s1, s2, "", ""] as const,
    part: {
      pofs: "N" as const,
      n: { decl: { which: w as 1, var: v as 1 }, gender: g as "M", kind: "T" as const },
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

function verb(
  s: [string, string, string, string],
  w: number,
  v: number,
  k: string,
): DictionaryEntry {
  return {
    stems: s,
    part: { pofs: "V" as const, v: { con: { which: w as 1, var: v as 1 }, kind: k as "X" } },
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

function adj(
  s: [string, string, string, string],
  w: number,
  v: number,
  co: string,
): DictionaryEntry {
  return {
    stems: s,
    part: { pofs: "ADJ" as const, adj: { decl: { which: w as 1, var: v as 1 }, co: co as "POS" } },
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

// ===========================================================================
// ADV co=X: stems 1-3, a blank one left out
// ===========================================================================
describe("dictionaryForm: ADV co=X stem branches", () => {
  it("ADV co=X with stem2 only (s[1] truthy, s[2] falsy)", () => {
    const de: DictionaryEntry = {
      stems: ["bene", "melius", "", ""],
      part: { pofs: "ADV", adv: { co: "X" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "well",
    };
    expect(dictionaryForm(de)).toBe("bene, melius  ADV");
  });

  it("ADV co=X with stem3 only (s[1] falsy, s[2] truthy)", () => {
    const de: DictionaryEntry = {
      stems: ["bene", "", "optime", ""],
      part: { pofs: "ADV", adv: { co: "X" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "well",
    };
    expect(dictionaryForm(de)).toBe("bene, optime  ADV");
  });

  it("ADV co=X with both stem2 and stem3", () => {
    const de: DictionaryEntry = {
      stems: ["bene", "melius", "optime", ""],
      part: { pofs: "ADV", adv: { co: "X" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "well",
    };
    expect(dictionaryForm(de)).toBe("bene, melius, optime  ADV");
  });
});

// ===========================================================================
// One-stem entries: Ada prints the stem alone, never borrowing stem 1 for a
// missing stem 2. Only N/ADJ/V 9 and COMP/SUPER adjectives decline from it.
// ===========================================================================
describe("dictionaryForm: one-stem entries", () => {
  it("a one-stem noun prints its stem", () => {
    expect(dictionaryForm(noun("aqu", "", 1, 1, "F"))).toBe("aqu  N");
  });

  it("a one-stem POS adjective prints its stem", () => {
    expect(dictionaryForm(adj(["bon", "", "", ""], 1, 1, "POS"))).toBe("bon  ADJ");
  });

  it("an undeclined noun declines from its one stem", () => {
    expect(dictionaryForm(noun("fas", "", 9, 9, "N"))).toBe("fas, undeclined  N N");
  });
});

// ---------------------------------------------------------------------------
// dictionaryForm: exhaustive verb table coverage (from branch-coverage)
// ---------------------------------------------------------------------------
describe("dictionaryForm: exhaustive verb table coverage", () => {
  function v(stems: [string, string, string, string], w: number, va: number, kind = "X"): string {
    return dictionaryForm({
      stems,
      part: { pofs: "V" as const, v: { con: { which: w as 1, var: va as 1 }, kind: kind as "X" } },
      tran: {
        age: "X" as const,
        area: "X" as const,
        geo: "X" as const,
        freq: "X" as const,
        source: "X" as const,
      },
      mean: "test",
    });
  }

  it("con 1,1 → -o, -are", () => {
    const f = v(["am", "am", "amav", "amat"], 1, 1);
    expect(f).toContain("amo");
    expect(f).toContain("amare");
  });
  it("con 2,1 → -eo, -ere", () => {
    const f = v(["hab", "hab", "habu", "habit"], 2, 1);
    expect(f).toContain("habeo");
    expect(f).toContain("habere");
  });
  it("con 3,1 → -o, -ere", () => {
    const f = v(["duc", "duc", "dux", "duct"], 3, 1);
    expect(f).toContain("duco");
    expect(f).toContain("ducere");
  });
  it("con 3,2 → -o, -re", () => {
    const f = v(["f", "f", "", "fact"], 3, 2);
    expect(f).toContain("fo");
    expect(f).toContain("fre");
  });
  it("con 3,3 → -o, -eri; fio, fieri", () => {
    expect(v(["confi", "conf", "zzz", "confact"], 3, 3, "SEMIDEP")).toBe(
      "confio, conferi, confactus sum  V SEMIDEP",
    );
    expect(v(["fi", "f", "zzz", "fact"], 3, 3, "SEMIDEP")).toBe(
      "fio, fieri, factus sum  V SEMIDEP",
    );
  });
  it("con 3,4 → -o, -ire", () => {
    const f = v(["aud", "aud", "audiv", "audit"], 3, 4);
    expect(f).toContain("audo");
    expect(f).toContain("audire");
  });
  it("con 5,1 → -um, -esse", () => {
    const f = v(["s", "", "fu", "fut"], 5, 1, "TO_BE");
    expect(f).toContain("sum");
    expect(f).toContain("esse");
  });
  it("con 5,2 → -um, stem1+e", () => {
    const f = v(["poss", "pot", "potu", ""], 5, 2);
    expect(f).toContain("possum");
    expect(f).toContain("posse");
  });
  it("con 6,1 → -o, -re", () => {
    const f = v(["e", "i", "i", "it"], 6, 1);
    expect(f).toContain("eo");
    expect(f).toContain("ire");
  });
  it("con 6,2 → -o, -le", () => {
    const f = v(["vel", "vel", "volu", ""], 6, 2);
    expect(f).toContain("velo");
    expect(f).toContain("velle");
  });
  it("con 7,2 → -am", () => {
    const f = v(["vol", "vel", "", ""], 7, 2);
    expect(f).toContain("volam");
  });
  it("con 7,3 → -o, -se", () => {
    const f = v(["vol", "vel", "", ""], 7, 3);
    expect(f).toContain("volo");
    expect(f).toContain("velse");
  });
  it("con 8,1 → -o, -are", () => {
    const f = v(["am", "am", "", ""], 8, 1);
    expect(f).toContain("amo");
    expect(f).toContain("amare");
  });
  it("con 8,2 → -o, -ere", () => {
    const f = v(["hab", "hab", "", ""], 8, 2);
    expect(f).toContain("habere");
  });
  it("con 8,4 → -o, -ire", () => {
    const f = v(["aud", "aud", "", ""], 8, 4);
    expect(f).toContain("audire");
  });
  it("con 9 → fallback formatting", () => {
    const f = v(["ait", "", "", ""], 9, 8);
    expect(f).toContain("V");
  });
});

// ---------------------------------------------------------------------------
// dictionaryForm: remaining branch coverage (from branch-coverage)
// ---------------------------------------------------------------------------
describe("dictionaryForm: remaining branch coverage", () => {
  it("noun with unknown declension: no form, as Ada's Not_Found", () => {
    const de: DictionaryEntry = {
      stems: ["test", "test", "", ""],
      part: { pofs: "N", n: { decl: { which: 8, var: 1 }, gender: "M", kind: "T" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "test",
    };
    expect(dictionaryForm(de)).toBe("");
  });

  it("PRON with decl 9 non-8-non-9 variant (falls through)", () => {
    const de: DictionaryEntry = {
      stems: ["test", "", "", ""],
      part: { pofs: "PRON", pron: { decl: { which: 9, var: 1 }, kind: "ADJECT" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "test",
    };
    const form = dictionaryForm(de);
    expect(form).toBe("test  PRON");
  });

  it("PRON with decl 2 and no headword: no form, as Ada", () => {
    const de: DictionaryEntry = {
      stems: ["test", "test", "", ""],
      part: { pofs: "PRON", pron: { decl: { which: 2, var: 1 }, kind: "ADJECT" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "test",
    };
    expect(dictionaryForm(de)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// dictionaryForm: verb conjugation branch coverage (from branch-coverage)
// ---------------------------------------------------------------------------
describe("dictionaryForm: verb conjugation branch coverage", () => {
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

  it("IMPERS 1st conj → stem + at", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "placu", "placit"], 1, 1, "IMPERS"));
    expect(form).toContain("placat");
  });

  it("IMPERS 2nd conj → stem + et", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "placu", "placit"], 2, 1, "IMPERS"));
    expect(form).toContain("placet");
  });

  it("IMPERS unknown conj → stem + t (fallback)", () => {
    const form = dictionaryForm(makeVerb(["plac", "plac", "placu", "placit"], 7, 1, "IMPERS"));
    expect(form).toContain("plact");
  });

  it("2nd conj → stem + eo", () => {
    const form = dictionaryForm(makeVerb(["hab", "hab", "habu", "habit"], 2, 1, "X"));
    expect(form).toContain("habeo");
  });

  it("1st conj (default) → stem + o", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "amav", "amat"], 1, 1, "X"));
    expect(form).toContain("amo");
  });

  it("1st conj inf → are", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "amav", "amat"], 1, 1, "X"));
    expect(form).toContain("amare");
  });

  it("2nd conj inf → ere", () => {
    const form = dictionaryForm(makeVerb(["hab", "hab", "habu", "habit"], 2, 1, "X"));
    expect(form).toContain("habere");
  });

  it("3rd conj inf → ere", () => {
    const form = dictionaryForm(makeVerb(["duc", "duc", "dux", "duct"], 3, 1, "X"));
    expect(form).toContain("ducere");
  });

  it("8th conj var 1 → are", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "", ""], 8, 1, "X"));
    expect(form).toContain("amare");
  });

  it("8th conj var 4 → ire", () => {
    const form = dictionaryForm(makeVerb(["aud", "aud", "", ""], 8, 4, "X"));
    expect(form).toContain("audire");
  });

  it("8th conj default → ere", () => {
    const form = dictionaryForm(makeVerb(["duc", "duc", "", ""], 8, 2, "X"));
    expect(form).toContain("ducere");
  });

  it("6th conj var 2 → le", () => {
    const form = dictionaryForm(makeVerb(["vel", "vel", "", ""], 6, 2, "X"));
    expect(form).toContain("velle");
  });

  it("kind=X produces no kind suffix", () => {
    const form = dictionaryForm(makeVerb(["am", "am", "amav", "amat"], 1, 1, "X"));
    expect(form).not.toContain("  X");
    expect(form).toMatch(/V\s+\(1st\)$/);
  });

  it("con 6,1 with no perf stem does not append (ii)", () => {
    const form = dictionaryForm(makeVerb(["e", "", "zzz", "it"], 6, 1, "X"));
    expect(form).not.toContain("(ii)");
    expect(form).toContain("-");
  });
});

// ---------------------------------------------------------------------------
// dictionaryForm: adjective stem3/stem4 edge cases (from branch-coverage)
// ---------------------------------------------------------------------------
describe("dictionaryForm: adjective stem3/stem4 edge cases", () => {
  function makeAdj(
    stems: [string, string, string, string],
    which: number,
    variant: number,
    co: string,
  ): DictionaryEntry {
    return {
      stems,
      part: {
        pofs: "ADJ" as const,
        adj: { decl: { which: which as 1, var: variant as 1 }, co: co as "POS" },
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

  it("co=X with missing stem3 shows dash", () => {
    const form = dictionaryForm(makeAdj(["bon", "bon", "zzz", "opti"], 1, 1, "X"));
    expect(form).toContain("-");
    expect(form).toContain("optimus -a -um");
  });

  it("co=X with missing stem4 shows dash", () => {
    const form = dictionaryForm(makeAdj(["bon", "bon", "meli", "zzz"], 1, 1, "X"));
    expect(form).toContain("melior -or -us");
    expect(form).toContain("-");
  });

  it("co=X with both stem3 and stem4 missing", () => {
    const form = dictionaryForm(makeAdj(["bon", "bon", "zzz", "zzz"], 1, 1, "X"));
    expect(form).toContain("bonus");
  });
});

// ---------------------------------------------------------------------------
// dictionaryForm: DEP and PERFDEF branches (from remaining-branches)
// ---------------------------------------------------------------------------
describe("dictionaryForm: DEP and PERFDEF branches", () => {
  it("DEP outside conjugations 1-3: no form, as Ada's Not_Found", () => {
    expect(dictionaryForm(verb(["test", "test", "", "test"], 7, 1, "DEP"))).toBe("");
  });

  it("DEP 3 4 → -iri", () => {
    const form = dictionaryForm(verb(["part", "part", "", "partit"], 3, 4, "DEP"));
    expect(form).toContain("partiri");
  });

  it("PERFDEF with a zzz stem 3 prints - for both its parts", () => {
    const form = dictionaryForm(verb(["", "", "zzz", "os"], 0, 0, "PERFDEF"));
    expect(form).toBe("-, -, osus  V PERFDEF");
  });

  it("PERFDEF with stem3 present", () => {
    const form = dictionaryForm(verb(["", "", "od", "os"], 0, 0, "PERFDEF"));
    expect(form).toContain("odi");
    expect(form).toContain("odisse");
    expect(form).toContain("osus");
  });
});

// ---------------------------------------------------------------------------
// dictionaryForm: ADJ POS which=3 all variants (from remaining-branches)
// ---------------------------------------------------------------------------
describe("dictionaryForm: ADJ POS which=3 all variants", () => {
  it("which=3, var=1 → stem, (gen.), stem2+is", () => {
    expect(dictionaryForm(adj(["acer", "acr", "", ""], 3, 1, "POS"))).toBe(
      "acer, (gen.), acris  ADJ",
    );
  });

  it("which=3, var=2 → stem+is, stem2+is, stem2+e", () => {
    expect(dictionaryForm(adj(["fort", "fort", "", ""], 3, 2, "POS"))).toBe(
      "fortis, fortis, forte  ADJ",
    );
  });

  it("which=3, var=3 → stem, stem2+is, stem2+e", () => {
    expect(dictionaryForm(adj(["felix", "felic", "", ""], 3, 3, "POS"))).toBe(
      "felix, felicis, felice  ADJ",
    );
  });

  it("which=3, var=6 → stem, (gen.), stem2+os", () => {
    expect(dictionaryForm(adj(["inops", "inop", "", ""], 3, 6, "POS"))).toBe(
      "inops, (gen.), inopos  ADJ",
    );
  });

  it("which=1, var=2 → stem, stem2+a, stem2+um (er-type)", () => {
    expect(dictionaryForm(adj(["pulcher", "pulchr", "", ""], 1, 2, "POS"))).toBe(
      "pulcher, pulchra, pulchrum  ADJ",
    );
  });

  it("which=1, var=4 → stem, stem2+a, stem2+um", () => {
    expect(dictionaryForm(adj(["miser", "miser", "", ""], 1, 4, "POS"))).toBe(
      "miser, misera, miserum  ADJ",
    );
  });

  it("which=1, var=3 → stem+us, stem2+a, stem2+um (gen -ius)", () => {
    expect(dictionaryForm(adj(["ali", "ali", "", ""], 1, 3, "POS"))).toBe(
      "alius, alia, alium (gen -ius)  ADJ",
    );
  });

  it("which=1, var=1 → stem+us, stem2+a, stem2+um (default)", () => {
    expect(dictionaryForm(adj(["bon", "bon", "", ""], 1, 1, "POS"))).toBe(
      "bonus, bona, bonum  ADJ",
    );
  });
});
