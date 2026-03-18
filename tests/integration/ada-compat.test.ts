import { describe, expect, it } from "vitest";
import { createEngine } from "../../src/node";

/**
 * Ada compatibility tests — comparing our output line-by-line against the
 * original Ada Whitaker's Words expected output.
 *
 * Each test asserts exact inflection lines, dictionary forms, and meanings
 * as produced by the Ada reference implementation.
 */

const engine = createEngine();

/** Helper: split formatWord output into non-empty trimmed lines. */
function outputLines(word: string): string[] {
  return engine
    .formatWord(word)
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
}

// ---------------------------------------------------------------------------
// Aeneid Book IV, line 1: "at regina gravi iamdudum saucia cura"
// Ada expected from test/01_aeneid/expected.txt
// ---------------------------------------------------------------------------

describe("ada-compat: at", () => {
  it("matches Ada output exactly", () => {
    const lines = outputLines("at");
    expect(lines).toContainEqual("at                   CONJ");
    expect(lines).toContainEqual("at  CONJ   [XXXAO]");
    expect(lines).toContainEqual(expect.stringContaining("but, but on the other hand"));
  });
});

describe("ada-compat: regina", () => {
  // Ada: regin.a N 1 1 NOM/VOC/ABL S F, regina/reginae N (1st) F [XXXAX], queen;
  it("matches Ada inflection lines", () => {
    const lines = outputLines("regina");
    expect(lines).toContainEqual("regin.a              N      1 1 NOM S F");
    expect(lines).toContainEqual("regin.a              N      1 1 VOC S F");
    expect(lines).toContainEqual("regin.a              N      1 1 ABL S F");
  });

  it("matches Ada dictionary form and meaning", () => {
    const lines = outputLines("regina");
    expect(lines).toContainEqual("regina, reginae  N (1st) F   [XXXAX]");
    expect(lines).toContainEqual(expect.stringContaining("queen"));
  });
});

describe("ada-compat: gravi", () => {
  // Ada: grav.i ADJ 3 2 DAT/ABL S X POS, gravis/grave/gravior/gravissimus ADJ [XXXAX]
  it("matches Ada inflection lines", () => {
    const lines = outputLines("gravi");
    expect(lines).toContainEqual("grav.i               ADJ    3 2 DAT S X POS");
    expect(lines).toContainEqual("grav.i               ADJ    3 2 ABL S X POS");
  });

  it("matches Ada dictionary form with comparative/superlative", () => {
    const lines = outputLines("gravi");
    expect(lines).toContainEqual(
      "gravis, grave, gravior -or -us, gravissimus -a -um  ADJ   [XXXAX]",
    );
    expect(lines).toContainEqual(expect.stringContaining("heavy; painful; important; serious"));
  });
});

describe("ada-compat: iamdudum", () => {
  // Ada: iamdudum ADV POS, jamdudum ADV [XXXBL]
  it("matches Ada output exactly", () => {
    const lines = outputLines("iamdudum");
    expect(lines).toContainEqual("iamdudum             ADV    POS");
    expect(lines).toContainEqual("jamdudum  ADV   [XXXBL]");
    expect(lines).toContainEqual(expect.stringContaining("long ago/before/since"));
    // Should NOT have extra ADV variants
    expect(lines).not.toContainEqual(expect.stringContaining("ADV    X"));
    expect(lines).not.toContainEqual(expect.stringContaining("ADV    COMP"));
    expect(lines).not.toContainEqual(expect.stringContaining("ADV    SUPER"));
  });
});

describe("ada-compat: saucia", () => {
  // Ada: sauci.a ADJ 1 1 NOM/VOC/ABL S F POS + NOM/VOC/ACC P N POS,
  //      saucius/saucia/saucium ADJ [XXXBX], wounded;
  //      sauci.a V 1 1 PRES ACTIVE IMP 2 S, saucio/sauciare V (1st) [XXXDX]
  it("matches Ada ADJ inflection lines", () => {
    const lines = outputLines("saucia");
    expect(lines).toContainEqual("sauci.a              ADJ    1 1 NOM S F POS");
    expect(lines).toContainEqual("sauci.a              ADJ    1 1 VOC S F POS");
    expect(lines).toContainEqual("sauci.a              ADJ    1 1 ABL S F POS");
    expect(lines).toContainEqual("sauci.a              ADJ    1 1 NOM P N POS");
    expect(lines).toContainEqual("sauci.a              ADJ    1 1 VOC P N POS");
    expect(lines).toContainEqual("sauci.a              ADJ    1 1 ACC P N POS");
  });

  it("matches Ada ADJ dictionary form", () => {
    const lines = outputLines("saucia");
    expect(lines).toContainEqual("saucius, saucia, saucium  ADJ   [XXXBX]");
    expect(lines).toContainEqual(expect.stringContaining("wounded; ill, sick"));
  });

  it("matches Ada V inflection", () => {
    const lines = outputLines("saucia");
    expect(lines).toContainEqual("sauci.a              V      1 1 PRES ACTIVE  IMP 2 S");
    expect(lines).toContainEqual(
      "saucio, sauciare, sauciavi, sauciatus  V (1st)   [XXXDX]    lesser",
    );
    expect(lines).toContainEqual(expect.stringContaining("wound, hurt; gash, stab"));
  });
});

describe("ada-compat: cura", () => {
  // Ada: cur.a N 1 1 NOM/VOC/ABL S F, cura/curae N (1st) F [XXXAO]
  //      cur.a V 1 1 PRES ACTIVE IMP 2 S, curo/curare V (1st) [XXXAO]
  it("matches Ada N inflection lines", () => {
    const lines = outputLines("cura");
    expect(lines).toContainEqual("cur.a                N      1 1 NOM S F");
    expect(lines).toContainEqual("cur.a                N      1 1 VOC S F");
    expect(lines).toContainEqual("cur.a                N      1 1 ABL S F");
  });

  it("matches Ada N dictionary form", () => {
    const lines = outputLines("cura");
    expect(lines).toContainEqual("cura, curae  N (1st) F   [XXXAO]");
    expect(lines).toContainEqual(expect.stringContaining("concern, worry, anxiety"));
  });

  it("matches Ada V inflection", () => {
    const lines = outputLines("cura");
    expect(lines).toContainEqual("cur.a                V      1 1 PRES ACTIVE  IMP 2 S");
    expect(lines).toContainEqual("curo, curare, curavi, curatus  V (1st)   [XXXAO]");
  });
});

// ---------------------------------------------------------------------------
// "rem acu tetigisti" — the original smoke test (test/expected.txt)
// ---------------------------------------------------------------------------

describe("ada-compat: rem", () => {
  it("matches Ada output", () => {
    const lines = outputLines("rem");
    expect(lines).toContainEqual("r.em                 N      5 1 ACC S F");
    expect(lines).toContainEqual("res, rei  N (5th) F   [XXXAX]");
    expect(lines).toContainEqual(expect.stringContaining("thing; event/affair/business"));
  });
});

describe("ada-compat: tetigisti", () => {
  it("matches Ada output", () => {
    const lines = outputLines("tetigisti");
    expect(lines).toContainEqual("tetig.isti           V      3 1 PERF ACTIVE  IND 2 S");
    expect(lines).toContainEqual("tango, tangere, tetigi, tactus  V (3rd)   [XXXAX]");
    expect(lines).toContainEqual(
      expect.stringContaining("touch, strike; border on, influence; mention"),
    );
  });
});

// ---------------------------------------------------------------------------
// "nullius" — test/02_ius/expected.txt
// ---------------------------------------------------------------------------

describe("ada-compat: nullius", () => {
  it("matches Ada inflection", () => {
    const lines = outputLines("nullius");
    expect(lines).toContainEqual("null.ius             ADJ    1 3 GEN S X POS");
  });

  it("matches Ada meaning", () => {
    const lines = outputLines("nullius");
    expect(lines).toContainEqual(expect.stringContaining("no; none, not any"));
  });
});

// ---------------------------------------------------------------------------
// "luce" — verb with zzz stem (no supine)
// Ada: luco, lucere, luxi, -  V (2nd)
// ---------------------------------------------------------------------------

describe("ada-compat: luce", () => {
  it("matches Ada N 2 result (lucus)", () => {
    const lines = outputLines("luce");
    expect(lines).toContainEqual("luc.e                N      2 1 VOC S M");
    expect(lines).toContainEqual("lucus, luci  N (2nd) M   [XXXAX]");
    expect(lines).toContainEqual(expect.stringContaining("grove; sacred grove"));
  });

  it("matches Ada V result with - for missing stem (luceo)", () => {
    const lines = outputLines("luce");
    expect(lines).toContainEqual("luc.e                V      2 1 PRES ACTIVE  IMP 2 S");
    // Ada shows "luceo" (2nd conj -eo), "luxi, -" for missing supine stem
    expect(lines).toContainEqual(expect.stringContaining("luceo, lucere, luxi, -  V (2nd)"));
    expect(lines).not.toContainEqual(expect.stringContaining("zzz"));
  });

  it("matches Ada N 3 result (lux)", () => {
    const lines = outputLines("luce");
    expect(lines).toContainEqual("luc.e                N      3 1 ABL S F");
    expect(lines).toContainEqual("lux, lucis  N (3rd) F   [XXXAX]");
    expect(lines).toContainEqual(expect.stringContaining("light, daylight"));
  });
});

// ---------------------------------------------------------------------------
// "multus" — adj with zzz comparative stem, noun with zzz stem1
// Ada: multus, multa -um, -, plurimus -a -um  ADJ
//      -, multae  N (1st) F
// ---------------------------------------------------------------------------

describe("ada-compat: multus", () => {
  it("ADJ dictionary form shows - for missing comparative stem", () => {
    const lines = outputLines("multus");
    // zzz comp stem → "-"
    expect(lines).toContainEqual(expect.stringContaining("-, plurimus -a -um  ADJ"));
    expect(lines).not.toContainEqual(expect.stringContaining("zzz"));
  });

  it("equus: no neuter ACC S for masculine noun", () => {
    const lines = outputLines("equus");
    expect(lines).toContainEqual(expect.stringContaining("NOM S M"));
    // ACC S N should be filtered — equus is masculine, not neuter
    expect(lines.some((l) => l.includes("ACC S N"))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// zzz placeholder handling across all POS types
// ---------------------------------------------------------------------------

describe("ada-compat: zzz stem placeholder", () => {
  it("never appears in formatted output", () => {
    // Words known to have zzz stems
    const words = ["luce", "multus", "bonus", "possum"];
    for (const word of words) {
      const output = engine.formatWord(word);
      expect(output, `"${word}" should not contain zzz`).not.toContain("zzz");
    }
  });
});

// ---------------------------------------------------------------------------
// Wildcard resolution correctness
// ---------------------------------------------------------------------------

describe("ada-compat: wildcard resolution", () => {
  it("resolves gender C→F from dictionary (regina)", () => {
    const output = engine.formatWord("regina");
    expect(output).toContain("NOM S F");
    expect(output).not.toContain("NOM S C");
  });

  it("resolves declension variant 0→2 from dictionary (gravi)", () => {
    const output = engine.formatWord("gravi");
    expect(output).toContain("ADJ    3 2");
    expect(output).not.toContain("ADJ    3 0");
  });

  it("resolves verb conjugation 0 0→3 1 from dictionary (tetigisti)", () => {
    const output = engine.formatWord("tetigisti");
    expect(output).toContain("V      3 1 PERF");
  });

  it("resolves VPAR conjugation from dictionary (amatum)", () => {
    const output = engine.formatWord("amatum");
    expect(output).toContain("VPAR   1 1");
  });

  it("resolves ADV comparison from stem key (iamdudum)", () => {
    const output = engine.formatWord("iamdudum");
    expect(output).toContain("ADV    POS");
    expect(output).not.toContain("ADV    X");
  });
});

// ---------------------------------------------------------------------------
// Syncope — syncopated perfect verb forms
// ---------------------------------------------------------------------------

describe("ada-compat: syncope", () => {
  it("sociare: shows syncope r => v.r for syncopated perfect", () => {
    const lines = outputLines("sociare");
    // Standard present results
    expect(lines).toContainEqual("soci.are             V      1 1 PRES ACTIVE  INF 0 X");
    // Syncope annotation
    expect(lines).toContainEqual("Syncope   r => v.r");
    expect(lines).toContainEqual("Syncopated perfect often drops the 'v' and contracts vowel");
    // Expanded perfect form
    expect(lines).toContainEqual("sociav.ere           V      1 1 PERF ACTIVE  IND 3 P");
  });

  it("audisti: shows syncope s => vis for 4th conjugation", () => {
    const lines = outputLines("audisti");
    expect(lines).toContainEqual("Syncope   s => vis");
    expect(lines).toContainEqual("audiv.isti           V      4 1 PERF ACTIVE  IND 2 S");
    expect(lines).toContainEqual(expect.stringContaining("audio, audire, audivi, auditus"));
  });

  it("noris: shows syncope r => v.r for nosco", () => {
    const lines = outputLines("noris");
    expect(lines).toContainEqual("Syncope   r => v.r");
    expect(lines).toContainEqual(expect.stringContaining("nov.eris"));
    expect(lines).toContainEqual(expect.stringContaining("nosco, noscere, novi, notus"));
  });

  it("petisti: shows syncope s => vis for peto", () => {
    const lines = outputLines("petisti");
    expect(lines).toContainEqual("Syncope   s => vis");
    expect(lines).toContainEqual("petiv.isti           V      3 1 PERF ACTIVE  IND 2 S");
    expect(lines).toContainEqual(expect.stringContaining("peto, petere, petivi, petitus"));
  });

  it("curare: shows syncope for syncopated curavere", () => {
    const lines = outputLines("curare");
    expect(lines).toContainEqual("Syncope   r => v.r");
    expect(lines).toContainEqual("curav.ere            V      1 1 PERF ACTIVE  IND 3 P");
  });

  it("only accepts perfect-system verbs (key=3)", () => {
    const a = engine.parseWord("sociare");
    expect(a.syncopeResult).not.toBeNull();
    if (a.syncopeResult) {
      for (const r of a.syncopeResult.results) {
        expect(r.ir.qual.pofs).toBe("V");
        expect(r.ir.key).toBe(3);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Two-word splitting — final fallback
// ---------------------------------------------------------------------------

describe("ada-compat: two-word splitting", () => {
  it("iarbas: found as proper name (DICTLINE.SUP)", () => {
    const lines = outputLines("iarbas");
    expect(lines).toContainEqual(expect.stringContaining("Iarbas"));
  });

  it("annam: prefix an + nam", () => {
    const lines = outputLines("annam");
    expect(lines).toContainEqual("an                   PREFIX");
    expect(lines).toContainEqual(expect.stringContaining("nam"));
  });

  it("hecate: found as proper name (DICTLINE.SUP)", () => {
    const lines = outputLines("hecate");
    expect(lines).toContainEqual(expect.stringContaining("Hecate"));
  });

  it("does not split words with valid standard results", () => {
    const a = engine.parseWord("regina");
    expect(a.twoWordResult).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Comprehensive word output checks — tricks, syncope, slury, tackons
// ---------------------------------------------------------------------------
describe("word output checks", () => {
  it("hamavit: flip trick ham→am, finds amo", () => {
    const lines = outputLines("hamavit");
    expect(lines).toContainEqual("Word mod ham/am");
    expect(lines).toContainEqual(expect.stringContaining("amo, amare"));
    expect(lines).toContainEqual(expect.stringContaining("love"));
  });

  it("audistis: syncope, finds audio PERF", () => {
    const lines = outputLines("audistis");
    expect(lines).toContainEqual(expect.stringContaining("Syncope"));
    expect(lines).toContainEqual(expect.stringContaining("audio, audire"));
    expect(lines).toContainEqual(expect.stringContaining("PERF ACTIVE"));
  });

  it("predam: flip_flop slur pre→prae, finds praeda", () => {
    const lines = outputLines("predam");
    expect(lines).toContainEqual(expect.stringContaining("Slur"));
    expect(lines).toContainEqual(expect.stringContaining("praeda"));
    expect(lines).toContainEqual(expect.stringContaining("booty"));
  });

  it("dixti: syncope s/x, finds dico PERF", () => {
    const lines = outputLines("dixti");
    expect(lines).toContainEqual(expect.stringContaining("Syncope"));
    expect(lines).toContainEqual(expect.stringContaining("dico, dicere"));
    expect(lines).toContainEqual(expect.stringContaining("PERF ACTIVE"));
  });

  it("ammoverunt: direct + slur, finds ammoveo and admoveo", () => {
    const lines = outputLines("ammoverunt");
    expect(lines).toContainEqual(expect.stringContaining("Slur"));
    expect(lines).toContainEqual(expect.stringContaining("ammoveo"));
    expect(lines).toContainEqual(expect.stringContaining("admoveo"));
  });

  it("ludica: suffix stripping ic, finds ludus", () => {
    const lines = outputLines("ludica");
    expect(lines).toContainEqual(expect.stringContaining("SUFFIX"));
    expect(lines).toContainEqual(expect.stringContaining("ludus, ludi"));
    expect(lines).toContainEqual(expect.stringContaining("game"));
  });

  it("amare ADV: only POS, not COMP/SUPER (stem1 = key 1)", () => {
    const a = engine.parseWord("amare");
    const advResults = a.results.filter((r) => r.ir.qual.pofs === "ADV");
    expect(advResults.length).toBe(1);
    expect(advResults[0]!.ir.qual.adv.comparison).toBe("POS");
  });

  it("amarius ADV: only COMP (stem2 = key 2)", () => {
    const a = engine.parseWord("amarius");
    const advResults = a.results.filter((r) => r.ir.qual.pofs === "ADV");
    expect(advResults.length).toBe(1);
    expect(advResults[0]!.ir.qual.adv.comparison).toBe("COMP");
  });

  it("amarissime ADV: only SUPER (stem3 = key 3)", () => {
    const a = engine.parseWord("amarissime");
    const advResults = a.results.filter((r) => r.ir.qual.pofs === "ADV");
    expect(advResults.length).toBe(1);
    expect(advResults[0]!.ir.qual.adv.comparison).toBe("SUPER");
  });

  it("bene ADV: POS only (stem1 of bene/melius/optime)", () => {
    const a = engine.parseWord("bene");
    const advResults = a.results.filter(
      (r) => r.ir.qual.pofs === "ADV" && r.de.mean.includes("well"),
    );
    expect(advResults.length).toBeGreaterThan(0);
    expect(advResults.every((r) => r.ir.qual.adv.comparison === "POS")).toBe(true);
  });

  it("melius ADV: COMP only", () => {
    const a = engine.parseWord("melius");
    const advResults = a.results.filter(
      (r) => r.ir.qual.pofs === "ADV" && r.de.mean.includes("well"),
    );
    expect(advResults.length).toBeGreaterThan(0);
    expect(advResults.every((r) => r.ir.qual.adv.comparison === "COMP")).toBe(true);
  });

  it("optime ADV: SUPER only", () => {
    const a = engine.parseWord("optime");
    const advResults = a.results.filter(
      (r) => r.ir.qual.pofs === "ADV" && r.de.mean.includes("well"),
    );
    expect(advResults.length).toBeGreaterThan(0);
    expect(advResults.every((r) => r.ir.qual.adv.comparison === "SUPER")).toBe(true);
  });

  it("idem: tackon dem + PRON, no ADJ imus", () => {
    const lines = outputLines("idem");
    expect(lines).toContainEqual(expect.stringContaining("TACKON"));
    expect(lines).toContainEqual(expect.stringContaining("idem, eadem, idem"));
    // Should NOT contain ADJ "imus" results
    expect(lines.some((l) => l.includes("imus"))).toBe(false);
  });

  it("inritata: slur in/i~, finds irrito VPAR", () => {
    const lines = outputLines("inritata");
    expect(lines).toContainEqual(expect.stringContaining("Slur in/i~"));
    expect(lines).toContainEqual(expect.stringContaining("irrito, irritare"));
    expect(lines).toContainEqual(expect.stringContaining("VPAR"));
  });

  it("iritata: medieval double consonant r→rr, finds irrito VPAR", () => {
    const lines = outputLines("iritata");
    expect(lines).toContainEqual("Word mod r -> rr");
    expect(lines).toContainEqual(expect.stringContaining("irrito, irritare"));
    expect(lines).toContainEqual(expect.stringContaining("VPAR"));
  });

  it("equus: NOM S M only, no neuter ACC", () => {
    const lines = outputLines("equus");
    expect(lines).toContainEqual(expect.stringContaining("NOM S M"));
    expect(lines).toContainEqual(expect.stringContaining("horse"));
    expect(lines.some((l) => l.includes("ACC S N"))).toBe(false);
  });

  it("multus: ADJ NOM S M POS only, no COMP forms", () => {
    const lines = outputLines("multus");
    expect(lines).toContainEqual(expect.stringContaining("NOM S M POS"));
    expect(lines).toContainEqual(expect.stringContaining("much, many"));
    expect(lines.some((l) => l.includes("COMP"))).toBe(false);
  });
});
