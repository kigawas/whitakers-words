import { describe, expect, it } from "vitest";
import {
  AGES,
  assertNever,
  CASES,
  COMPARISONS,
  type DecnRecord,
  FREQUENCIES,
  GENDERS,
  MOODS,
  matchesAge,
  matchesCase,
  matchesComparison,
  matchesDecn,
  matchesFrequency,
  matchesGender,
  matchesNumber,
  matchesPerson,
  matchesPofs,
  matchesStemKey,
  matchesTVM,
  NOUN_KINDS,
  NULL_DICTIONARY_ENTRY,
  NULL_INFLECTION,
  NULL_QUALITY,
  NUMBERS,
  NUMERAL_SORTS,
  numberOfStems,
  PARTS_OF_SPEECH,
  type PartEntry,
  PRONOUN_KINDS,
  type QualityRecord,
  TENSES,
  VERB_KINDS,
  VOICES,
} from "../../src/lib/index.js";

// ---------------------------------------------------------------------------
// Enum arrays
// ---------------------------------------------------------------------------

describe("enum arrays", () => {
  it("PARTS_OF_SPEECH has 16 values starting with X", () => {
    expect(PARTS_OF_SPEECH).toHaveLength(16);
    expect(PARTS_OF_SPEECH[0]).toBe("X");
    expect(PARTS_OF_SPEECH).toContain("N");
    expect(PARTS_OF_SPEECH).toContain("V");
    expect(PARTS_OF_SPEECH).toContain("SUFFIX");
  });

  it("all enum arrays start with X", () => {
    for (const arr of [
      GENDERS,
      CASES,
      NUMBERS,
      COMPARISONS,
      TENSES,
      VOICES,
      MOODS,
      NOUN_KINDS,
      PRONOUN_KINDS,
      VERB_KINDS,
      AGES,
      FREQUENCIES,
      NUMERAL_SORTS,
    ]) {
      expect(arr[0]).toBe("X");
    }
  });
});

// ---------------------------------------------------------------------------
// Matching functions
// ---------------------------------------------------------------------------

describe("matchesPofs", () => {
  it("X on right matches everything", () => {
    for (const pofs of PARTS_OF_SPEECH) {
      expect(matchesPofs(pofs, "X")).toBe(true);
    }
  });

  it("same value matches", () => {
    expect(matchesPofs("N", "N")).toBe(true);
    expect(matchesPofs("V", "V")).toBe(true);
  });

  it("PACK matches PRON on right", () => {
    expect(matchesPofs("PACK", "PRON")).toBe(true);
  });

  it("different values do not match", () => {
    expect(matchesPofs("N", "V")).toBe(false);
    expect(matchesPofs("PRON", "PACK")).toBe(false);
  });
});

describe("matchesDecn", () => {
  it("(0,0) matches everything except Which=9", () => {
    const wild: DecnRecord = { which: 0, var: 0 };
    expect(matchesDecn({ which: 1, var: 1 }, wild)).toBe(true);
    expect(matchesDecn({ which: 5, var: 3 }, wild)).toBe(true);
    expect(matchesDecn({ which: 9, var: 0 }, wild)).toBe(false);
  });

  it("(N,0) matches any variant of same Which", () => {
    expect(matchesDecn({ which: 1, var: 3 }, { which: 1, var: 0 })).toBe(true);
    expect(matchesDecn({ which: 2, var: 1 }, { which: 1, var: 0 })).toBe(false);
  });

  it("exact match works", () => {
    expect(matchesDecn({ which: 3, var: 2 }, { which: 3, var: 2 })).toBe(true);
    expect(matchesDecn({ which: 3, var: 2 }, { which: 3, var: 1 })).toBe(false);
  });
});

describe("matchesGender", () => {
  it("X matches everything", () => {
    for (const g of GENDERS) {
      expect(matchesGender(g, "X")).toBe(true);
    }
  });

  it("C on right matches M and F", () => {
    expect(matchesGender("M", "C")).toBe(true);
    expect(matchesGender("F", "C")).toBe(true);
    expect(matchesGender("N", "C")).toBe(false);
  });

  it("same value matches", () => {
    expect(matchesGender("M", "M")).toBe(true);
  });
});

describe("matchesCase", () => {
  it("X matches everything", () => {
    for (const c of CASES) {
      expect(matchesCase(c, "X")).toBe(true);
    }
  });

  it("same value matches", () => {
    expect(matchesCase("NOM", "NOM")).toBe(true);
  });

  it("different values do not match", () => {
    expect(matchesCase("NOM", "ACC")).toBe(false);
  });
});

describe("matchesNumber", () => {
  it("X matches everything", () => {
    expect(matchesNumber("S", "X")).toBe(true);
    expect(matchesNumber("P", "X")).toBe(true);
  });
});

describe("matchesPerson", () => {
  it("0 matches everything", () => {
    expect(matchesPerson(1, 0)).toBe(true);
    expect(matchesPerson(3, 0)).toBe(true);
  });

  it("same value matches", () => {
    expect(matchesPerson(2, 2)).toBe(true);
  });

  it("different values do not match", () => {
    expect(matchesPerson(1, 2)).toBe(false);
  });
});

describe("matchesComparison", () => {
  it("X matches everything", () => {
    for (const c of COMPARISONS) {
      expect(matchesComparison(c, "X")).toBe(true);
    }
  });
});

describe("matchesTVM", () => {
  it("all-X matches everything", () => {
    const wild = { tense: "X" as const, voice: "X" as const, mood: "X" as const };
    expect(matchesTVM({ tense: "PRES", voice: "ACTIVE", mood: "IND" }, wild)).toBe(true);
  });

  it("partial wildcard works", () => {
    expect(
      matchesTVM(
        { tense: "PRES", voice: "ACTIVE", mood: "IND" },
        { tense: "PRES", voice: "X", mood: "IND" },
      ),
    ).toBe(true);
  });

  it("mismatch fails", () => {
    expect(
      matchesTVM(
        { tense: "PRES", voice: "ACTIVE", mood: "IND" },
        { tense: "PERF", voice: "ACTIVE", mood: "IND" },
      ),
    ).toBe(false);
  });
});

describe("matchesStemKey", () => {
  it("0 matches everything", () => {
    expect(matchesStemKey(1, 0)).toBe(true);
    expect(matchesStemKey(4, 0)).toBe(true);
  });
});

describe("matchesAge and matchesFrequency", () => {
  it("X matches everything", () => {
    for (const a of AGES) {
      expect(matchesAge(a, "X")).toBe(true);
    }
    for (const f of FREQUENCIES) {
      expect(matchesFrequency(f, "X")).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Discriminated unions
// ---------------------------------------------------------------------------

describe("QualityRecord discriminated union", () => {
  it("can narrow on pofs", () => {
    const q: QualityRecord = {
      pofs: "N",
      noun: { decl: { which: 1, var: 1 }, cs: "NOM", number: "S", gender: "F" },
    };
    if (q.pofs === "N") {
      expect(q.noun.cs).toBe("NOM");
    }
  });

  it("X variant has no extra fields", () => {
    const q: QualityRecord = NULL_QUALITY;
    expect(q.pofs).toBe("X");
  });
});

describe("PartEntry discriminated union", () => {
  it("can narrow on pofs for N", () => {
    const p: PartEntry = {
      pofs: "N",
      n: { decl: { which: 1, var: 1 }, gender: "F", kind: "T" },
    };
    if (p.pofs === "N") {
      expect(p.n.gender).toBe("F");
    }
  });

  it("VPAR and SUPINE have no extra fields", () => {
    const vpar: PartEntry = { pofs: "VPAR" };
    const supine: PartEntry = { pofs: "SUPINE" };
    expect(vpar.pofs).toBe("VPAR");
    expect(supine.pofs).toBe("SUPINE");
  });
});

// ---------------------------------------------------------------------------
// Null constants
// ---------------------------------------------------------------------------

describe("null constants", () => {
  it("NULL_INFLECTION has expected defaults", () => {
    expect(NULL_INFLECTION.qual.pofs).toBe("X");
    expect(NULL_INFLECTION.key).toBe(0);
    expect(NULL_INFLECTION.ending.size).toBe(0);
    expect(NULL_INFLECTION.age).toBe("X");
    expect(NULL_INFLECTION.freq).toBe("X");
  });

  it("NULL_DICTIONARY_ENTRY has empty stems", () => {
    expect(NULL_DICTIONARY_ENTRY.stems).toEqual(["", "", "", ""]);
    expect(NULL_DICTIONARY_ENTRY.part.pofs).toBe("X");
  });

});

// ---------------------------------------------------------------------------
// numberOfStems
// ---------------------------------------------------------------------------

describe("numberOfStems", () => {
  it("nouns have 2 stems", () => {
    expect(numberOfStems("N")).toBe(2);
  });

  it("verbs have 4 stems", () => {
    expect(numberOfStems("V")).toBe(4);
  });

  it("adjectives have 4 stems", () => {
    expect(numberOfStems("ADJ")).toBe(4);
  });

  it("prepositions have 1 stem", () => {
    expect(numberOfStems("PREP")).toBe(1);
  });

  it("VPAR has 0 stems (no dictionary entries)", () => {
    expect(numberOfStems("VPAR")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// assertNever
// ---------------------------------------------------------------------------

describe("assertNever", () => {
  it("throws on any value", () => {
    expect(() => assertNever("oops" as never)).toThrow("Unexpected value");
  });
});
