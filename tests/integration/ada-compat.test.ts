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
// Nouns of kind P (a person: homo, soror, rex) keep their plurals. Only
// capitalized kind-P entries are names (Moses) and lose them.
// Ada expected from latin-words.com.
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
});

// ---------------------------------------------------------------------------
// Deus is entered as a proper name (De De N 2 1 M N, "God; god; ...") but is
// also the common noun "god", so it is exempt from the proper-name filter.
// Other kind-N names still lose plural and locative readings.
// ---------------------------------------------------------------------------

describe("ada-compat: deus has plurals; other proper names do not", () => {
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

  it("aeneas, cari, anchise: no plural or locative of the proper name", () => {
    expect(outputLines("aeneas")).not.toContainEqual(
      expect.stringContaining("aene.as              N      1 8 ACC P M"),
    );
    expect(outputLines("cari")).not.toContainEqual(
      expect.stringContaining("car.i                N      2 1 NOM P M"),
    );
    expect(outputLines("anchise")).not.toContainEqual(
      expect.stringContaining("anchis.e             N      3 8 LOC S M"),
    );
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
// differs from the one before. Expected blocks are from aeneid-expected.txt,
// except that the port prints the stem ("qu  PRON") where Ada prints none.
// ---------------------------------------------------------------------------

describe("ada-compat: qu- pronouns (issue #29)", () => {
  const REL = "who; that; which, what; of which kind/degree; person/thing/time/point that;";
  const INTERR = "who/what/which?, what/which one/man/person/thing? what kind/type of?;";
  const INDEF = "who/whatever, everyone who, all that, anything that;";
  const INDEF_ANY = "anyone/anybody/anything; whoever you pick; something (or other); any (NOM S);";
  const ADJECT = "any; anyone/anything, any such; unspecified some; (after si/sin/sive/ne);";
  const ADJECT_Q = "who?, which?, what?; what kind of?;";

  it("qui: NOM P M with the five 1 0 meanings, then NOM S M with the four 1 1 meanings", () => {
    expect(block("qui", "qu.i", 12)).toEqual([
      "qu.i                 PRON   1 0 NOM P M",
      "qu  PRON   [XXXAO]",
      REL,
      INTERR,
      INDEF,
      ADJECT,
      ADJECT_Q,
      "qu.i                 PRON   1 0 NOM S M",
      REL,
      INDEF,
      ADJECT,
      ADJECT_Q,
    ]);
  });

  it("quae: NOM P F, NOM S F and NOM/ACC P N, each with its own entries", () => {
    expect(block("quae", "qu.ae", 17)).toEqual([
      "qu.ae                PRON   1 0 NOM P F",
      "qu  PRON   [XXXAO]",
      REL,
      INTERR,
      INDEF,
      ADJECT,
      ADJECT_Q,
      "qu.ae                PRON   1 0 NOM S F",
      REL,
      INDEF_ANY,
      INDEF,
      ADJECT,
      ADJECT_Q,
      "qu.ae                PRON   1 0 NOM P N",
      "qu.ae                PRON   1 0 ACC P N",
      INDEF_ANY,
      ADJECT,
    ]);
  });

  it("quod: NOM/ACC S N with the four 1 7 meanings only", () => {
    expect(block("quod", "qu.od", 7)).toEqual([
      "qu.od                PRON   1 0 NOM S N",
      "qu.od                PRON   1 0 ACC S N",
      "qu  PRON   [XXXAO]",
      REL,
      INDEF,
      ADJECT,
      ADJECT_Q,
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
