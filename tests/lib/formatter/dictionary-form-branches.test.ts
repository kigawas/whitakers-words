/**
 * Tests targeting every uncovered branch in lib/formatter/.
 *
 * dictionary-form.ts uncovered lines: 25-28, 70-82, 90-94, 98-115,
 *   126-128, 135-149, 163, 197-202, 247, 382-389
 * text-output.ts uncovered lines: 225-226
 *
 * Almost all uncovered branches are the FALSY path of `stem2 || stem1`
 * or `s[1]`/`s[2]` expressions — i.e., when stem2 is empty string.
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

function pron(s1: string, s2: string, w: number, v: number): DictionaryEntry {
  return {
    stems: [s1, s2, "", ""] as const,
    part: {
      pofs: "PRON" as const,
      pron: { decl: { which: w as 1, var: v as 1 }, kind: "ADJECT" as const },
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

// ===========================================================================
// Lines 25-28: ADV co=X with s[1]/s[2] branches
// ===========================================================================
describe("dictionaryForm: ADV co=X stem branches (lines 25-28)", () => {
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
// Lines 70-82: noun decl 1 var 6/7/8/default with empty stem2 (|| fallback)
// ===========================================================================
describe("dictionaryForm: noun decl 1 stem2 fallback (lines 70-82)", () => {
  it("decl 1 var 6 with empty stem2", () => {
    expect(dictionaryForm(noun("nymph", "", 1, 6, "F"))).toBe("nymphe, nymphes  N F");
  });
  it("decl 1 var 7 with empty stem2", () => {
    expect(dictionaryForm(noun("orest", "", 1, 7, "M"))).toBe("orestes, orestae  N M");
  });
  it("decl 1 var 8 with empty stem2", () => {
    expect(dictionaryForm(noun("Bore", "", 1, 8, "M"))).toBe("Boreas, Boreae  N M");
  });
  it("decl 1 default with empty stem2", () => {
    expect(dictionaryForm(noun("aqu", "", 1, 1, "F"))).toBe("aqua, aquae  N (1st) F");
  });
});

// ===========================================================================
// Lines 90-94: noun decl 2 var 2/3 with empty stem2
// ===========================================================================
describe("dictionaryForm: noun decl 2 stem2 fallback (lines 90-94)", () => {
  it("decl 2 var 2 with empty stem2", () => {
    expect(dictionaryForm(noun("bell", "", 2, 2, "N"))).toBe("bellum, belli  N (2nd) N");
  });
  it("decl 2 var 3 with empty stem2", () => {
    expect(dictionaryForm(noun("puer", "", 2, 3, "M"))).toBe("puer, pueri  N (2nd) M");
  });
});

// ===========================================================================
// Lines 98-115: noun decl 2 var 4/5/6/7/8/9/default with empty stem2
// ===========================================================================
describe("dictionaryForm: noun decl 2 var 4-9 stem2 fallback (lines 98-115)", () => {
  it("decl 2 var 4 with empty stem2", () => {
    expect(dictionaryForm(noun("imperi", "", 2, 4, "N"))).toBe("imperium, imperi(i)  N (2nd) N");
  });
  it("decl 2 var 5 with empty stem2", () => {
    expect(dictionaryForm(noun("Juli", "", 2, 5, "M"))).toBe("Julius, Juli  N (2nd) M");
  });
  it("decl 2 var 6 with empty stem2", () => {
    expect(dictionaryForm(noun("cerv", "", 2, 6, "M"))).toBe("cervos, cervi  N M");
  });
  it("decl 2 var 8 with empty stem2", () => {
    expect(dictionaryForm(noun("ar", "", 2, 8, "N"))).toBe("aron, ari  N N");
  });
  it("decl 2 var 9 with empty stem2", () => {
    expect(dictionaryForm(noun("av", "", 2, 9, "M"))).toBe("avus, avi  N M");
  });
  it("decl 2 default with empty stem2", () => {
    expect(dictionaryForm(noun("domin", "", 2, 1, "M"))).toBe("dominus, domini  N (2nd) M");
  });
});

// ===========================================================================
// Lines 126-128: noun decl 3 var 7/9 and default with empty stem2
// ===========================================================================
describe("dictionaryForm: noun decl 3 stem2 fallback (lines 126-128)", () => {
  it("decl 3 var 7 with empty stem2 → os/is", () => {
    expect(dictionaryForm(noun("chlamys", "", 3, 7, "F"))).toBe("chlamys, chlamysos/is  N F");
  });
  it("decl 3 default with empty stem2 → is", () => {
    expect(dictionaryForm(noun("rex", "", 3, 1, "M"))).toBe("rex, rexis  N (3rd) M");
  });
});

// ===========================================================================
// Lines 135-149: noun decl 4 var 2/3/default and decl 5 with empty stem2
// ===========================================================================
describe("dictionaryForm: noun decl 4/5 stem2 fallback (lines 135-149)", () => {
  it("decl 4 var 2 with empty stem2", () => {
    expect(dictionaryForm(noun("corn", "", 4, 2, "N"))).toBe("cornu, cornus  N (4th) N");
  });
  it("decl 4 var 3 with empty stem2", () => {
    expect(dictionaryForm(noun("gest", "", 4, 3, "M"))).toBe("gestus, gestu  N (4th) M");
  });
  it("decl 4 default with empty stem2", () => {
    expect(dictionaryForm(noun("man", "", 4, 1, "F"))).toBe("manus, manus  N (4th) F");
  });
  it("decl 5 with empty stem2", () => {
    expect(dictionaryForm(noun("r", "", 5, 1, "F"))).toBe("res, rei  N (5th) F");
  });
});

// ===========================================================================
// Line 163: noun default (unknown decl) with empty stem2
// ===========================================================================
describe("dictionaryForm: noun default decl stem2 fallback (line 163)", () => {
  it("unknown decl with empty stem2", () => {
    expect(dictionaryForm(noun("test", "", 8, 1, "M"))).toBe("test, testis  N M");
  });
});

// ===========================================================================
// Lines 197-202: PRON decl 4 var 1/2 with empty stem2
// ===========================================================================
describe("dictionaryForm: PRON stem2 fallback (lines 197-202)", () => {
  it("PRON decl 4 var 1 with empty stem2 → ox2 uses stem1", () => {
    const form = dictionaryForm(pron("i", "", 4, 1));
    // ox2 = (stem2 || stem1) + "a" = "i" + "a" = "ia"
    expect(form).toBe("is, ia, id  PRON");
  });
  it("PRON decl 4 var 2 with empty stem2 → ox2 uses stem1", () => {
    const form = dictionaryForm(pron("i", "", 4, 2));
    expect(form).toBe("idem, iadem, idem  PRON");
  });
  it("PRON decl 4 var 0 (neither 1 nor 2) → falls through to fallback (line 199 falsy)", () => {
    const form = dictionaryForm(pron("qu", "cu", 4, 0));
    // Neither var 1 nor var 2 → ox1/ox2/ox3 stay null → fallback to stem1
    expect(form).toBe("qu  PRON");
  });
});

// ===========================================================================
// Line 247: DEP INF chained ?? fallback
// DEP_INF[`${which}.${variant}`] ?? DEP_INF[String(which)] ?? "i"
// Need: which.variant misses AND which misses → final "i" fallback
// ===========================================================================
describe("dictionaryForm: DEP INF fallback paths (line 247)", () => {
  it("DEP with which=5 → both keys miss → final fallback 'i'", () => {
    const form = dictionaryForm(verb(["test", "test", "", "test"], 5, 1, "DEP"));
    expect(form).toContain("testi");
  });
  it("DEP 1st conj with empty stem2 → stem2||stem1 fallback on line 247", () => {
    const form = dictionaryForm(verb(["hort", "", "", "hortat"], 1, 1, "DEP"));
    // stem2 is "" → stem2 || stem1 = "hort" → "hort" + "ari" = "hortari"
    expect(form).toContain("hortari");
  });
  it("DEP 3,4 with empty stem2 → stem2||stem1 + 'iri'", () => {
    const form = dictionaryForm(verb(["part", "", "", "partit"], 3, 4, "DEP"));
    expect(form).toContain("partiri");
  });
});

// ===========================================================================
// Lines 382-389: ADJ POS branches (all `s2 || s1` falsy paths)
// ===========================================================================
describe("dictionaryForm: ADJ POS stem2 fallback (lines 382-389)", () => {
  it("which=3 var=1 with empty stem2 (line 382)", () => {
    expect(dictionaryForm(adj(["acer", "", "", ""], 3, 1, "POS"))).toBe(
      "acer, (gen.), aceris  ADJ",
    );
  });
  it("which=3 var=2 with empty stem2 (line 383)", () => {
    expect(dictionaryForm(adj(["fort", "", "", ""], 3, 2, "POS"))).toBe(
      "fortis, fortis, forte  ADJ",
    );
  });
  it("which=3 var=3 with empty stem2 (line 384)", () => {
    expect(dictionaryForm(adj(["felix", "", "", ""], 3, 3, "POS"))).toBe(
      "felix, felixis, felixe  ADJ",
    );
  });
  it("which=3 var=6 with empty stem2 (line 385)", () => {
    expect(dictionaryForm(adj(["inops", "", "", ""], 3, 6, "POS"))).toBe(
      "inops, (gen.), inopsos  ADJ",
    );
  });
  it("var=2 with empty stem2 (line 388)", () => {
    expect(dictionaryForm(adj(["pulcher", "", "", ""], 1, 2, "POS"))).toBe(
      "pulcher, pulchera, pulcherum  ADJ",
    );
  });
  it("var=3 with empty stem2 (line 389)", () => {
    expect(dictionaryForm(adj(["ali", "", "", ""], 1, 3, "POS"))).toBe(
      "alius, alia, alium (gen -ius)  ADJ",
    );
  });
  it("default with empty stem2 (line 390)", () => {
    expect(dictionaryForm(adj(["bon", "", "", ""], 1, 1, "POS"))).toBe("bonus, bona, bonum  ADJ");
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
  it("con 3,3 → -o, -ere", () => {
    const f = v(["cap", "cap", "cep", "capt"], 3, 3);
    expect(f).toContain("capo");
    expect(f).toContain("capere");
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
  it("unknown con → default -o, -re", () => {
    const f = v(["test", "test", "", ""], 4, 1);
    expect(f).toContain("testo");
    expect(f).toContain("testre");
  });
});

// ---------------------------------------------------------------------------
// dictionaryForm: remaining branch coverage (from branch-coverage)
// ---------------------------------------------------------------------------
describe("dictionaryForm: remaining branch coverage", () => {
  it("noun with unknown declension (default case)", () => {
    const de: DictionaryEntry = {
      stems: ["test", "test", "", ""],
      part: { pofs: "N", n: { decl: { which: 8, var: 1 }, gender: "M", kind: "T" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "test",
    };
    const form = dictionaryForm(de);
    expect(form).toContain("N");
    expect(form).toContain("M");
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

  it("PRON with decl 2 (no specific form, falls back)", () => {
    const de: DictionaryEntry = {
      stems: ["test", "test", "", ""],
      part: { pofs: "PRON", pron: { decl: { which: 2, var: 1 }, kind: "ADJECT" } },
      tran: { age: "X", area: "X", geo: "X", freq: "X", source: "X" },
      mean: "test",
    };
    const form = dictionaryForm(de);
    expect(form).toBe("test  PRON");
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
  it("DEP with unusual conjugation hits chained fallback (line 247)", () => {
    const form = dictionaryForm(verb(["test", "test", "", "test"], 7, 1, "DEP"));
    expect(form).toContain("testor");
    expect(form).toContain("testi");
    expect(form).toContain("DEP");
  });

  it("DEP with which.variant key match in DEP_INF (line 247 first ??)", () => {
    const form = dictionaryForm(verb(["part", "part", "", "partit"], 3, 4, "DEP"));
    expect(form).toContain("partiri");
  });

  it("PERFDEF without stem3 but with stem4 (line 255 not taken)", () => {
    const form = dictionaryForm(verb(["", "", "zzz", "os"], 0, 0, "PERFDEF"));
    expect(form).toContain("osus");
    expect(form).not.toContain("zzzi");
  });

  it("PERFDEF with stem3 present (line 255 taken)", () => {
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

  it("which=3, var=5 (no specific case) falls through to default", () => {
    const form = dictionaryForm(adj(["test", "test", "", ""], 3, 5, "POS"));
    expect(form).toBe("testus, testa, testum  ADJ");
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
