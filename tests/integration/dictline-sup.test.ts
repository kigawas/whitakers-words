import { describe, expect, it } from "vitest";
import { createEngine } from "../../src/node";

const engine = createEngine();

/** Helper: get formatted text output lines for a word */
function outputLines(word: string): string[] {
  return engine
    .formatWord(word)
    .split("\n")
    .filter((l) => l.trim().length > 0);
}

/** Helper: find a noun result matching the given meaning substring */
function findNoun(word: string, meanFragment: string) {
  const a = engine.parseWord(word);
  return a.results.find((r) => r.ir.qual.pofs === "N" && r.de.mean.includes(meanFragment));
}

/** Helper: find an adjective result matching the given meaning substring */
function findAdj(word: string, meanFragment: string) {
  const a = engine.parseWord(word);
  return a.results.find((r) => r.ir.qual.pofs === "ADJ" && r.de.mean.includes(meanFragment));
}

// ---------------------------------------------------------------------------
// Supplementary dictionary loading
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: supplementary dictionary loaded", () => {
  it("engine includes supplementary entries", () => {
    // Aeneas should be findable — only exists in DICTLINE.SUP
    const r = findNoun("aeneas", "Aeneas");
    expect(r).toBeDefined();
  });

  it("existing DICTLINE.GEN entries still work", () => {
    // "aqua" is a common word from the main dictionary
    const r = findNoun("aquam", "water");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Aeneid — major characters
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: Aeneid characters", () => {
  it("Aeneas: N 1 8 Greek masc -as/-ae", () => {
    const r = findNoun("aeneas", "Aeneas");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("NOM");
    expect(r!.ir.qual.noun.number).toBe("S");
    expect(r!.de.part.pofs).toBe("N");
    expect(r!.de.part.n.kind).toBe("N");
  });

  it("Aenean: accusative singular of Aeneas", () => {
    const r = findNoun("aenean", "Aeneas");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
    expect(r!.ir.qual.noun.number).toBe("S");
  });

  it("Turnum: accusative of Turnus", () => {
    const r = findNoun("turnum", "Turnus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
  });

  it("Anchisae: genitive/dative of Anchises", () => {
    const lines = outputLines("anchisae");
    expect(lines).toContainEqual(expect.stringContaining("Anchises"));
  });

  it("Priami: genitive of Priamus", () => {
    const r = findNoun("priami", "Priam");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
  });

  it("Creusam: accusative of Creusa", () => {
    const r = findNoun("creusam", "Creusa");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
  });

  it("Pallantis: genitive of Pallas", () => {
    const r = findNoun("pallantis", "Pallas");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
  });

  it("Evandrum: accusative of Evander (N 2 3)", () => {
    const lines = outputLines("evandrum");
    expect(lines).toContainEqual(expect.stringContaining("Evander"));
  });

  it("Mezentius: nominative", () => {
    const r = findNoun("mezentius", "Mezentius");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("NOM");
  });

  it("Camillam: accusative of Camilla", () => {
    const r = findNoun("camillam", "Camilla");
    expect(r).toBeDefined();
  });

  it("Cassandram: accusative of Cassandra", () => {
    const r = findNoun("cassandram", "Cassandra");
    expect(r).toBeDefined();
  });

  it("Hecubae: genitive of Hecuba", () => {
    const r = findNoun("hecubae", "Hecuba");
    expect(r).toBeDefined();
  });

  it("Sinonis: genitive of Sinon", () => {
    const r = findNoun("sinonis", "Sinon");
    expect(r).toBeDefined();
  });

  it("Laocoonta: accusative of Laocoon", () => {
    const lines = outputLines("laocoonta");
    expect(lines).toContainEqual(expect.stringContaining("Laocoon"));
  });

  it("Achaten: accusative of Achates (N 3 8)", () => {
    const r = findNoun("achaten", "Achates");
    expect(r).toBeDefined();
  });

  it("Diomedem: accusative of Diomedes", () => {
    const r = findNoun("diomedem", "Diomedes");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Metamorphoses — characters
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: Metamorphoses characters", () => {
  it("Orpheus: nominative (N 3 8)", () => {
    const r = findNoun("orpheus", "Orpheus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("NOM");
  });

  it("Orphea: Greek accusative (N 2 9)", () => {
    const r = findNoun("orphea", "Orpheus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
  });

  it("Eurydices: genitive of Eurydice (N 1 6)", () => {
    const r = findNoun("eurydices", "Eurydice");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
  });

  it("Perseus: nominative (N 3 8)", () => {
    const r = findNoun("perseus", "Perseus");
    expect(r).toBeDefined();
  });

  it("Medusam: accusative of Medusa", () => {
    const r = findNoun("medusam", "Medusa");
    expect(r).toBeDefined();
  });

  it("Narcissum: accusative of Narcissus", () => {
    const r = findNoun("narcissum", "Narcissus");
    expect(r).toBeDefined();
  });

  it("Daphnes: genitive of Daphne (N 1 6)", () => {
    const r = findNoun("daphnes", "Daphne");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
  });

  it("Thesea: Greek accusative of Theseus (N 2 9)", () => {
    const r = findNoun("thesea", "Theseus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
  });

  it("Cadmi: genitive of Cadmus", () => {
    const r = findNoun("cadmi", "Cadmus");
    expect(r).toBeDefined();
  });

  it("Proserpinae: genitive of Proserpina", () => {
    const r = findNoun("proserpinae", "Proserpina");
    expect(r).toBeDefined();
  });

  it("Circen: accusative of Circe (N 1 6)", () => {
    const r = findNoun("circen", "Circe");
    expect(r).toBeDefined();
  });

  it("Medeae: genitive of Medea", () => {
    const r = findNoun("medeae", "Medea");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
  });

  it("Jasonis: genitive of Jason", () => {
    const r = findNoun("jasonis", "Jason");
    expect(r).toBeDefined();
  });

  it("Phaethontis: genitive of Phaethon", () => {
    const r = findNoun("phaethontis", "Phaethon");
    expect(r).toBeDefined();
  });

  it("Thetidis: genitive of Thetis", () => {
    const r = findNoun("thetidis", "Thetis");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Deities and epithets
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: deities and epithets", () => {
  it("Phoebus: nominative", () => {
    const r = findNoun("phoebus", "Phoebus");
    expect(r).toBeDefined();
  });

  it("Cythereae: genitive of Cytherea", () => {
    const r = findNoun("cythereae", "Cytherea");
    expect(r).toBeDefined();
  });

  it("Hecaten: accusative of Hecate (N 1 6)", () => {
    const r = findNoun("hecaten", "Hecate");
    expect(r).toBeDefined();
  });

  it("Saturni: genitive of Saturn", () => {
    const r = findNoun("saturni", "Saturn");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Places
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: places", () => {
  it("Troiaque: tackon strips -que, finds Troia", () => {
    const a = engine.parseWord("troiaque");
    expect(a.addonResults.length).toBeGreaterThan(0);
    const base = a.addonResults[0].baseResults;
    expect(base.some((r) => r.de.mean.includes("Troy"))).toBe(true);
  });

  it("Latium: nominative (N 2 2)", () => {
    const r = findNoun("latium", "Latium");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("NOM");
  });

  it("Elysium: nominative", () => {
    const r = findNoun("elysium", "Elysium");
    expect(r).toBeDefined();
  });

  it("Pergama: nominative plural (N 2 2)", () => {
    const r = findNoun("pergama", "Pergamum");
    expect(r).toBeDefined();
  });

  it("Arcadiae: genitive of Arcadia", () => {
    const r = findNoun("arcadiae", "Arcadia");
    expect(r).toBeDefined();
  });

  it("Ithacam: accusative of Ithaca", () => {
    const r = findNoun("ithacam", "Ithaca");
    expect(r).toBeDefined();
  });

  it("Erebi: genitive of Erebus", () => {
    const r = findNoun("erebi", "Erebus");
    expect(r).toBeDefined();
  });

  it("Avernum: accusative of Avernus", () => {
    const r = findNoun("avernum", "Avernus");
    expect(r).toBeDefined();
  });

  it("Acheronem: accusative of Acheron (alternate stem)", () => {
    const r = findNoun("acheronem", "Acheron");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Derived adjectives
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: derived adjectives", () => {
  it("Dardanios: accusative plural of Dardanius", () => {
    const r = findAdj("dardanios", "Dardanian");
    expect(r).toBeDefined();
  });

  it("Tyrios: accusative plural of Tyrius", () => {
    const r = findAdj("tyrios", "Tyrian");
    expect(r).toBeDefined();
  });

  it("Saturnia: nominative feminine of Saturnius", () => {
    const r = findAdj("saturnia", "Saturnian");
    expect(r).toBeDefined();
  });

  it("Troiana: nominative/ablative feminine of Troianus", () => {
    const r = findAdj("troiana", "Trojan");
    expect(r).toBeDefined();
  });

  it("Elysios: accusative plural of Elysius", () => {
    const r = findAdj("elysios", "Elysian");
    expect(r).toBeDefined();
  });

  it("Stygias: accusative plural feminine of Stygius", () => {
    const r = findAdj("stygias", "Stygian");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Greek 1st decl -e (N 1 6): stem1 must not include the -e ending
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: N 1 6 Greek feminine names", () => {
  it("Ariadne: NOM S matches correctly (no doubled -ee)", () => {
    const r = findNoun("ariadne", "Ariadne");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("NOM");
  });

  it("Ariadne dict form is 'Ariadne, Ariadnes' not 'Ariadnee'", () => {
    const lines = outputLines("ariadne");
    expect(lines).toContainEqual(expect.stringContaining("Ariadne, Ariadnes"));
  });

  it("Circe: NOM S matches", () => {
    const r = findNoun("circe", "Circe");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("NOM");
  });

  it("Eurydices: GEN S of Eurydice", () => {
    const r = findNoun("eurydices", "Eurydice");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
  });

  it("Daphnen: ACC S of Daphne", () => {
    const r = findNoun("daphnen", "Daphne");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
  });
});

// ---------------------------------------------------------------------------
// Greek -eus declension (N 2 9): NOM -us, VOC -u, GEN -i/-os, ACC -um/-a
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: Greek -eus declension (N 2 9)", () => {
  it("Theseus NOM S — no spurious VOC S for 'theseus'", () => {
    const a = engine.parseWord("theseus");
    const theseusResults = a.results.filter(
      (r) => r.de.mean.includes("Theseus") && r.ir.qual.pofs === "N",
    );
    // NOM is valid, but VOC should not appear for the form "theseus"
    // (the vocative is "theseu", not "theseus")
    expect(theseusResults.some((r) => r.ir.qual.noun.cs === "NOM")).toBe(true);
    expect(theseusResults.every((r) => r.ir.qual.noun.cs !== "VOC")).toBe(true);
  });

  it("Theseu is the correct VOC S", () => {
    const r = findNoun("theseu", "Theseus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("VOC");
  });

  it("Theseos: Greek genitive (N 2 9)", () => {
    const r = findNoun("theseos", "Theseus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
  });

  it("Theseum ACC S — no spurious GEN P", () => {
    const a = engine.parseWord("theseum");
    const theseumResults = a.results.filter(
      (r) => r.de.mean.includes("Theseus") && r.ir.qual.pofs === "N",
    );
    expect(
      theseumResults.some((r) => r.ir.qual.noun.cs === "ACC" && r.ir.qual.noun.number === "S"),
    ).toBe(true);
    // GEN P should not appear for a proper name
    expect(
      theseumResults.every((r) => r.ir.qual.noun.cs !== "GEN" || r.ir.qual.noun.number !== "P"),
    ).toBe(true);
  });

  it("Orphei: Latin genitive (N 2 9)", () => {
    const r = findNoun("orphei", "Orpheus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
    expect(r!.ir.qual.noun.number).toBe("S");
  });

  it("Orpheos: Greek genitive (N 2 9)", () => {
    const r = findNoun("orpheos", "Orpheus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("GEN");
  });

  it("Orphea: Greek accusative (N 2 9)", () => {
    const r = findNoun("orphea", "Orpheus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
  });

  it("Mnestheu: VOC S of Mnestheus (N 2 9)", () => {
    const r = findNoun("mnestheu", "Mnestheus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("VOC");
  });

  it("Terea: Greek ACC S of Tereus (N 2 9)", () => {
    const r = findNoun("terea", "Tereus");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
  });
});

// ---------------------------------------------------------------------------
// Pluralia tantum (kind=M) and proper-name filtering
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: pluralia tantum and proper-name filtering", () => {
  it("Athenae: only plural forms (kind=M)", () => {
    const a = engine.parseWord("athenae");
    const athensResults = a.results.filter((r) => r.de.mean.includes("Athens"));
    expect(athensResults.length).toBeGreaterThan(0);
    expect(athensResults.every((r) => r.ir.qual.noun.number === "P")).toBe(true);
  });

  it("Athenam: no singular ACC for Athens", () => {
    const a = engine.parseWord("athenam");
    const athensResults = a.results.filter((r) => r.de.mean.includes("Athens"));
    expect(athensResults.length).toBe(0);
  });

  it("Athena goddess: singular forms work", () => {
    const r = findNoun("athenam", "Athena");
    expect(r).toBeDefined();
    expect(r!.ir.qual.noun.cs).toBe("ACC");
  });

  it("Athena vs Athens: 'athenae' shows both goddess GEN and city NOM P", () => {
    const a = engine.parseWord("athenae");
    const goddessGen = a.results.find(
      (r) => r.de.mean.includes("Athena") && r.ir.qual.noun.cs === "GEN",
    );
    const cityNom = a.results.find(
      (r) =>
        r.de.mean.includes("Athens") &&
        r.ir.qual.noun.cs === "NOM" &&
        r.ir.qual.noun.number === "P",
    );
    expect(goddessGen).toBeDefined();
    expect(cityNom).toBeDefined();
  });

  it("multo: no plural-only noun forms (kind=M with zzz stem)", () => {
    const a = engine.parseWord("multo");
    const multiResults = a.results.filter(
      (r) => r.ir.qual.pofs === "N" && r.de.mean.includes("(pl.)"),
    );
    expect(multiResults.length).toBe(0);
  });

  it("Moses (kind=P from DICTLINE.GEN): no plural forms", () => {
    const a = engine.parseWord("moses");
    const mosesResults = a.results.filter(
      (r) => r.de.mean.includes("Moses") && r.ir.qual.pofs === "N",
    );
    expect(mosesResults.length).toBeGreaterThan(0);
    expect(mosesResults.every((r) => r.ir.qual.noun.number === "S")).toBe(true);
  });

  it("place names allow locative", () => {
    const a = engine.parseWord("troiae");
    const troiaResults = a.results.filter((r) => r.de.mean.includes("Troy"));
    const hasLoc = troiaResults.some((r) => r.ir.qual.noun.cs === "LOC");
    expect(hasLoc).toBe(true);
  });

  it("people nouns allow plural", () => {
    const a = engine.parseWord("numidae");
    const numidResults = a.results.filter((r) => r.de.mean.includes("Numidian"));
    const hasPlural = numidResults.some((r) => r.ir.qual.noun.number === "P");
    expect(hasPlural).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// No regression on common words
// ---------------------------------------------------------------------------

describe("DICTLINE.SUP: no regression", () => {
  it("idem still works (unique + tackon)", () => {
    const a = engine.parseWord("idem");
    expect(a.uniqueResults.length + a.addonResults.length).toBeGreaterThan(0);
  });

  it("aquam still parses as water", () => {
    const r = findNoun("aquam", "water");
    expect(r).toBeDefined();
  });

  it("regina still parses as queen", () => {
    const r = findNoun("reginam", "queen");
    expect(r).toBeDefined();
  });

  it("Apollo still found from DICTLINE.GEN", () => {
    const r = findNoun("apollinis", "Apollo");
    expect(r).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Pluralia tantum with zzz stem1 (Athenae, multi)
// ---------------------------------------------------------------------------

describe("BDL: pluralia tantum (zzz stem1)", () => {
  it("athenae: only plural forms (NOM/VOC P)", () => {
    const a = engine.parseWord("athenae");
    const athens = a.results.filter((r) => r.de.mean.includes("Athens"));
    expect(athens.length).toBeGreaterThan(0);
    expect(athens.every((r) => r.ir.qual.noun.number === "P")).toBe(true);
  });

  it("athenam: no singular for Athens", () => {
    const a = engine.parseWord("athenam");
    const athens = a.results.filter((r) => r.de.mean.includes("Athens"));
    expect(athens.length).toBe(0);
  });

  it("multo: no plural-only noun forms (multi/multae)", () => {
    const a = engine.parseWord("multo");
    const plOnly = a.results.filter(
      (r) => r.ir.qual.pofs === "N" && r.de.mean.includes("(pl.)") && r.de.mean.includes("many"),
    );
    expect(plOnly.length).toBe(0);
  });

  it("multis: plural forms of multi work", () => {
    const a = engine.parseWord("multis");
    const multi = a.results.filter(
      (r) => r.ir.qual.pofs === "N" && r.de.mean.includes("many") && r.ir.qual.noun.number === "P",
    );
    expect(multi.length).toBeGreaterThan(0);
  });
});
