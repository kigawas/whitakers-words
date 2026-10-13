import { describe, expect, it } from "vitest";
import { dictionaryForm } from "../../../src/lib/formatter/dictionary-form.js";
import type { DictionaryEntry } from "../../../src/lib/types/dictionary.js";
import { createEngine } from "../../../src/node/index.js";

const _engine = createEngine();

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
      adj: {
        decl: { which: which as 1, var: variant as 1 },
        co: co as "POS",
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

describe("dictionaryForm: adjective comparison levels", () => {
  it("co=COMP (comparative only)", () => {
    const form = dictionaryForm(makeAdj(["meli", "", "", ""], 0, 0, "COMP"));
    expect(form).toBe("melior, melior, melius  ADJ");
  });

  it("co=SUPER (superlative only)", () => {
    const form = dictionaryForm(makeAdj(["opti", "", "", ""], 0, 0, "SUPER"));
    expect(form).toBe("optimus, optima, optimum  ADJ");
  });
});

describe("dictionaryForm: adjective co=X (all comparison forms)", () => {
  it("which=1, var=1 (bonus type)", () => {
    const form = dictionaryForm(makeAdj(["bon", "bon", "meli", "opti"], 1, 1, "X"));
    expect(form).toContain("bonus");
    expect(form).toContain("bona -um");
    expect(form).toContain("melior -or -us");
    expect(form).toContain("optimus -a -um");
  });

  it("which=1, var=2 (er-adjective)", () => {
    const form = dictionaryForm(makeAdj(["pulcher", "pulchr", "pulchri", "pulcherrim"], 1, 2, "X"));
    expect(form).toContain("pulcher");
    expect(form).toContain("pulchra -um");
  });

  it("which=3, var=1", () => {
    const form = dictionaryForm(makeAdj(["acer", "acr", "acri", "acerrim"], 3, 1, "X"));
    expect(form).toContain("acer");
    expect(form).toContain("acris (gen.)");
  });

  it("which=3, var=2", () => {
    const form = dictionaryForm(makeAdj(["fort", "fort", "forti", "fortissim"], 3, 2, "X"));
    expect(form).toContain("fortis");
    expect(form).toContain("forte");
  });

  it("which=3, var=3 (other)", () => {
    const form = dictionaryForm(makeAdj(["felix", "felic", "felici", "felicissim"], 3, 3, "X"));
    expect(form).toContain("felix");
    expect(form).toContain("felicis -e");
  });

  it("which not 1, 3 or 9: no form, as Ada's Not_Found", () => {
    expect(dictionaryForm(makeAdj(["bon", "bon", "mel", "optim"], 2, 1, "X"))).toBe("");
  });
});

describe("dictionaryForm: adjective co=POS (positive only)", () => {
  it("which=3, var=1", () => {
    const form = dictionaryForm(makeAdj(["acer", "acr", "", ""], 3, 1, "POS"));
    expect(form).toBe("acer, (gen.), acris  ADJ");
  });

  it("which=3, var=2", () => {
    const form = dictionaryForm(makeAdj(["fort", "fort", "", ""], 3, 2, "POS"));
    expect(form).toBe("fortis, fortis, forte  ADJ");
  });

  it("which=3, var=3", () => {
    const form = dictionaryForm(makeAdj(["felix", "felic", "", ""], 3, 3, "POS"));
    expect(form).toBe("felix, felicis, felice  ADJ");
  });

  it("which=3, var=6 (Greek)", () => {
    const form = dictionaryForm(makeAdj(["inops", "inop", "", ""], 3, 6, "POS"));
    expect(form).toBe("inops, (gen.), inopos  ADJ");
  });

  it("variant=2 (er-type, 1st/2nd decl)", () => {
    const form = dictionaryForm(makeAdj(["pulcher", "pulchr", "", ""], 1, 2, "POS"));
    expect(form).toBe("pulcher, pulchra, pulchrum  ADJ");
  });

  it("variant=3 (gen -ius)", () => {
    const form = dictionaryForm(makeAdj(["ali", "ali", "", ""], 1, 3, "POS"));
    expect(form).toBe("alius, alia, alium (gen -ius)  ADJ");
  });

  it("variant=4", () => {
    const form = dictionaryForm(makeAdj(["miser", "miser", "", ""], 1, 4, "POS"));
    expect(form).toBe("miser, misera, miserum  ADJ");
  });

  it("default (1st/2nd, var=1)", () => {
    const form = dictionaryForm(makeAdj(["bon", "bon", "", ""], 1, 1, "POS"));
    expect(form).toBe("bonus, bona, bonum  ADJ");
  });

  it("which=2 (Greek): -, stem+e, -", () => {
    const form = dictionaryForm(makeAdj(["arctic", "arctic", "", ""], 2, 1, "POS"));
    expect(form).toBe("-, arctice, -  ADJ");
  });

  it("variant=5: neuter -ud", () => {
    const form = dictionaryForm(makeAdj(["ali", "ali", "", ""], 1, 5, "POS"));
    expect(form).toBe("alius, alia, aliud  ADJ");
  });

  it("undeclined", () => {
    const form = dictionaryForm(makeAdj(["nequam", "", "", ""], 9, 9, "POS"));
    expect(form).toBe("nequam, undeclined  ADJ");
  });
});

describe("dictionaryForm: adjective co=X stem presence combos", () => {
  it("co=X with stem3 only (no stem4) shows dash for super", () => {
    const form = dictionaryForm(makeAdj(["bon", "bon", "meli", "zzz"], 1, 1, "X"));
    expect(form).toContain("melior -or -us");
    expect(form).toMatch(/, -\s+ADJ$/);
  });

  it("co=X with stem4 only (no stem3) shows dash for comp", () => {
    const form = dictionaryForm(makeAdj(["bon", "bon", "zzz", "opti"], 1, 1, "X"));
    expect(form).toContain("-");
    expect(form).toContain("optimus -a -um");
  });

  it("co=X with zzz positive stems prints - for both (ulterior, ultimus)", () => {
    const form = dictionaryForm(makeAdj(["zzz", "zzz", "ulteri", "ulti"], 3, 1, "X"));
    expect(form).toBe("-, -, ulterior -or -us, ultimus -a -um  ADJ");
  });
});
