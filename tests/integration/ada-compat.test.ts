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

/** The run of `count` lines starting at the first line that starts with `first`. */
function block(word: string, first: string, count: number): string[] {
  const lines = outputLines(word);
  const start = lines.findIndex((l) => l.startsWith(first));
  expect(start).toBeGreaterThanOrEqual(0);
  return lines.slice(start, start + count);
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

  it("ludica: only the six correct ADJ 1 1 forms (no spurious accusative singular)", () => {
    // The "ic" suffix forms a 1st/2nd-declension adjective, so the suffix's
    // target (ADJ 1 1) acts as the part-entry the inflections are matched and
    // resolved against — exactly as the dictionary search does. Endings from
    // other declensions (ADJ 2 3 VOC/ABL S, ADJ 3 6 ACC S C) must not leak
    // through, and the surviving endings resolve to the target's "1 1": there
    // is no accusative-singular "ludica" (that would be "ludicam"); the only
    // legitimate "-a" accusative is the neuter plural.
    const lines = outputLines("ludica");
    const adjForms = lines.filter((l) => l.startsWith("ludic.a") && l.includes("ADJ"));
    const unique = [...new Set(adjForms)].sort();
    expect(unique).toEqual([
      "ludic.a              ADJ    1 1 ABL S F POS",
      "ludic.a              ADJ    1 1 ACC P N POS",
      "ludic.a              ADJ    1 1 NOM P N POS",
      "ludic.a              ADJ    1 1 NOM S F POS",
      "ludic.a              ADJ    1 1 VOC P N POS",
      "ludic.a              ADJ    1 1 VOC S F POS",
    ]);
    // Defensive: no accusative singular survives under any declension.
    for (const form of adjForms) {
      expect(form).not.toContain("ACC S");
    }
  });

  it("pelagum: shows 'uncommon' inflection frequency tag", () => {
    const output = engine.formatWord("pelagum");
    expect(output).toContain("uncommon");
    expect(output).toContain("GEN P");
  });

  it("quidam: PACKON dam + qui (certain)", () => {
    const a = engine.parseWord("quidam");
    expect(a.addonResults.length).toBeGreaterThan(0);
    const packon = a.addonResults.find((ar) => ar.type === "tackon" && ar.addon.word === "dam");
    expect(packon).toBeDefined();
    expect(packon!.addon.mean).toContain("certain");
    // Base results should be PRON/PACK "qui"
    expect(packon!.baseResults.some((r) => r.ir.qual.pofs === "PRON")).toBe(true);
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

// ---------------------------------------------------------------------------
// Nouns of kind P (a person: homo, soror, rex) keep their plurals, as in Ada,
// including capitalized ones: classes of people (Amazon, Siren) and names
// (Moses). Ada expected from latin-words.com.
// ---------------------------------------------------------------------------

describe("ada-compat: person nouns (kind P) have plurals", () => {
  it("latrones: latron.es NOM P M, not the -es SUFFIX reading", () => {
    const lines = outputLines("latrones");
    expect(lines).toContainEqual("latron.es            N      3 1 NOM P M");
    expect(lines).not.toContainEqual(expect.stringContaining("SUFFIX"));
  });

  it("latronum: latron.um GEN P M, not two words", () => {
    const lines = outputLines("latronum");
    expect(lines).toContainEqual("latron.um            N      3 1 GEN P M");
    expect(lines).not.toContainEqual(expect.stringContaining("Two words"));
  });

  it("hominum: homin.um GEN P M of homo, not omen through h-dropping", () => {
    const lines = outputLines("hominum");
    expect(lines).toContainEqual("homin.um             N      3 1 GEN P M");
    expect(lines).toContainEqual("homo, hominis  N (3rd) M   [XXXAX]");
    expect(lines).not.toContainEqual(expect.stringContaining("omen, ominis"));
  });

  it("sororibus: soror.ibus DAT P F, not two words", () => {
    const lines = outputLines("sororibus");
    expect(lines).toContainEqual("soror.ibus           N      3 1 DAT P F");
    expect(lines).not.toContainEqual(expect.stringContaining("Two words"));
  });

  it("deabus: de.abus DAT P F, not two words", () => {
    const lines = outputLines("deabus");
    expect(lines).toContainEqual(
      expect.stringContaining("de.abus              N      1 1 DAT P F"),
    );
    expect(lines).not.toContainEqual(expect.stringContaining("Two words"));
  });

  it("viri: vir.i NOM P M alongside the GEN S readings", () => {
    const lines = outputLines("viri");
    expect(lines).toContainEqual("vir.i                N      2 3 NOM P M");
    expect(lines).toContainEqual("vir.i                N      2 3 GEN S M");
  });

  it("regum: reg.um GEN P M", () => {
    expect(outputLines("regum")).toContainEqual("reg.um               N      3 1 GEN P M");
  });

  it("comites: comit.es NOM P C", () => {
    expect(outputLines("comites")).toContainEqual("comit.es             N      3 1 NOM P C");
  });

  it("amazones: amazon.es NOM, VOC and ACC P F, not the -es SUFFIX reading", () => {
    const lines = outputLines("amazones");
    expect(lines).toEqual(
      expect.arrayContaining([
        "amazon.es            N      3 1 NOM P F",
        "amazon.es            N      3 1 VOC P F",
        "amazon.es            N      3 1 ACC P F",
      ]),
    );
    expect(lines).not.toContainEqual(expect.stringContaining("SUFFIX"));
  });

  it("naiades: naiad.es NOM and VOC P F of Naias", () => {
    expect(outputLines("naiades")).toEqual([
      "naiad.es             N      3 7 NOM P F",
      "naiad.es             N      3 7 VOC P F",
      "Naias, Naiados/is  N F   [XXXDX]    lesser",
      "Naiad; water nymph; nymph;",
    ]);
  });

  it("sirenes: siren.es NOM and VOC P F, not si PREFIX + ren", () => {
    expect(outputLines("sirenes")).toEqual([
      "siren.es             N      3 9 NOM P F",
      "siren.es             N      3 9 VOC P F",
      "Siren, Sirenos/is  N F   [XYXCO]",
      "Siren; (lured sailors with song); type of drone/solitary bee/wasp);",
    ]);
  });

  it("luperci: luperc.i LOC S, NOM P and VOC P besides GEN S", () => {
    expect(outputLines("luperci")).toEqual([
      "luperc.i             N      2 1 GEN S M",
      "luperc.i             N      2 1 LOC S M",
      "luperc.i             N      2 1 NOM P M",
      "luperc.i             N      2 1 VOC P M",
      "Lupercus, Luperci  N (2nd) M   [XXXDX]    lesser",
      "protector against wolves (Pan); priest in Lycean fertility festival (15 Feb);",
    ]);
  });

  it("moses: mos.es NOM and VOC P M besides the singulars", () => {
    expect(outputLines("moses")).toEqual([
      "moses                N      3 8 NOM S M",
      "moses                N      3 8 VOC S M",
      "mos.es               N      3 8 ACC S M",
      "mos.es               N      3 8 NOM P M",
      "mos.es               N      3 8 VOC P M",
      "Moses, Mosis  N M   [EEQEE]    Later  uncommon",
      "Moses;",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Proper names (kind N) keep their plural and locative readings, as in Ada:
// Deus (De De N 2 1 M N, "God; god; ..."), Carus, Iuppiter, Diana. The
// port's own names in DICTLINE.SUP, which Ada lacks, follow the same rule.
// ---------------------------------------------------------------------------

describe("ada-compat: proper names have plurals and locatives", () => {
  it("deorum: de.orum GEN P M under Deus, Dei", () => {
    const lines = outputLines("deorum");
    expect(lines).toContainEqual("de.orum              N      2 1 GEN P M");
    expect(lines).toContainEqual("Deus, Dei  N (2nd) M   [XEXAO]");
  });

  it("deos: de.os ACC P M", () => {
    expect(outputLines("deos")).toContainEqual("de.os                N      2 1 ACC P M");
  });

  it("dei: de.i NOM P M alongside GEN S", () => {
    const lines = outputLines("dei");
    expect(lines).toContainEqual("de.i                 N      2 1 NOM P M");
    expect(lines).toContainEqual("de.i                 N      2 1 GEN S M");
  });

  it("cari: car.i LOC S, NOM P and VOC P of Carus (expected:18061)", () => {
    expect(outputLines("cari")).toEqual(
      expect.arrayContaining([
        "car.i                N      2 1 GEN S M",
        "car.i                N      2 1 LOC S M",
        "car.i                N      2 1 NOM P M",
        "car.i                N      2 1 VOC P M",
        "Carus, Cari  N (2nd) M   [DLIEO]    Late  uncommon",
      ]),
    );
  });

  it("iovis: iov.is ACC P M (expected:4674)", () => {
    expect(outputLines("iovis")).toContainEqual(
      "iov.is               N      3 3 ACC P M                   Early",
    );
  });

  it("dianae: dian.ae LOC S, NOM P and VOC P (expected:26093)", () => {
    expect(outputLines("dianae")).toEqual(
      expect.arrayContaining([
        "dian.ae              N      1 1 LOC S F",
        "dian.ae              N      1 1 NOM P F",
        "dian.ae              N      1 1 VOC P F",
      ]),
    );
  });

  it("tacitis: Tacitus DAT, ABL and LOC P (expected:18490)", () => {
    expect(outputLines("tacitis")).toEqual(
      expect.arrayContaining([
        "tacit.is             N      2 1 LOC P M",
        "tacit.is             N      2 1 DAT P M",
        "tacit.is             N      2 1 ABL P M",
        "Tacitus, Taciti  N (2nd) M   [DLIDZ]    Late  lesser",
      ]),
    );
  });

  it("mercurium: the uncommon GEN P of Mercuria and Mercurius (expected:11295)", () => {
    const lines = outputLines("mercurium");
    expect(lines.filter((l) => l.startsWith("mercuri.um") && l.includes("GEN P"))).toEqual([
      "mercuri.um           N      1 1 GEN P M                   uncommon",
      "mercuri.um           N      2 1 GEN P M                   uncommon",
    ]);
  });

  it("zephyros: zephyr.os ACC P, which trims the archaic NOM S (expected:11370)", () => {
    expect(outputLines("zephyros").filter((l) => l.startsWith("zephyr.os"))).toEqual([
      "zephyr.os            N      2 1 ACC P M",
    ]);
  });

  it("aeneas: the port's own names get plurals too (aene.as ACC P)", () => {
    expect(outputLines("aeneas")).toContainEqual("aene.as              N      1 8 ACC P M");
  });
});

// ---------------------------------------------------------------------------
// Adjectives entered only as COMP or SUPER (pri ADJ 0 0 COMP, pessi ADJ 0 0
// SUPER) list one stem but inflect it as stem 3 or 4, as Ada's makedict does.
// ---------------------------------------------------------------------------

describe("ada-compat: comparison-only adjectives", () => {
  it("pessimam: pessi.mam ACC S F SUPER, not two words", () => {
    const lines = outputLines("pessimam");
    expect(lines).toContainEqual("pessi.mam            ADJ    0 0 ACC S F SUPER");
    expect(lines).not.toContainEqual(expect.stringContaining("Two words"));
  });

  it("summus: sum.mus NOM S M SUPER, not two words", () => {
    const lines = outputLines("summus");
    expect(lines).toContainEqual("sum.mus              ADJ    0 0 NOM S M SUPER");
    expect(lines).not.toContainEqual(expect.stringContaining("Two words"));
  });

  it("proximam: proxi.mam ACC S F SUPER", () => {
    expect(outputLines("proximam")).toContainEqual("proxi.mam            ADJ    0 0 ACC S F SUPER");
  });

  it("prior: pri.or NOM S C COMP besides the noun prior, prioris", () => {
    const lines = outputLines("prior");
    expect(lines).toContainEqual("pri.or               ADJ    0 0 NOM S C COMP");
    expect(lines).toContainEqual("prior, prior, prius  ADJ   [XXXAX]");
  });

  it("propior: propi.or NOM S C COMP", () => {
    expect(outputLines("propior")).toContainEqual("propi.or             ADJ    0 0 NOM S C COMP");
  });

  it("intima: inti.ma NOM S F SUPER besides the verb intimo", () => {
    expect(outputLines("intima")).toContainEqual("inti.ma              ADJ    0 0 NOM S F SUPER");
  });

  it("sume, compluria: the lone stem no longer matches as stem 1", () => {
    expect(outputLines("sume")).not.toContainEqual(expect.stringContaining("summus"));
    expect(outputLines("compluria")).not.toContainEqual(expect.stringContaining("complurimus"));
  });
});

// ---------------------------------------------------------------------------
// qu- pronouns (issue #29). Ada matches a PRON 1 x inflection only to entries
// of the same declension variant, and prints a dictionary line only when it
// differs from the one before. The meanings under each inflection are Ada's
// (aeneid-expected.txt). Where Ada prints no form, the port prints headwords
// and groups the meanings under them.
// ---------------------------------------------------------------------------

describe("ada-compat: qu- pronouns (issue #29)", () => {
  const REL = "who; that; which, what; of which kind/degree; person/thing/time/point that;";
  const INTERR = "who/what/which?, what/which one/man/person/thing? what kind/type of?;";
  const INDEF = "who/whatever, everyone who, all that, anything that;";
  const INDEF_ANY = "anyone/anybody/anything; whoever you pick; something (or other); any (NOM S);";
  const ADJECT = "any; anyone/anything, any such; unspecified some; (after si/sin/sive/ne);";
  const ADJECT_Q = "who?, which?, what?; what kind of?;";
  const QUI = "qui, quae, quod  PRON   [XXXAO]";
  const QUIS = "quis, quid  PRON   [XXXAO]";
  const QUA = "qui, qua, quod  PRON   [XXXAO]";
  const QUIS_QUA = "quis, qua, quid  PRON   [XXXAO]";

  it("qui: NOM P M with the five 1 0 meanings, then NOM S M with the four 1 1 meanings", () => {
    expect(block("qui", "qu.i", 16)).toEqual([
      "qu.i                 PRON   1 0 NOM P M",
      QUI,
      REL,
      INDEF,
      ADJECT_Q,
      QUIS,
      INTERR,
      QUA,
      ADJECT,
      "qu.i                 PRON   1 0 NOM S M",
      QUI,
      REL,
      INDEF,
      ADJECT_Q,
      QUA,
      ADJECT,
    ]);
  });

  it("quae: NOM P F, NOM S F and NOM/ACC P N, each with its own entries", () => {
    expect(block("quae", "qu.ae", 24)).toEqual([
      "qu.ae                PRON   1 0 NOM P F",
      QUI,
      REL,
      INDEF,
      ADJECT_Q,
      QUIS,
      INTERR,
      QUA,
      ADJECT,
      "qu.ae                PRON   1 0 NOM S F",
      QUI,
      REL,
      INDEF,
      ADJECT_Q,
      "qui, qua, quod  PRON   [XXXBO]",
      ADJECT,
      "quis, qua, quid  PRON   [XXXBO]",
      INDEF_ANY,
      "qu.ae                PRON   1 0 NOM P N",
      "qu.ae                PRON   1 0 ACC P N",
      QUA,
      ADJECT,
      QUIS_QUA,
      INDEF_ANY,
    ]);
  });

  it("quod: NOM/ACC S N with the four 1 7 meanings only", () => {
    expect(block("quod", "qu.od", 8)).toEqual([
      "qu.od                PRON   1 0 NOM S N",
      "qu.od                PRON   1 0 ACC S N",
      QUI,
      REL,
      INDEF,
      ADJECT_Q,
      QUA,
      ADJECT,
    ]);
  });
});

// ---------------------------------------------------------------------------
// -dam packons (quidam). As in Ada's Process_Packons, the stripped qu-/cu-
// form is read as a PRON and attached to the PACK entry whose meaning names
// the packon; m turns back from n before -dam (quendam = quem + dam).
// Ada expected from latin-words.com.
// ---------------------------------------------------------------------------

describe("ada-compat: -dam packon forms", () => {
  const CERTAIN = "(w/-dam) certain; as INDEF a certain thing; somebody, one, something;";

  it("quendam: qu.em ACC S M under qu PACK (w/-dam)", () => {
    const lines = outputLines("quendam");
    expect(lines).toContainEqual("dam                  TACKON");
    expect(lines).toContainEqual("qu.em                PRON   1 0 ACC S M");
    expect(lines).toContainEqual("qu  PACK   [XXXBX]");
    expect(lines).toContainEqual(CERTAIN);
  });

  it("quandam: qu.am ACC S F", () => {
    expect(outputLines("quandam")).toContainEqual("qu.am                PRON   1 0 ACC S F");
  });

  it("quorundam: qu.orum GEN P M and GEN P N", () => {
    const lines = outputLines("quorundam");
    expect(lines).toContainEqual("qu.orum              PRON   1 0 GEN P M");
    expect(lines).toContainEqual("qu.orum              PRON   1 0 GEN P N");
  });

  it("quarundam: qu.arum GEN P F", () => {
    expect(outputLines("quarundam")).toContainEqual("qu.arum              PRON   1 0 GEN P F");
  });

  it("cuiusdam: cu.jus GEN S X", () => {
    expect(outputLines("cuiusdam")).toContainEqual("cu.jus               PRON   1 0 GEN S X");
  });

  it("quiddam: qu.id NOM/ACC S N besides quiddam N 9 9", () => {
    const lines = outputLines("quiddam");
    expect(lines).toContainEqual("qu.id                PRON   1 0 NOM S N");
    expect(lines).toContainEqual("qu.id                PRON   1 0 ACC S N");
    expect(lines).toContainEqual(
      "(w/-dam) a certain (one), a certain thing; somebody, one, something;",
    );
    expect(lines).toContainEqual("quiddam              N      9 9 X   X N");
  });

  it("quidam: the PACK meaning, not the plain qu- pronoun meanings", () => {
    const lines = outputLines("quidam");
    expect(lines).toContainEqual("qu.i                 PRON   1 0 NOM S M");
    expect(lines).toContainEqual("qu.i                 PRON   1 0 NOM P M");
    expect(lines).toContainEqual(CERTAIN);
    expect(lines).not.toContainEqual(expect.stringContaining("who; that; which, what"));
  });
});

// ---------------------------------------------------------------------------
// Found in review: a qu- form with -que has both the packon and the "and"
// reading; packons match i/j and u/v alike; DICTLINE's "|" lines print without
// their bars, next to entries of the same form (Ada's Trim_Bar).
// ---------------------------------------------------------------------------

describe("ada-compat: packon and tackon readings together", () => {
  const AND = "-que = and (enclitic, translated before attached word); completes plerus/uter;";
  const EACH = "(w/-que) each, each one; every, everybody, everything (more than 2); whatever;";

  it("quibusque, cuique: -que each (packon) and -que and (tackon)", () => {
    for (const word of ["quibusque", "cuique"]) {
      const lines = outputLines(word);
      expect(lines).toContainEqual(EACH);
      expect(lines).toContainEqual(AND);
    }
  });

  it("quiuis: the vis packon, though written with u", () => {
    const lines = outputLines("quiuis");
    expect(lines).toContainEqual("vis                  TACKON");
    expect(lines).toContainEqual("qu.i                 PRON   1 0 NOM P M");
    expect(lines).not.toContainEqual(expect.stringContaining("Two words"));
  });
});

// ---------------------------------------------------------------------------
// Ada's Enclitic tries -que on a word that already parses, and analyses what
// is left as a whole word, packons included.
// ---------------------------------------------------------------------------

describe("ada-compat: -que on a word that already parses", () => {
  const QUE = "que                  TACKON";
  const AND = "-que = and (enclitic, translated before attached word); completes plerus/uter;";

  it("atque, namque: -que and the conjunction before it (expected:6515, 32515)", () => {
    expect(block("atque", QUE, 5)).toEqual([
      QUE,
      AND,
      "at                   CONJ",
      "at  CONJ   [XXXAO]",
      "but, but on the other hand; on the contrary; while, whereas; but yet; at least;",
    ]);
    expect(block("namque", QUE, 5)).toEqual([
      QUE,
      AND,
      "nam                  CONJ",
      "nam  CONJ   [XXXAX]",
      "for, on the other hand; for instance;",
    ]);
  });

  it("neque: -que and the readings of ne (expected:8499)", () => {
    const afterQue = block("neque", QUE, 13);
    for (const line of [
      "n.e                  V      2 1 PRES ACTIVE  IMP 2 S",
      "neo, nere, nevi, netus  V (2nd)   [XXXDX]    lesser",
      "ne  ADV   [XXXAX]",
      "ne  CONJ   [XXXAX]",
    ]) {
      expect(afterQue).toContainEqual(line);
    }
  });

  it("sine: no -ne, though si parses (expected:28116)", () => {
    expect(outputLines("sine")).not.toContainEqual(expect.stringMatching(/^ne +TACKON/));
  });

  // Ada's Word tries the other tackons only when nothing, packons included,
  // has parsed (words_engine-word_package.adb:1862).
  it("quocum: a packon hit is a parse, so no cum tackon (PRON 5 0) as well", () => {
    expect(outputLines("quocum")).not.toContainEqual(
      expect.stringContaining("TACKON with (enclitic with PRON 5 0)"),
    );
  });

  it("quocumque: -que and the cum packon on quocum (expected:32218)", () => {
    expect(block("quocumque", "que                  TACKON", 9)).toEqual([
      "que                  TACKON",
      "-que = and (enclitic, translated before attached word); completes plerus/uter;",
      "cum                  TACKON",
      "PACKON w/qui pron with ABL => with what, with whom;",
      "qu.o                 PRON   1 0 ABL S M",
      "qu.o                 PRON   1 0 ABL S N",
      "qu  PACK   [XXXAX]",
      "(w/-cumque) who/whatever, no matter who/what, in any time/way, however small;",
      "(w/-cum) only ABL with whom?, with which?;",
    ]);
  });

  // Ada's Enclitic reads the base with Word, which runs the uniques first
  it("cetteque, deusque: the base's uniques, then its other readings", () => {
    // cette is only in UNIQUES.LAT (latin-words.com)
    expect(block("cetteque", QUE, 5)).toEqual([
      QUE,
      AND,
      "cette                V      3 1 PRES ACTIVE  IMP 2 P",
      "cette  X   [XXXBO]",
      "give/bring here!/hand over, come (now/here); tell/show us, out with it! behold!",
    ]);
    expect(block("deusque", QUE, 8)).toEqual([
      QUE,
      AND,
      "deus                 N      2 1 VOC S M",
      "deus  X   [XEXCX]",
      "god; God!: Oh God;",
      "de.us                N      2 1 NOM S M",
      "Deus, Dei  N (2nd) M   [XEXAO]",
      "God (Christian text); god; divine essence/being, supreme being; statue of god;",
    ]);
  });

  // Word tries the tackons after the four enclitics when nothing else parses,
  // so the base of -que can be a tackon reading itself (latin-words.com)
  it("huiusmodique, mecumque: -que on a base that is itself a tackon reading", () => {
    expect(block("huiusmodique", QUE, 7)).toEqual([
      QUE,
      AND,
      "modi                 TACKON",
      "TACKON w/GEN of ~ kind, sort, nature; (w/hic); [huiusmodi => of this sort];",
      "hu.ius               PRON   3 1 GEN S X",
      "hic, haec, hoc  PRON   [XXXAX]",
      "this; these (pl.); (also DEMONST);",
    ]);
    const mecumque = outputLines("mecumque");
    expect(mecumque).not.toContainEqual(expect.stringMatching(/^Two words/));
    expect(block("mecumque", QUE, 8)).toEqual([
      QUE,
      AND,
      "cum                  TACKON",
      "TACKON with (enclitic with PRON 5 0); [w/ABL  mecum => at my house/with me];",
      "m.e                  PRON   5 1 ABL S C",
      "m.e                  PRON   5 1 ACC S C",
      "ego  PRON   [XXXAX]",
      "I, me (PERS); myself (REFLEX);",
    ]);
    // Try_Tackons, unlike Enclitic, sweeps the base: -ce's own line goes, huius stays
    expect(outputLines("huiuscemodi")).toEqual([
      "modi                 TACKON",
      "TACKON w/GEN of ~ kind, sort, nature; (w/hic); [huiusmodi => of this sort];",
      "hu.ius               PRON   3 1 GEN S X",
      "hic, haec, hoc  PRON   [XXXAX]",
      "this; these (pl.); (also DEMONST);",
    ]);
    // idem that came through -dem stays for the outer tackon: -pte's PRON 4 0
    // base takes PRON 4 2, and the sweep drops only -dem's own line
    expect(outputLines("idempte")).toEqual([
      "pte                  TACKON",
      "TACKON ! (emphatic particle w/personal PRON); (usually with ABL, mepte);",
      "i                    PRON   4 2 NOM S M",
      "i                    PRON   4 2 NOM S N",
      "i                    PRON   4 2 ACC S N",
      "idem, eadem, idem  PRON   [XXXAX]",
      "(w/-dem ONLY, idem, eadem, idem) same, the same, the very same, also;",
    ]);
    // -dem keeps idem, even under -que
    expect(block("idemque", QUE, 8)).toEqual([
      QUE,
      AND,
      "dem                  TACKON",
      "TACKON w/i-ea-id   idem => same;",
      "i                    PRON   4 2 NOM S M",
      "i                    PRON   4 2 NOM S N",
      "i                    PRON   4 2 ACC S N",
      "idem, eadem, idem  PRON   [XXXAX]",
    ]);
  });

  // is reaches idem (PRON 4 2) only by a frequency-C ending, which Ada's
  // List_Sweep trims
  it("isque: the base has no idem readings (expected:10286)", () => {
    const lines = outputLines("isque");
    expect(lines).toContainEqual("i.s                  PRON   4 1 NOM S M");
    expect(lines).toContainEqual("i.s                  V      6 1 PRES ACTIVE  IND 2 S");
    expect(lines).not.toContainEqual(expect.stringMatching(/PRON +4 2 /));
    expect(lines).not.toContainEqual("idem, eadem, idem  PRON   [XXXAX]");
  });

  // Ada's Try_Tackons keeps only base readings that fit the tackon's base
  // (words_engine-word_package.adb:1645-1720). A qu- packon reading is PRON
  // 1 x, which fits no tackon's base. Ada's lines here are from latin-words.com.
  it("quivispte, quidamcumque: no tackon on a packon reading that does not fit", () => {
    expect(outputLines("quivispte")).not.toContainEqual(expect.stringMatching(/^pte +TACKON/));
    expect(outputLines("quidamcumque")).not.toContainEqual(
      expect.stringMatching(/^cumque +TACKON/),
    );
  });

  it("mepte, huiusmodi: only the tackon whose base declension fits", () => {
    const tackons = (word: string) => outputLines(word).filter((l) => / TACKON$/.test(l));
    // -pte has ADJ 1 0, PRON 4 0 and PRON 5 0 bases; me is PRON 5 1
    expect(tackons("mepte")).toEqual(["pte                  TACKON"]);
    expect(block("mepte", "pte                  TACKON", 3)).toEqual([
      "pte                  TACKON",
      "TACKON ! (emphatic particle w/personal PRON); (usually with ABL, mepte);",
      "m.e                  PRON   5 1 ABL S C",
    ]);
    // -modi has PRON 3 1 (huius) and PRON 4 1 (eius) bases
    expect(tackons("huiusmodi")).toEqual(["modi                 TACKON"]);
    expect(block("huiusmodi", "modi                 TACKON", 3)).toEqual([
      "modi                 TACKON",
      "TACKON w/GEN of ~ kind, sort, nature; (w/hic); [huiusmodi => of this sort];",
      "hu.ius               PRON   3 1 GEN S X",
    ]);
  });

  it("meopte, materfamilias: an ADJ base takes any adjective, an N base its declension", () => {
    expect(block("meopte", "pte                  TACKON", 3)).toEqual([
      "pte                  TACKON",
      "TACKON ! (emphatic particle w/personal ADJ); (usually with ABL, suapte);",
      "me.o                 ADJ    1 1 DAT S M POS",
    ]);
    // -familias has an N 3 0 base; mater is N 3 1
    expect(block("materfamilias", "familias             TACKON", 3)).toEqual([
      "familias             TACKON",
      "TACKON of the family/household; (archaic GEN); [pater~ => head of household];",
      "mater                N      3 1 NOM S F",
    ]);
  });

  // -est has a PRON 4 1 base, but Ada's Enclitic checks no base
  it("idest: -est on every reading of id", () => {
    const afterEst = block("idest", "est                  TACKON", 9);
    expect(afterEst).toContainEqual("i.d                  PRON   4 1 NOM S N");
    expect(afterEst).toContainEqual("id                   N      9 8 X   X M");
  });
});

describe("ada-compat: continuation meanings", () => {
  it("potior: the COMP adjective with its three meanings, apart from the verb", () => {
    expect(block("potior", "poti.or              ADJ", 6)).toEqual([
      "poti.or              ADJ    0 0 NOM S C COMP",
      "poti.or              ADJ    0 0 VOC S C COMP",
      "potior, potior, potius  ADJ   [XXXAO]",
      "better/preferable/superior; more useful/effective; more important;",
      "more important/desirable/precious; stronger, having greater control;",
      "having better claim, more entitled/qualified, carrying greater weight;",
    ]);
  });

  it("potius, delicias: no meaning keeps its leading bars", () => {
    for (const word of ["potius", "delicias"]) {
      expect(outputLines(word).filter((l) => l.startsWith("|"))).toEqual([]);
    }
  });
});

// ---------------------------------------------------------------------------
// Dictionary forms, as Ada's Dictionary_Form builds them. Expected lines are
// from aeneid-expected.txt unless marked latin-words.com.
// ---------------------------------------------------------------------------

describe("ada-compat: uniques print their own form as X", () => {
  it("eodem: eodem  X, not the idem paradigm", () => {
    expect(block("eodem", "eodem                PRON", 3)).toEqual([
      "eodem                PRON   4 2 ABL S X",
      "eodem  X   [XXXBX]",
      "same, the same, the very same; also; (idem, eadem, idem);",
    ]);
  });

  it("deus, vis, mare: the unique's line, whatever its part of speech", () => {
    expect(outputLines("deus")).toContainEqual("deus  X   [XEXCX]");
    expect(outputLines("vis")).toContainEqual("vis  X   [XXXAX]");
    expect(outputLines("mare")).toContainEqual("mare  X   [XXXFO]    veryrare");
  });

  it("eadem: three uniques share one form line and one meaning", () => {
    expect(block("eadem", "eadem                PRON", 5)).toEqual([
      "eadem                PRON   4 2 NOM S F",
      "eadem  X   [XXXBX]",
      "eadem                PRON   4 2 NOM P N",
      "eadem                PRON   4 2 ACC P N",
      "same, the same, the very same; also; (idem, eadem, idem);",
    ]);
  });
});

describe("ada-compat: a part field with an extra space", () => {
  // DICTLINE.GEN has "N       2 2 N T" for diptot and militari; Ada reads the
  // part by tokens, so the extra blank does not shift the fields.
  it("diptotum, militariis: N 2 2, with their dictionary forms", () => {
    const diptotum = outputLines("diptotum");
    expect(diptotum).toContainEqual("diptot.um            N      2 2 NOM S N");
    expect(diptotum).toContainEqual("diptotum, diptoti  N (2nd) N   [DGXES]    Late  uncommon");
    expect(outputLines("militariis")).toContainEqual(
      "militarium, militarii  N (2nd) N   [FWXEM]    Medieval  uncommon",
    );
  });

  // DICTLINE.GEN:38666 has "N      2 2  N T": the extra blank is before the gender
  it("verenda: an extra blank between fields (latin-words.com)", () => {
    expect(block("verenda", "verend.a             N", 5)).toEqual([
      "verend.a             N      2 2 NOM P N",
      "verend.a             N      2 2 VOC P N",
      "verend.a             N      2 2 ACC P N",
      "verendum, verendi  N (2nd) N   [XBXEO]    uncommon",
      "external sexual organs, private parts (pl.); [partes ~ae => private parts];",
    ]);
  });
});

describe("ada-compat: adjective dictionary forms", () => {
  it("ultimas, deterrimus: a zzz stem prints as - (latin-words.com)", () => {
    expect(outputLines("ultimas")).toContainEqual(
      "-, -, ulterior -or -us, ultimus -a -um  ADJ   [XXXDX]    lesser",
    );
    expect(outputLines("deterrimus")).toContainEqual(
      "-, -, deterior -or -us, deterrimus -a -um  ADJ   [XXXBO]",
    );
  });

  it("quot, totidem, necesse: ADJ 9 9 is undeclined", () => {
    expect(outputLines("quot")).toContainEqual("quot, undeclined  ADJ   [XXXAX]");
    expect(outputLines("totidem")).toContainEqual("totidem, undeclined  ADJ   [XXXBO]");
    expect(outputLines("necesse")).toContainEqual("necesse, undeclined  ADJ   [XXXBO]");
  });

  it("nequam, nequissimus: undeclined (latin-words.com)", () => {
    expect(outputLines("nequam")).toContainEqual("nequam, undeclined  ADJ   [XXXBO]");
    expect(outputLines("nequissimus")).toContainEqual("nequissimus, undeclined  ADJ   [XXXCO]");
  });

  it("alius: ADJ 1 5 has neuter -ud", () => {
    expect(outputLines("alius")).toContainEqual("alius, alia, aliud  ADJ   [XXXAQ]");
  });
});

describe("ada-compat: numeral dictionary forms", () => {
  it("semel, duo, tertium: the four parts of a NUM 1 x entry", () => {
    expect(outputLines("semel")).toContainEqual(
      "unus -a -um, primus -a -um, singuli -ae -a, semel  NUM   [XXXAX]",
    );
    expect(outputLines("duo")).toContainEqual(
      "duo -ae o, secundus -a -um, bini -ae -a, bis  NUM   [XXXAX]",
    );
    expect(outputLines("tertium")).toContainEqual(
      "tres -es -ia, tertius -a -um, terni -ae -a, ter  NUM   [XXXAX]",
    );
  });

  it("centum, sex: the four parts of a NUM 2 0 entry", () => {
    expect(outputLines("centum")).toContainEqual(
      "centum, centesimus -a -um, centeni -ae -a, centie (n)s  NUM   [XXXAO]",
    );
    expect(outputLines("sex")).toContainEqual(
      "sex, sextus -a -um, seni -ae -a, sexie (n)s  NUM   [XXXAX]",
    );
  });

  it("ambae: a one-stem entry prints its stem", () => {
    expect(outputLines("ambae")).toContainEqual("amb  NUM   [XXXBO]");
  });
});

describe("ada-compat: verb dictionary forms", () => {
  it("fero, aufero: only var 1 and 3 4 name the conjugation", () => {
    expect(outputLines("fero")).toContainEqual("fero, ferre, tuli, latus  V   [XXXAX]");
    expect(outputLines("aufero")).toContainEqual(
      "aufero, auferre, abstuli, ablatus  V TRANS   [XXXAO]",
    );
  });

  it("sum, absum, possum: no conjugation, and TO_BE/TO_BEING are not shown", () => {
    expect(outputLines("sum")).toContainEqual("sum, esse, fui, futurus  V   [XXXAX]");
    expect(outputLines("absum")).toContainEqual("absum, abesse, afui, afuturus  V   [XXXAO]");
    expect(outputLines("possum")).toContainEqual("possum, posse, potui, -  V   [XXXAX]");
  });

  it("fio: the infinitive fieri", () => {
    expect(outputLines("fio")).toContainEqual("fio, fieri, factus sum  V SEMIDEP   [XXXAO]");
  });

  it("refert, convenit: IMPERS 3 2 and 3 4 end in -t", () => {
    expect(outputLines("refert")).toContainEqual(
      "refert, referre, retulit, relatus est  V IMPERS   [XXXBO]",
    );
    expect(outputLines("convenit")).toContainEqual(
      "convenit, convenire, convenit, conventus est  V (4th) IMPERS   [XXXCO]",
    );
  });

  it("memini: PERFDEF keeps its missing supine as -", () => {
    expect(outputLines("memini")).toContainEqual("memini, meminisse, -  V (2nd) PERFDEF   [XXXAO]");
  });

  it("iussi: V 8 prints additional forms", () => {
    expect(outputLines("iussi")).toContainEqual(
      "jubo, jubere, additional, forms  V TRANS   [XXXCO]",
    );
  });

  it("abfero: a verb with no perfect stems keeps both dashes", () => {
    expect(outputLines("abfero")).toContainEqual("abfero, abferre, -, -  V TRANS   [XXXCO]");
  });

  it("placet: IMPERS with no perfect stem", () => {
    expect(outputLines("placet")).toContainEqual(
      "placet, placere, -, placitus est  V (2nd) IMPERS   [XXXDX]    lesser",
    );
  });
});

describe("ada-compat: a zzz stem prints as - in nouns and adverbs", () => {
  it("epos: N 3 2 with no genitive stem", () => {
    expect(outputLines("epos")).toContainEqual("epos, -  N (3rd) N   [XXXDX]    lesser");
  });

  it("nuper, uberius: ADV with a missing degree", () => {
    expect(outputLines("nuper")).toContainEqual("nuper, -, nuperrime  ADV   [XXXBO]");
    expect(outputLines("uberius")).toContainEqual("-, uberius, uberrime  ADV   [XXXDX]    lesser");
  });
});

// ---------------------------------------------------------------------------
// Ada prints no form for the qu-, aliqu- and personal pronouns (only their
// flags, " [XXXAO]"). The port prints a headword instead.
// ---------------------------------------------------------------------------

describe("pronoun headwords where Ada prints no form", () => {
  it("qui: the relative, interrogative and indefinite qu- pronouns", () => {
    const lines = outputLines("qui");
    expect(lines).toContainEqual("qui, quae, quod  PRON   [XXXAO]");
    expect(lines).toContainEqual("quis, quid  PRON   [XXXAO]");
    expect(lines).toContainEqual("qui, qua, quod  PRON   [XXXAO]");
    expect(lines).not.toContainEqual(expect.stringMatching(/^qu {2}PRON/));
  });

  it("quis: interrogative quis, quid and indefinite quis, qua, quid", () => {
    const lines = outputLines("quis");
    expect(lines).toContainEqual("quis, quid  PRON   [XXXAO]");
    expect(lines).toContainEqual("quis, qua, quid  PRON   [XXXAO]");
  });

  it("aliquis, aliquod: the substantive and the adjective", () => {
    expect(outputLines("aliquis")).toContainEqual("aliquis, aliqua, aliquid  PRON   [XXXAO]");
    expect(outputLines("aliquod")).toContainEqual("aliqui, aliqua, aliquod  PRON   [XXXAO]");
  });

  it("ego, tu, nos, vos, sibi: the personal and reflexive pronouns", () => {
    expect(outputLines("ego")).toContainEqual("ego  PRON   [XXXAX]");
    expect(outputLines("tu")).toContainEqual("tu  PRON   [XXXAX]");
    expect(outputLines("nos")).toContainEqual("nos  PRON   [XXXAX]");
    expect(outputLines("vos")).toContainEqual("vos  PRON   [XXXBO]");
    expect(outputLines("sibi")).toContainEqual("sui  PRON   [XXXAX]");
  });
});

// ---------------------------------------------------------------------------
// Ada's List_Sweep trims archaic and uncommon inflections when the same set of
// readings also has a common one. Ada expected from tests/original.
// ---------------------------------------------------------------------------

describe("ada-compat: List_Sweep trims archaic and uncommon inflections", () => {
  it("coniugis, genitoris: only GEN S of the 3rd declension", () => {
    expect(outputLines("coniugis").filter((l) => l.includes("N      3 1"))).toEqual([
      "coniug.is            N      3 1 GEN S C",
    ]);
    expect(outputLines("genitoris").filter((l) => l.startsWith("genitor.is"))).toEqual([
      "genitor.is           N      3 1 GEN S M",
    ]);
  });

  // NOM P -is is both N 3 0 (Archaic) and N 3 3 (Early, uncommon). Ada trims
  // before it drops duplicates, so the N 3 3 line survives.
  it("manis: the uncommon NOM P outlives the archaic one (expected:1785)", () => {
    expect(outputLines("manis").filter((l) => l.startsWith("man.is"))).toEqual([
      "man.is               N      3 3 GEN S M",
      "man.is               N      3 3 NOM P M                   Early     uncommon",
      "man.is               N      3 3 ACC P M                   Early",
    ]);
  });
});

// ---------------------------------------------------------------------------
// idem (PRON 4 2, "w/-dem ONLY") shares its stems with is, ea, id. Ada prints
// it wherever one of its endings fits and List_Sweep keeps it.
// ---------------------------------------------------------------------------

describe("ada-compat: idem readings of is, ea, id forms", () => {
  it("ea, eo, i (expected:19387, 24500, 19495)", () => {
    expect(block("ea", "e.a                  PRON   4 2", 6)).toEqual([
      "e.a                  PRON   4 2 NOM S F",
      "e.a                  PRON   4 2 ABL S F",
      "e.a                  PRON   4 2 NOM P N",
      "e.a                  PRON   4 2 ACC P N",
      "idem, eadem, idem  PRON   [XXXAX]",
      "(w/-dem ONLY, idem, eadem, idem) same, the same, the very same, also;",
    ]);
    expect(block("eo", "e.o                  PRON   4 2", 4)).toEqual([
      "e.o                  PRON   4 2 ABL S M",
      "e.o                  PRON   4 2 ABL S N",
      "idem, eadem, idem  PRON   [XXXAX]",
      "(w/-dem ONLY, idem, eadem, idem) same, the same, the very same, also;",
    ]);
    expect(block("i", "i                    PRON   4 2", 5)).toEqual([
      "i                    PRON   4 2 NOM S M",
      "i                    PRON   4 2 NOM S N",
      "i                    PRON   4 2 ACC S N",
      "idem, eadem, idem  PRON   [XXXAX]",
      "(w/-dem ONLY, idem, eadem, idem) same, the same, the very same, also;",
    ]);
  });

  it("eius: GEN S (latin-words.com)", () => {
    expect(block("eius", "e.ius                PRON   4 2", 3)).toEqual([
      "e.ius                PRON   4 2 GEN S X",
      "idem, eadem, idem  PRON   [XXXAX]",
      "(w/-dem ONLY, idem, eadem, idem) same, the same, the very same, also;",
    ]);
  });
});

describe("ada-compat: inflection age and frequency tags", () => {
  it("pads the age to 8 characters before the frequency", () => {
    expect(outputLines("iungere")).toContainEqual(
      "iung.ere             V      3 1 PRES PASSIVE IND 2 S      Early     uncommon",
    );
    expect(outputLines("tonitru")).toContainEqual(
      "tonitr.u             N      4 1 DAT S M                   Late      uncommon",
    );
  });

  it("labels age C as Classic", () => {
    expect(outputLines("bum")).toContainEqual(
      "b.um                 N      4 1 GEN P C                   Classic   uncommon",
    );
  });
});

// ---------------------------------------------------------------------------
// Ada's Fix_Adverb (list_package.adb:687): when no reading is an adverb, an
// ADJ 1 1 VOC S M POS also reads as the adverb in -e, and an ADJ VOC S M
// SUPER as the adverb in -me. Ada expected from aeneid-expected.txt unless
// marked latin-words.com.
// ---------------------------------------------------------------------------

describe("ada-compat: adjectives converted to adverbs", () => {
  it("perfide: the VOC S M POS also reads as perfid.e ADV (expected:15562)", () => {
    expect(outputLines("perfide")).toEqual([
      "perfid.e             ADJ    1 1 VOC S M POS",
      "perfidus, perfida, perfidum  ADJ   [XXXBX]",
      "faithless, treacherous, false, deceitful;",
      "e                    SUFFIX",
      "-ly; -ily;  Converting ADJ to ADV",
      "perfid.e             ADV    POS",
      "perfidus, perfida, perfidum  ADJ   [XXXBX]",
      "faithless, treacherous, false, deceitful;",
    ]);
  });

  it("die: one adverb, built from the first dius (expected:3998)", () => {
    // Ada builds both blocks from the first dius entry; the second repeats the first
    const lines = outputLines("die");
    expect(lines.slice(lines.indexOf("e                    SUFFIX"))).toEqual([
      "e                    SUFFIX",
      "-ly; -ily;  Converting ADJ to ADV",
      "di.e                 ADV    POS",
      "dius, dia, dium  ADJ   [XEXDO]    lesser",
      "divine; w/supernatural radiance; divinely inspired; blessed, saint (Latham);",
    ]);
  });

  it("longe: nothing added beside the adverb longe (latin-words.com)", () => {
    expect(outputLines("longe")).toEqual([
      "long.e               ADJ    1 1 VOC S M POS",
      "longus, longa -um, longior -or -us, longissimus -a -um  ADJ   [XXXAO]",
      "long; tall; tedious, taking long time; boundless; far; of specific length/time;",
      "longe                ADV    POS",
      "longe, longius, longissime  ADV   [XXXAO]",
      "far (off), distant, a long way; by far; for a long while, far (in future/past);",
    ]);
  });

  it("sanctissime: the VOC S M SUPER also reads as sanctissi.me ADV (latin-words.com)", () => {
    expect(outputLines("sanctissime")).toEqual([
      "sanctissi.me         ADJ    1 1 VOC S M SUPER",
      "sanctus, sancta -um, sanctior -or -us, sanctissimus -a -um  ADJ   [XXXAX]",
      "consecrated, sacred, inviolable; venerable, august, divine, holy, pious, just;",
      "e                    SUFFIX",
      "-estly; -estily; most -ly, very -ly  Converting ADJ to ADV",
      "sanctissi.me         ADV    SUPER",
      "sanctus, sancta -um, sanctior -or -us, sanctissimus -a -um  ADJ   [XXXAX]",
      "consecrated, sacred, inviolable; venerable, august, divine, holy, pious, just;",
    ]);
  });

  it("perphide: so does a reading through a spelling trick (latin-words.com)", () => {
    expect(outputLines("perphide")).toEqual([
      "Word mod ph/f",
      "An internal 'ph' might be rendered by 'f'",
      "perfid.e             ADJ    1 1 VOC S M POS",
      "perfidus, perfida, perfidum  ADJ   [XXXBX]",
      "faithless, treacherous, false, deceitful;",
      "e                    SUFFIX",
      "-ly; -ily;  Converting ADJ to ADV",
      "perfid.e             ADV    POS",
      "perfidus, perfida, perfidum  ADJ   [XXXBX]",
      "faithless, treacherous, false, deceitful;",
    ]);
  });

  it("magnebone: so do both halves of a two-word split (latin-words.com)", () => {
    // Ada repeats magn.e ADV, once per ADJ reading before it drops duplicates
    expect(outputLines("magnebone")).toEqual(
      expect.arrayContaining([
        "-ly; -ily;  Converting ADJ to ADV",
        "magn.e               ADV    POS",
        "bon.e                ADV    POS",
      ]),
    );
  });

  it("inpure: nothing added, as the slur reads the adverb impure (latin-words.com)", () => {
    expect(outputLines("inpure")).toContainEqual("impure               ADV    POS");
    expect(outputLines("inpure")).not.toContainEqual(expect.stringContaining("Converting ADJ"));
  });

  it("improbe: improb.e ADV, but not the slur's inprob.e (expected:19808)", () => {
    const lines = outputLines("improbe");
    expect(lines).toContainEqual("improb.e             ADV    POS");
    expect(lines).not.toContainEqual("inprob.e             ADV    POS");
  });

  it("perfideque: so does the base of a tackon (latin-words.com)", () => {
    expect(outputLines("perfideque")).toEqual([
      "que                  TACKON",
      "-que = and (enclitic, translated before attached word); completes plerus/uter;",
      "perfid.e             ADJ    1 1 VOC S M POS",
      "perfidus, perfida, perfidum  ADJ   [XXXBX]",
      "faithless, treacherous, false, deceitful;",
      "e                    SUFFIX",
      "-ly; -ily;  Converting ADJ to ADV",
      "perfid.e             ADV    POS",
      "perfidus, perfida, perfidum  ADJ   [XXXBX]",
      "faithless, treacherous, false, deceitful;",
    ]);
  });
});

// ---------------------------------------------------------------------------
// Ada's Two_Words (tricks.adb:512) splits a word only where the right half has
// at least 3 letters, and reads each half with Word, so a half can be a
// tackon or packon reading. Ada expected from aeneid-expected.txt unless
// marked latin-words.com.
// ---------------------------------------------------------------------------

describe("ada-compat: two-word splits", () => {
  it("barcaei, garamantide: no split before a 2-letter half (expected:2289, 10076)", () => {
    expect(engine.parseWord("barcaei").twoWordResult).toBeNull();
    expect(engine.parseWord("garamantide").twoWordResult).toBeNull();
  });

  it("idemmet: idem + met, idem read as i + -dem (latin-words.com)", () => {
    // met parses, but only as an imperative the sweep drops, as in Ada
    expect(outputLines("idemmet")).toEqual([
      "Two words",
      "May be 2 words combined (idem+met) If not obvious, probably incorrect",
      "dem                  TACKON",
      "TACKON w/i-ea-id   idem => same;",
      "i                    PRON   4 2 NOM S M",
      "i                    PRON   4 2 NOM S N",
      "i                    PRON   4 2 ACC S N",
      "idem, eadem, idem  PRON   [XXXAX]",
      "(w/-dem ONLY, idem, eadem, idem) same, the same, the very same, also;",
    ]);
  });

  it("quidamcumque: quidam + cumque, quidam read as qui + -dam (latin-words.com)", () => {
    expect(outputLines("quidamcumque")).toEqual(
      expect.arrayContaining([
        "May be 2 words combined (quidam+cumque) If not obvious, probably incorrect",
        "dam                  TACKON",
        "PACKON w/qui => certain; a certain (one); a certain thing;",
        "qu.i                 PRON   1 0 NOM S M",
        "cumque               ADV    POS",
      ]),
    );
  });

  it("registecum: regis + tecum, with two readings under -cum (latin-words.com)", () => {
    expect(engine.parseWord("registecum").twoWordResult?.right).toBe("tecum");
  });

  it("regishuiusmodi: no split, as the right half ends in -modi over one reading (latin-words.com)", () => {
    expect(engine.parseWord("regishuiusmodi").twoWordResult).toBeNull();
  });
});
