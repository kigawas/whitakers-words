import { describe, expect, it } from "vitest";
import { dictionaryForm } from "../../../src/lib/formatter/dictionary-form.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";
import { createEngine } from "../../../src/node/index.js";

const engine = createEngine();

// ---------------------------------------------------------------------------
// Helper to build a minimal noun DictionaryEntry for unit testing
// ---------------------------------------------------------------------------
function makeNoun(
  stems: [string, string],
  which: number,
  variant: number,
  gender: string,
): DictionaryEntry {
  return {
    stems: [stems[0], stems[1], "", ""] as const,
    part: {
      pofs: "N" as const,
      n: {
        decl: { which: which as 1, var: variant as 1 },
        gender: gender as "M",
        kind: "T" as const,
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

// ---------------------------------------------------------------------------
// 1st declension variants
// ---------------------------------------------------------------------------
describe("dictionaryForm: 1st declension nouns", () => {
  it("var 1 — standard (aqua, aquae)", () => {
    const form = dictionaryForm(makeNoun(["aqu", "aqu"], 1, 1, "F"));
    expect(form).toBe("aqua, aquae  N (1st) F");
  });

  it("var 6 — Greek -e (Crete, Cretes)", () => {
    const form = dictionaryForm(makeNoun(["Cret", "Cret"], 1, 6, "F"));
    expect(form).toBe("Crete, Cretes  N F");
  });

  it("var 7 — Greek -es (orestes, orestae)", () => {
    const form = dictionaryForm(makeNoun(["orest", "orest"], 1, 7, "M"));
    expect(form).toBe("orestes, orestae  N M");
  });

  it("var 8 — Greek -as (Boreas, Boreae)", () => {
    const form = dictionaryForm(makeNoun(["Bore", "Bore"], 1, 8, "M"));
    expect(form).toBe("Boreas, Boreae  N M");
  });

  it("var 6 — no ordinal shown for Greek variants", () => {
    const form = dictionaryForm(makeNoun(["nymph", "nymph"], 1, 6, "F"));
    expect(form).not.toContain("(1st)");
    expect(form).toBe("nymphe, nymphes  N F");
  });
});

// ---------------------------------------------------------------------------
// 2nd declension variants
// ---------------------------------------------------------------------------
describe("dictionaryForm: 2nd declension nouns", () => {
  it("var 1 — standard M (dominus, domini)", () => {
    const form = dictionaryForm(makeNoun(["domin", "domin"], 2, 1, "M"));
    expect(form).toBe("dominus, domini  N (2nd) M");
  });

  it("var 2 — neuter (bellum, belli)", () => {
    const form = dictionaryForm(makeNoun(["bell", "bell"], 2, 2, "N"));
    expect(form).toBe("bellum, belli  N (2nd) N");
  });

  it("var 3 — ager type: stem1 IS nominative (ager, agri)", () => {
    const form = dictionaryForm(makeNoun(["ager", "agr"], 2, 3, "M"));
    expect(form).toBe("ager, agri  N (2nd) M");
  });

  it("var 3 — puer type: same stem1/stem2 (puer, pueri)", () => {
    const form = dictionaryForm(makeNoun(["puer", "puer"], 2, 3, "M"));
    expect(form).toBe("puer, pueri  N (2nd) M");
  });

  it("var 3 — vir type (vir, viri)", () => {
    const form = dictionaryForm(makeNoun(["vir", "vir"], 2, 3, "M"));
    expect(form).toBe("vir, viri  N (2nd) M");
  });

  it("var 4 — neuter -ium with (i) genitive (imperium, imperi(i))", () => {
    const form = dictionaryForm(makeNoun(["imperi", "imperi"], 2, 4, "N"));
    expect(form).toBe("imperium, imperi(i)  N (2nd) N");
  });

  it("var 4 — masculine -ius with (i) genitive (socius, soci(i))", () => {
    const form = dictionaryForm(makeNoun(["soci", "soci"], 2, 4, "M"));
    expect(form).toBe("socius, soci(i)  N (2nd) M");
  });

  it("var 4 — common gender (conscius, consci(i))", () => {
    const form = dictionaryForm(makeNoun(["consci", "consci"], 2, 4, "C"));
    expect(form).toBe("conscius, consci(i)  N (2nd) C");
  });

  it("var 5 — stem2 empty (Julius, Juli)", () => {
    const form = dictionaryForm(makeNoun(["Juli", "Juli"], 2, 5, "M"));
    expect(form).toBe("Julius, Juli  N (2nd) M");
  });

  it("var 6 — Greek -os (cervos, cervi)", () => {
    const form = dictionaryForm(makeNoun(["cerv", "cerv"], 2, 6, "M"));
    expect(form).toBe("cervos, cervi  N M");
  });

  it("var 6 — no ordinal for Greek variant", () => {
    const form = dictionaryForm(makeNoun(["Tyr", "Tyr"], 2, 6, "F"));
    expect(form).not.toContain("(2nd)");
  });

  it("var 7 — Greek -os (same as var 6)", () => {
    const form = dictionaryForm(makeNoun(["Hymenae", "Hymenae"], 2, 7, "M"));
    expect(form).toBe("Hymenaeos, Hymenaei  N M");
  });

  it("var 8 — Greek -on (aron, ari)", () => {
    const form = dictionaryForm(makeNoun(["ar", "ar"], 2, 8, "N"));
    expect(form).toBe("aron, ari  N N");
  });

  it("var 9 — (avos, avi)", () => {
    const form = dictionaryForm(makeNoun(["av", "av"], 2, 9, "M"));
    expect(form).toBe("avus, avi  N M");
  });
});

// ---------------------------------------------------------------------------
// 3rd declension variants
// ---------------------------------------------------------------------------
describe("dictionaryForm: 3rd declension nouns", () => {
  it("var 1 — standard (rex, regis)", () => {
    const form = dictionaryForm(makeNoun(["rex", "reg"], 3, 1, "M"));
    expect(form).toBe("rex, regis  N (3rd) M");
  });

  it("var 3 — (as, assis)", () => {
    const form = dictionaryForm(makeNoun(["as", "ass"], 3, 3, "M"));
    expect(form).toBe("as, assis  N (3rd) M");
  });

  it("var 6 — Greek, no ordinal (aether, aetheris)", () => {
    const form = dictionaryForm(makeNoun(["aether", "aether"], 3, 6, "M"));
    expect(form).toBe("aether, aetheris  N M");
    expect(form).not.toContain("(3rd)");
  });

  it("var 6 — Greek with different stem2 (heros, herois)", () => {
    const form = dictionaryForm(makeNoun(["heros", "hero"], 3, 6, "M"));
    expect(form).toBe("heros, herois  N M");
  });

  it("var 7 — Greek -os/is genitive (chlamys, chlamydos/is)", () => {
    const form = dictionaryForm(makeNoun(["chlamys", "chlamyd"], 3, 7, "F"));
    expect(form).toBe("chlamys, chlamydos/is  N F");
  });

  it("var 7 — Greek -os/is (lampas, lampados/is)", () => {
    const form = dictionaryForm(makeNoun(["lampas", "lampad"], 3, 7, "F"));
    expect(form).toBe("lampas, lampados/is  N F");
  });

  it("var 9 — Greek -os/is (Titan, Titanos/is)", () => {
    const form = dictionaryForm(makeNoun(["Titan", "Titan"], 3, 9, "M"));
    expect(form).toBe("Titan, Titanos/is  N M");
  });

  it("var 9 — Greek -os/is with different stem2 (tigris, tigros/is)", () => {
    const form = dictionaryForm(makeNoun(["tigris", "tigr"], 3, 9, "M"));
    expect(form).toBe("tigris, tigros/is  N M");
  });

  it("var 9 — Greek (bas, baseos/is)", () => {
    const form = dictionaryForm(makeNoun(["bas", "base"], 3, 9, "F"));
    expect(form).toBe("bas, baseos/is  N F");
  });
});

// ---------------------------------------------------------------------------
// 4th declension variants
// ---------------------------------------------------------------------------
describe("dictionaryForm: 4th declension nouns", () => {
  it("var 1 — standard (manus, manus)", () => {
    const form = dictionaryForm(makeNoun(["man", "man"], 4, 1, "F"));
    expect(form).toBe("manus, manus  N (4th) F");
  });

  it("var 2 — neuter with -u nominative (cornu, cornus)", () => {
    const form = dictionaryForm(makeNoun(["corn", "corn"], 4, 2, "N"));
    expect(form).toBe("cornu, cornus  N (4th) N");
  });

  it("var 2 — neuter (genu, genus)", () => {
    const form = dictionaryForm(makeNoun(["gen", "gen"], 4, 2, "N"));
    expect(form).toBe("genu, genus  N (4th) N");
  });

  it("var 3 — (gestus, gestu)", () => {
    const form = dictionaryForm(makeNoun(["gest", "gest"], 4, 3, "M"));
    expect(form).toBe("gestus, gestu  N (4th) M");
  });
});

// ---------------------------------------------------------------------------
// 5th declension
// ---------------------------------------------------------------------------
describe("dictionaryForm: 5th declension nouns", () => {
  it("standard (res, rei)", () => {
    const form = dictionaryForm(makeNoun(["r", "r"], 5, 1, "F"));
    expect(form).toBe("res, rei  N (5th) F");
  });
});

// ---------------------------------------------------------------------------
// 9th declension (special)
// ---------------------------------------------------------------------------
describe("dictionaryForm: declension 9 (special nouns)", () => {
  it("var 8 — abbreviated (A., abb.)", () => {
    const form = dictionaryForm(makeNoun(["A", ""], 9, 8, "M"));
    expect(form).toBe("A., abb.  N M");
  });

  it("var 9 — undeclined (fas, undeclined)", () => {
    const form = dictionaryForm(makeNoun(["fas", ""], 9, 9, "N"));
    expect(form).toBe("fas, undeclined  N N");
  });

  it("var 9 — undeclined (nihil, undeclined)", () => {
    const form = dictionaryForm(makeNoun(["nihil", ""], 9, 9, "N"));
    expect(form).toBe("nihil, undeclined  N N");
  });

  it("no ordinal shown for declension 9", () => {
    const form = dictionaryForm(makeNoun(["fas", ""], 9, 9, "N"));
    expect(form).not.toContain("(9th)");
    expect(form).not.toContain("(");
  });
});

// ---------------------------------------------------------------------------
// Ordinal display rule: only when which 1-5 AND var 1-5
// ---------------------------------------------------------------------------
describe("dictionaryForm: ordinal display rules", () => {
  it("shows ordinal for standard variants (1,1)", () => {
    const form = dictionaryForm(makeNoun(["aqu", "aqu"], 1, 1, "F"));
    expect(form).toContain("(1st)");
  });

  it("shows ordinal for standard variants (2,1)", () => {
    const form = dictionaryForm(makeNoun(["domin", "domin"], 2, 1, "M"));
    expect(form).toContain("(2nd)");
  });

  it("shows ordinal for standard variants (3,1)", () => {
    const form = dictionaryForm(makeNoun(["rex", "reg"], 3, 1, "M"));
    expect(form).toContain("(3rd)");
  });

  it("shows ordinal for standard variants (4,1)", () => {
    const form = dictionaryForm(makeNoun(["man", "man"], 4, 1, "F"));
    expect(form).toContain("(4th)");
  });

  it("shows ordinal for standard variants (5,1)", () => {
    const form = dictionaryForm(makeNoun(["r", "r"], 5, 1, "F"));
    expect(form).toContain("(5th)");
  });

  it("hides ordinal for Greek var 6", () => {
    const form = dictionaryForm(makeNoun(["nymph", "nymph"], 1, 6, "F"));
    expect(form).not.toMatch(/\(\d/);
  });

  it("hides ordinal for Greek var 7", () => {
    const form = dictionaryForm(makeNoun(["chlamys", "chlamyd"], 3, 7, "F"));
    expect(form).not.toMatch(/\(\d/);
  });

  it("hides ordinal for Greek var 8", () => {
    const form = dictionaryForm(makeNoun(["Bore", "Bore"], 1, 8, "M"));
    expect(form).not.toMatch(/\(\d/);
  });

  it("hides ordinal for Greek var 9", () => {
    const form = dictionaryForm(makeNoun(["Titan", "Titan"], 3, 9, "M"));
    expect(form).not.toMatch(/\(\d/);
  });

  it("hides ordinal for decl 9", () => {
    const form = dictionaryForm(makeNoun(["fas", ""], 9, 9, "N"));
    expect(form).not.toMatch(/\(\d/);
  });
});

// ---------------------------------------------------------------------------
// Integration: verify against engine-parsed real dictionary entries
// ---------------------------------------------------------------------------
describe("dictionaryForm: integration with real dictionary entries", () => {
  function findNounForm(word: string): string[] {
    const a = engine.parseWord(word);
    return a.results.filter((r) => r.de.part.pofs === "N").map((r) => dictionaryForm(r.de));
  }

  it("ager → ager, agri  N (2nd) M", () => {
    expect(findNounForm("ager")).toContain("ager, agri  N (2nd) M");
  });

  it("puer → puer, pueri  N (2nd) M", () => {
    expect(findNounForm("puer")).toContain("puer, pueri  N (2nd) M");
  });

  it("vir → vir, viri  N (2nd) M", () => {
    expect(findNounForm("vir")).toContain("vir, viri  N (2nd) M");
  });

  it("imperium → imperium, imperi(i)  N (2nd) N", () => {
    expect(findNounForm("imperium")).toContain("imperium, imperi(i)  N (2nd) N");
  });

  it("cornu → cornu, cornus  N (4th) N", () => {
    expect(findNounForm("cornu")).toContain("cornu, cornus  N (4th) N");
  });

  it("fas → fas, undeclined  N N", () => {
    expect(findNounForm("fas")).toContain("fas, undeclined  N N");
  });

  it("nihil → nihil, undeclined  N N", () => {
    expect(findNounForm("nihil")).toContain("nihil, undeclined  N N");
  });

  it("boreas → Boreas, Boreae  N M", () => {
    expect(findNounForm("boreas")).toContain("Boreas, Boreae  N M");
  });

  it("crete → Crete, Cretes  N F", () => {
    expect(findNounForm("crete")).toContain("Crete, Cretes  N F");
  });

  it("nymphe → nymphe, nymphes  N F", () => {
    const forms = findNounForm("nymphe");
    expect(forms.some((f) => f.includes("nymphe, nymphes"))).toBe(true);
  });

  it("aether → aether, aetheris  N M (no ordinal)", () => {
    const forms = findNounForm("aether");
    expect(forms).toContain("aether, aetheris  N M");
  });

  it("chlamys → chlamys, chlamydos/is  N F", () => {
    const forms = findNounForm("chlamys");
    expect(forms.some((f) => f.includes("chlamydos/is"))).toBe(true);
  });

  it("titan → Titan, Titanos/is  N M", () => {
    const forms = findNounForm("titan");
    expect(forms.some((f) => f.includes("Titanos/is"))).toBe(true);
  });
});
