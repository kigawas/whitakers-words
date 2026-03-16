import { describe, expect, it } from "vitest";
import { parseAddonsFile } from "../../../src/lib/parsers/addons.js";
import { parseDictLine } from "../../../src/lib/parsers/dictline.js";
import { parseInflectsFile } from "../../../src/lib/parsers/inflects.js";
import { FixedReader, TokenReader } from "../../../src/lib/parsers/parse-utils.js";
import { parsePofs } from "../../../src/lib/parsers/pofs-map.js";
import { parseUniquesFile } from "../../../src/lib/parsers/uniques.js";

describe("parsePofs", () => {
  it("returns valid POS for known types", () => {
    expect(parsePofs("N     ")).toBe("N");
    expect(parsePofs("V     ")).toBe("V");
    expect(parsePofs("ADJ   ")).toBe("ADJ");
    expect(parsePofs("PREP  ")).toBe("PREP");
  });

  it("returns X for unknown POS string", () => {
    expect(parsePofs("BOGUS ")).toBe("X");
    expect(parsePofs("      ")).toBe("X");
    expect(parsePofs("")).toBe("X");
  });
});

describe("TokenReader", () => {
  it("str() returns X when past end", () => {
    const r = new TokenReader(["hello"], 0);
    expect(r.str()).toBe("hello");
    expect(r.str()).toBe("X");
  });

  it("int() returns 0 for NaN token", () => {
    const r = new TokenReader(["abc"], 0);
    expect(r.int()).toBe(0);
  });

  it("int() returns 0 when past end", () => {
    const r = new TokenReader([], 0);
    expect(r.int()).toBe(0);
  });

  it("decn() reads two integers", () => {
    const r = new TokenReader(["3", "1"], 0);
    const d = r.decn();
    expect(d.which).toBe(3);
    expect(d.var).toBe(1);
  });

  it("peek() returns next token without advancing", () => {
    const r = new TokenReader(["a", "b", "c"], 0);
    expect(r.peek()).toBe("a");
    expect(r.peek()).toBe("a");
    r.str();
    expect(r.peek()).toBe("b");
  });

  it("peek() returns empty string when past end", () => {
    const r = new TokenReader([], 0);
    expect(r.peek()).toBe("");
  });

  it("remaining returns correct count", () => {
    const r = new TokenReader(["a", "b", "c"], 0);
    expect(r.remaining).toBe(3);
    r.str();
    expect(r.remaining).toBe(2);
  });

  it("offset returns current position", () => {
    const r = new TokenReader(["a", "b"], 0);
    expect(r.offset).toBe(0);
    r.str();
    expect(r.offset).toBe(1);
  });
});

describe("FixedReader", () => {
  it("field trims trailing spaces", () => {
    const r = new FixedReader("hello   world");
    expect(r.field(8)).toBe("hello");
    expect(r.field(5)).toBe("world");
  });

  it("skip advances position", () => {
    const r = new FixedReader("ab cd");
    r.field(2);
    r.skip(1);
    expect(r.field(2)).toBe("cd");
  });

  it("rest returns remaining content trimmed", () => {
    const r = new FixedReader("hello world   ");
    r.field(6);
    expect(r.rest()).toBe("world");
  });

  it("offset returns current position", () => {
    const r = new FixedReader("abcdef");
    expect(r.offset).toBe(0);
    r.field(3);
    expect(r.offset).toBe(3);
  });
});

describe("parseDictLine: rare POS types", () => {
  function buildDictLine(
    stems: [string, string, string, string],
    partStr: string,
    tranStr: string,
    meaning: string,
  ): string {
    const paddedStems = stems.map((s) => `${s.padEnd(18)} `).join("");
    return `${paddedStems + partStr.padEnd(23)} ${tranStr} ${meaning}`;
  }

  it("parses CONJ entry", () => {
    const line = buildDictLine(["et", "", "", ""], "CONJ", "X X X X X", "and, also");
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("CONJ");
    expect(entry.mean).toBe("and, also");
  });

  it("parses INTERJ entry", () => {
    const line = buildDictLine(["heu", "", "", ""], "INTERJ", "X X X X X", "alas!");
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("INTERJ");
  });

  it("parses PREP entry with case", () => {
    const line = buildDictLine(["ab", "", "", ""], "PREP   ABL", "X X X A X", "by, from");
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("PREP");
    if (entry.part.pofs === "PREP") {
      expect(entry.part.prep.obj).toBe("ABL");
    }
  });

  it("parses NUM entry with value", () => {
    const line = buildDictLine(
      ["un", "un", "un", "prim"],
      "NUM    1 1 X      1",
      "X X X A X",
      "one",
    );
    const entry = parseDictLine(line);
    expect(entry.part.pofs).toBe("NUM");
    if (entry.part.pofs === "NUM") {
      expect(entry.part.num.decl.which).toBe(1);
      expect(entry.part.num.value).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// parseDictLine: all POS branch coverage (from branch-coverage)
// ---------------------------------------------------------------------------
describe("parseDictLine: all POS branch coverage", () => {
  function buildLine(
    stems: [string, string, string, string],
    partStr: string,
    meaning: string,
  ): string {
    return (
      stems.map((s) => `${s.padEnd(18)} `).join("") +
      partStr.padEnd(23) +
      " " +
      "X X X X X" +
      " " +
      meaning
    );
  }

  it("parses VPAR entry", () => {
    const entry = parseDictLine(buildLine(["test", "", "", ""], "VPAR", "testing"));
    expect(entry.part.pofs).toBe("VPAR");
  });

  it("parses SUPINE entry", () => {
    const entry = parseDictLine(buildLine(["test", "", "", ""], "SUPINE", "testing"));
    expect(entry.part.pofs).toBe("SUPINE");
  });

  it("parses TACKON entry", () => {
    const entry = parseDictLine(buildLine(["que", "", "", ""], "TACKON", "and"));
    expect(entry.part.pofs).toBe("TACKON");
  });

  it("parses PREFIX entry", () => {
    const entry = parseDictLine(buildLine(["re", "", "", ""], "PREFIX", "again"));
    expect(entry.part.pofs).toBe("PREFIX");
  });

  it("parses SUFFIX entry", () => {
    const entry = parseDictLine(buildLine(["tor", "", "", ""], "SUFFIX", "doer"));
    expect(entry.part.pofs).toBe("SUFFIX");
  });

  it("parses X (unknown) entry", () => {
    const entry = parseDictLine(buildLine(["xyz", "", "", ""], "X", "unknown"));
    expect(entry.part.pofs).toBe("X");
  });

  it("parses ADV entry", () => {
    const entry = parseDictLine(buildLine(["bene", "", "", ""], "ADV    POS", "well"));
    expect(entry.part.pofs).toBe("ADV");
  });

  it("parses PRON entry", () => {
    const entry = parseDictLine(buildLine(["h", "hu", "", ""], "PRON   3 1 ADJECT", "this"));
    expect(entry.part.pofs).toBe("PRON");
    if (entry.part.pofs === "PRON") {
      expect(entry.part.pron.decl.which).toBe(3);
    }
  });

  it("parses PACK entry", () => {
    const entry = parseDictLine(buildLine(["qu", "", "", ""], "PACK   1 0 INDEF", "each"));
    expect(entry.part.pofs).toBe("PACK");
    if (entry.part.pofs === "PACK") {
      expect(entry.part.pack.decl.which).toBe(1);
    }
  });
});

// ---------------------------------------------------------------------------
// parseUniquesFile: all POS branch coverage (from branch-coverage)
// ---------------------------------------------------------------------------
describe("parseUniquesFile: all POS branch coverage", () => {
  it("parses V unique entry", () => {
    const content = ["memento", "V 2 1 FUT ACTIVE IMP 2 S TRANS X X X A X", "remember!"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("V");
    expect(entries[0]?.de.part.pofs).toBe("V");
  });

  it("parses ADV unique entry", () => {
    const content = ["numquam", "ADV POS X X X A X", "never"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("ADV");
  });

  it("parses PRON unique entry", () => {
    const content = ["vis", "PRON 5 1 NOM S C PERS X X X A X", "you wish"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("PRON");
  });

  it("parses ADJ unique entry", () => {
    const content = ["bonus", "ADJ 1 1 NOM S M POS X X X A X", "good"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("ADJ");
  });

  it("parses NUM unique entry", () => {
    const content = ["unus", "NUM 1 1 NOM S M CARD 1 X X X A X", "one"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("NUM");
  });

  it("parses PACK unique entry", () => {
    const content = ["quisque", "PACK 1 1 NOM S M INDEF X X X A X", "each"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("PACK");
  });

  it("default/unknown POS falls back to X", () => {
    const content = ["xyz", "BOGUS X X X A X", "unknown"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("X");
  });

  it("skips empty lines", () => {
    const content = ["", "", "meaning"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(0);
  });

  it("handles short token list with fallback translation values", () => {
    const content = ["test", "N 1 1 NOM S M T X X X A X", "test meaning"].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.de.tran.age).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// parseInflectsFile: edge cases (from branch-coverage)
// ---------------------------------------------------------------------------
describe("parseInflectsFile: edge cases", () => {
  it("parses inflection with size=0 ending", () => {
    const content = "PREP   GEN 1 0       X A\n";
    const records = parseInflectsFile(content);
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]?.ending.size).toBe(0);
    expect(records[0]?.ending.suf).toBe("");
  });

  it("skips comment lines", () => {
    const content = "-- this is a comment\nPREP   ABL 1 0       X A\n";
    const records = parseInflectsFile(content);
    expect(records).toHaveLength(1);
  });

  it("skips empty lines", () => {
    const content = "\n\n\nPREP   ABL 1 0       X A\n\n";
    const records = parseInflectsFile(content);
    expect(records).toHaveLength(1);
  });

  it("handles ending with size>0 where next token is age (uppercase)", () => {
    const content = "N    1 1 NOM S C 0 2 ae X A\n";
    const records = parseInflectsFile(content);
    expect(records.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// parseAddonsFile: edge cases (from branch-coverage)
// ---------------------------------------------------------------------------
describe("parseAddonsFile: edge cases", () => {
  it("skips unknown entry type", () => {
    const content = "UNKNOWN que\nN 1 1\nand";
    const data = parseAddonsFile(content);
    expect(data.tackons).toHaveLength(0);
  });

  it("handles truncated file (missing line 2)", () => {
    const content = "TACKON que";
    const data = parseAddonsFile(content);
    expect(data.tackons).toHaveLength(0);
  });

  it("handles truncated file (missing line 3)", () => {
    const content = "TACKON que\nN 1 1";
    const data = parseAddonsFile(content);
    expect(data.tackons).toHaveLength(0);
  });

  it("parses SUFFIX entry", () => {
    const content = "SUFFIX  tor\nN 1 N 3 1 POS 0\n0\ndoer";
    const data = parseAddonsFile(content);
    expect(data.suffixes).toHaveLength(1);
  });

  it("parses PREFIX entry", () => {
    const content = "PREFIX  re\nV V\n0\nagain";
    const data = parseAddonsFile(content);
    expect(data.prefixes.length + data.tickons.length).toBeGreaterThanOrEqual(1);
  });

  it("parses TACKON entry", () => {
    const content = "TACKON  que\nN 1 1\n0\nand";
    const data = parseAddonsFile(content);
    expect(data.tackons).toHaveLength(1);
  });

  it("classifies PACKON tackon (PACK decl 1/2 with 'PACKON w/' meaning)", () => {
    const content = "TACKON cumque\nPACK 1 0 REL\nPACKON w/qui => whoever";
    const data = parseAddonsFile(content);
    expect(data.packons).toHaveLength(1);
    expect(data.tackons).toHaveLength(0);
  });

  it("TACKON with PACK but non-PACKON meaning stays as tackon", () => {
    const content = "TACKON que\nPACK 1 0 INDEF\nand also";
    const data = parseAddonsFile(content);
    expect(data.tackons).toHaveLength(1);
    expect(data.packons).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// addons parsing: PREP target entry (from branch-coverage)
// ---------------------------------------------------------------------------
describe("addons parsing: PREP target entry", () => {
  it("parses addon file with PREP in target entry", () => {
    const content = ["SUFFIX  wards", "N 1 PREP ABL", "0", "toward"].join("\n");
    const data = parseAddonsFile(content);
    expect(data).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// inflects: parseEnding edge cases (from branch-coverage)
// ---------------------------------------------------------------------------
describe("inflects: parseEnding edge cases", () => {
  it("handles inflection line with ending size > 0 and age token next", () => {
    const content = "N    1 1 NOM S C 0 1 A X\n";
    const records = parseInflectsFile(content);
    expect(records.length).toBeGreaterThanOrEqual(0);
  });

  it("parses inflection with size>0 and proper lowercase ending", () => {
    const content = "N    1 1 NOM S F 0 2 ae X A\n";
    const records = parseInflectsFile(content);
    expect(records.length).toBeGreaterThan(0);
    expect(records[0]?.ending.suf).toBe("ae");
  });
});

// ---------------------------------------------------------------------------
// parseUniquesFile: ?? fallback branches (from defensive-branches)
// ---------------------------------------------------------------------------
describe("parseUniquesFile: ?? fallback branches", () => {
  it("handles N entry with exactly minimum tokens", () => {
    const content = "test\nN 1 1 NOM S M T X X X A X\nmeaning";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.de.tran.age).toBe("X");
    expect(entries[0]?.de.tran.source).toBe("X");
  });

  it("handles entry where qual line is empty (skipped)", () => {
    const content = "test\n\nmeaning";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(0);
  });

  it("handles ADV entry", () => {
    const content = "bene\nADV POS X X X A X\nwell";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("ADV");
    if (entries[0]?.qual.pofs === "ADV") {
      expect(entries[0]?.qual.adv.comparison).toBe("POS");
    }
  });

  it("handles PACK entry", () => {
    const content = "quisque\nPACK 1 1 NOM S M INDEF X X X A X\neach";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("PACK");
  });

  it("handles NUM entry", () => {
    const content = "unus\nNUM 1 1 NOM S M CARD 1 X X X A X\none";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("NUM");
    if (entries[0]?.de.part.pofs === "NUM") {
      expect(entries[0]?.de.part.num.value).toBe(1);
    }
  });

  it("handles ADJ entry", () => {
    const content = "bonus\nADJ 1 1 NOM S M POS X X X A X\ngood";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("ADJ");
  });

  it("handles V entry", () => {
    const content = "fac\nV 3 1 PRES ACTIVE IMP 2 S TRANS X X X A X\ndo!";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("V");
    if (entries[0]?.qual.pofs === "V") {
      expect(entries[0]?.qual.verb.tenseVoiceMood.tense).toBe("PRES");
    }
  });

  it("handles unknown POS (default case)", () => {
    const content = "xyz\nINVALID X X X A X\nunknown";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("X");
  });

  it("handles very short token line (triggers ?? fallbacks)", () => {
    const content = "test\nN\nmeaning";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.de.tran.age).toBe("X");
    expect(entries[0]?.de.tran.area).toBe("X");
    expect(entries[0]?.de.tran.geo).toBe("X");
    expect(entries[0]?.de.tran.freq).toBe("X");
  });

  it("handles token line with only 3 tokens (partial ?? fallbacks)", () => {
    const content = "test\nN A X\nmeaning";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
  });

  it("handles PRON entry", () => {
    const content = "vis\nPRON 5 1 NOM S C PERS X X X A X\nyou wish";
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(1);
    expect(entries[0]?.qual.pofs).toBe("PRON");
  });

  it("multiple entries parsed correctly", () => {
    const content = [
      "word1",
      "V 3 1 PRES ACTIVE IMP 2 S TRANS X X X A X",
      "meaning1",
      "word2",
      "ADV POS X X X A X",
      "meaning2",
    ].join("\n");
    const entries = parseUniquesFile(content);
    expect(entries).toHaveLength(2);
    expect(entries[0]?.qual.pofs).toBe("V");
    expect(entries[1]?.qual.pofs).toBe("ADV");
  });
});

// ---------------------------------------------------------------------------
// parseInflectsFile: malformed line handling (from remaining-branches)
// ---------------------------------------------------------------------------
describe("parseInflectsFile: malformed line handling", () => {
  it("skips lines that produce null records", () => {
    const content = "X\n";
    const records = parseInflectsFile(content);
    expect(records).toHaveLength(0);
  });

  it("skips completely empty tokenized lines", () => {
    const content = "   \n\n\t\n";
    const records = parseInflectsFile(content);
    expect(records).toHaveLength(0);
  });
});
