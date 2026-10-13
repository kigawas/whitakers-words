import { describe, expect, it } from "vitest";
import { dictionaryForm } from "../../../src/lib/formatter/dictionary-form.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";
import { createEngine } from "../../../src/node/index.js";

const engine = createEngine();

function makePron(
  stems: [string, string],
  which: number,
  variant: number,
  kind = "ADJECT",
): DictionaryEntry {
  return {
    stems: [stems[0], stems[1], "", ""] as const,
    part: {
      pofs: "PRON" as const,
      pron: {
        decl: { which: which as 1, var: variant as 1 },
        kind: kind as "ADJECT",
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
// Declension 3 — hic, haec, hoc
// ---------------------------------------------------------------------------
describe("dictionaryForm: PRON decl 3", () => {
  it("var 1 — hic, haec, hoc", () => {
    const form = dictionaryForm(makePron(["h", "hu"], 3, 1));
    expect(form).toBe("hic, haec, hoc  PRON");
  });

  it("var 2 — stem + uc for neuter", () => {
    const form = dictionaryForm(makePron(["h", "hu"], 3, 2));
    expect(form).toBe("hic, haec, huc  PRON");
  });
});

// ---------------------------------------------------------------------------
// Declension 4 — is/ea/id and idem/eadem/idem
// ---------------------------------------------------------------------------
describe("dictionaryForm: PRON decl 4", () => {
  it("var 1 — is, ea, id", () => {
    const form = dictionaryForm(makePron(["i", "e"], 4, 1));
    expect(form).toBe("is, ea, id  PRON");
  });

  it("var 2 — idem, eadem, idem", () => {
    const form = dictionaryForm(makePron(["i", "e"], 4, 2));
    expect(form).toBe("idem, eadem, idem  PRON");
  });
});

// ---------------------------------------------------------------------------
// Declension 6 — ille/iste/olle and ipse
// ---------------------------------------------------------------------------
describe("dictionaryForm: PRON decl 6", () => {
  it("var 1 — ille, illa, illud", () => {
    const form = dictionaryForm(makePron(["ill", "ill"], 6, 1));
    expect(form).toBe("ille, illa, illud  PRON");
  });

  it("var 1 — iste, ista, istud", () => {
    const form = dictionaryForm(makePron(["ist", "ist"], 6, 1));
    expect(form).toBe("iste, ista, istud  PRON");
  });

  it("var 1 — olle, olla, ollud", () => {
    const form = dictionaryForm(makePron(["oll", "oll"], 6, 1));
    expect(form).toBe("olle, olla, ollud  PRON");
  });

  it("var 2 — ipse, ipsa, ipsum", () => {
    const form = dictionaryForm(makePron(["ips", "ips"], 6, 2));
    expect(form).toBe("ipse, ipsa, ipsum  PRON");
  });
});

// ---------------------------------------------------------------------------
// Declension 9 — abbreviated and undeclined
// ---------------------------------------------------------------------------
describe("dictionaryForm: PRON decl 9", () => {
  it("var 8 — abbreviated", () => {
    const form = dictionaryForm(makePron(["Id", "zzz"], 9, 8));
    expect(form).toBe("Id., abb.  PRON");
  });

  it("var 9 — undeclined", () => {
    const form = dictionaryForm(makePron(["tot", "zzz"], 9, 9));
    expect(form).toBe("tot, undeclined  PRON");
  });

  it("with one stem, the stem alone (Ada declines only N, ADJ and V 9 from one)", () => {
    expect(dictionaryForm(makePron(["tot", ""], 9, 9))).toBe("tot  PRON");
  });
});

// ---------------------------------------------------------------------------
// Fallback — declensions without specific form logic
// ---------------------------------------------------------------------------
describe("dictionaryForm: headwords for the pronouns Ada gives no form", () => {
  it("decl 1 — the qu- pronoun of the entry's kind", () => {
    expect(dictionaryForm(makePron(["qu", "cu"], 1, 0, "REL"))).toBe("qui, quae, quod  PRON");
    expect(dictionaryForm(makePron(["qu", "cu"], 1, 0, "INTERR"))).toBe("quis, quid  PRON");
  });

  it("decl 5 — the personal pronoun", () => {
    expect(dictionaryForm(makePron(["ego", "m"], 5, 1, "PERS"))).toBe("ego  PRON");
  });

  it("no headword — no form, as Ada", () => {
    expect(dictionaryForm(makePron(["xyz", "xy"], 1, 0))).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Integration: real dictionary entries through engine
// ---------------------------------------------------------------------------
describe("dictionaryForm: PRON integration with engine", () => {
  function findPronForm(word: string): string[] {
    const a = engine.parseWord(word);
    return [
      ...new Set(
        a.results.filter((r) => r.de.part.pofs === "PRON").map((r) => dictionaryForm(r.de)),
      ),
    ];
  }

  it("hic → hic, haec, hoc  PRON", () => {
    expect(findPronForm("hic")).toContain("hic, haec, hoc  PRON");
  });

  it("ille → ille, illa, illud  PRON", () => {
    expect(findPronForm("ille")).toContain("ille, illa, illud  PRON");
  });

  it("iste → iste, ista, istud  PRON", () => {
    expect(findPronForm("iste")).toContain("iste, ista, istud  PRON");
  });

  it("ipse → ipse, ipsa, ipsum  PRON", () => {
    expect(findPronForm("ipse")).toContain("ipse, ipsa, ipsum  PRON");
  });

  it("is → is, ea, id  PRON", () => {
    const forms = findPronForm("is");
    expect(forms.some((f) => f === "is, ea, id  PRON")).toBe(true);
  });

  it("idem parsed as tackon (i + -dem)", () => {
    // idem is handled via tackon addon, not direct PRON result
    const a = engine.parseWord("idem");
    expect(a.addonResults.length).toBeGreaterThan(0);
  });

  it("formatted output for ille matches Ada", () => {
    const output = engine.formatWord("ille");
    expect(output).toContain("ille, illa, illud  PRON");
    expect(output).not.toContain("ill  PRON");
  });

  it("formatted output for hic matches Ada", () => {
    const output = engine.formatWord("hic");
    expect(output).toContain("hic, haec, hoc  PRON");
    expect(output).not.toContain("h  PRON");
  });
});
