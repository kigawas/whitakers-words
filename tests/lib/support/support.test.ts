import { describe, expect, it } from "vitest";
import {
  isAlphaEtc,
  isPunctuation,
  vToUAndJToI,
  vToUAndJToIString,
} from "../../../src/lib/support/char-utils.js";
import {
  equChar,
  equStr,
  gtuChar,
  gtuStr,
  head,
  lowerCase,
  ltuChar,
  ltuStr,
} from "../../../src/lib/support/latin-string.js";

// ---------------------------------------------------------------------------
// char-utils
// ---------------------------------------------------------------------------

describe("isPunctuation", () => {
  it("recognizes all Ada punctuation chars", () => {
    for (const c of [" ", ",", "-", ";", ":", ".", "(", "[", "{", "<", ")", "]", "}", ">"]) {
      expect(isPunctuation(c)).toBe(true);
    }
  });
  it("rejects letters", () => {
    expect(isPunctuation("a")).toBe(false);
    expect(isPunctuation("Z")).toBe(false);
  });
});

describe("isAlphaEtc", () => {
  it("accepts letters, hyphen, dot", () => {
    expect(isAlphaEtc("a")).toBe(true);
    expect(isAlphaEtc("Z")).toBe(true);
    expect(isAlphaEtc("-")).toBe(true);
    expect(isAlphaEtc(".")).toBe(true);
  });
  it("rejects digits and punctuation", () => {
    expect(isAlphaEtc("5")).toBe(false);
    expect(isAlphaEtc(",")).toBe(false);
  });
});

describe("vToUAndJToI", () => {
  it("converts V->U, v->u, J->I, j->i", () => {
    expect(vToUAndJToI("V")).toBe("U");
    expect(vToUAndJToI("v")).toBe("u");
    expect(vToUAndJToI("J")).toBe("I");
    expect(vToUAndJToI("j")).toBe("i");
  });
  it("passes through other chars", () => {
    expect(vToUAndJToI("a")).toBe("a");
    expect(vToUAndJToI("U")).toBe("U");
  });
});

describe("vToUAndJToIString", () => {
  it("converts whole strings", () => {
    expect(vToUAndJToIString("Jove")).toBe("Ioue");
    expect(vToUAndJToIString("vivit")).toBe("uiuit");
  });
});

// ---------------------------------------------------------------------------
// latin-string: character-level
// ---------------------------------------------------------------------------

describe("equChar", () => {
  it("u and v are equivalent", () => {
    expect(equChar("u", "v")).toBe(true);
    expect(equChar("v", "u")).toBe(true);
  });
  it("i and j are equivalent", () => {
    expect(equChar("i", "j")).toBe(true);
    expect(equChar("j", "i")).toBe(true);
  });
  it("uppercase pairs work", () => {
    expect(equChar("U", "V")).toBe(true);
    expect(equChar("I", "J")).toBe(true);
  });
  it("different chars are not equal", () => {
    expect(equChar("a", "b")).toBe(false);
    expect(equChar("u", "i")).toBe(false);
  });
});

describe("ltuChar", () => {
  it("treats v as u for comparison", () => {
    expect(ltuChar("t", "v")).toBe(true); // t < u
    expect(ltuChar("u", "v")).toBe(false); // u < u => false
    expect(ltuChar("w", "v")).toBe(false); // w < u => false
  });
  it("treats j as i for comparison", () => {
    expect(ltuChar("h", "j")).toBe(true); // h < i
    expect(ltuChar("i", "j")).toBe(false); // i < i => false
  });
  it("treats uppercase V as U and J as I", () => {
    expect(ltuChar("T", "V")).toBe(true); // T < U
    expect(ltuChar("U", "V")).toBe(false);
    expect(ltuChar("H", "J")).toBe(true); // H < I
    expect(ltuChar("I", "J")).toBe(false);
  });
});

describe("gtuChar", () => {
  it("treats u as v for comparison", () => {
    expect(gtuChar("w", "u")).toBe(true); // w > v
    expect(gtuChar("v", "u")).toBe(false); // v > v => false
    expect(gtuChar("t", "u")).toBe(false); // t > v => false
  });
  it("treats i as j for comparison", () => {
    expect(gtuChar("k", "i")).toBe(true); // k > j
    expect(gtuChar("j", "i")).toBe(false); // j > j => false
  });
  it("treats uppercase U as V and I as J", () => {
    expect(gtuChar("W", "U")).toBe(true); // W > V
    expect(gtuChar("V", "U")).toBe(false);
    expect(gtuChar("K", "I")).toBe(true); // K > J
    expect(gtuChar("J", "I")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// latin-string: string-level
// ---------------------------------------------------------------------------

describe("equStr", () => {
  it("strings with u/v equivalence match", () => {
    expect(equStr("uiuo", "vivo")).toBe(true);
    expect(equStr("vivo", "uiuo")).toBe(true);
  });
  it("identical strings match", () => {
    expect(equStr("aqua", "aqua")).toBe(true);
  });
  it("different lengths do not match", () => {
    expect(equStr("ab", "abc")).toBe(false);
  });
  it("different strings do not match", () => {
    expect(equStr("abc", "abd")).toBe(false);
  });
});

describe("ltuStr", () => {
  it("compares with u/v equivalence", () => {
    // 'aqu' vs 'aqv' should be equal (not less), since u≡v
    expect(ltuStr("aqu", "aqv")).toBe(false);
    // 'aqt' < 'aqu' (since t < u, and v is treated as u)
    expect(ltuStr("aqt", "aqv")).toBe(true);
  });
  it("equal strings return false", () => {
    expect(ltuStr("abc", "abc")).toBe(false);
  });
});

describe("gtuStr", () => {
  it("compares with u/v equivalence", () => {
    expect(gtuStr("aqw", "aqv")).toBe(true); // w > u (v treated as u)
    expect(gtuStr("aqu", "aqv")).toBe(false); // u == v
  });
});

// ---------------------------------------------------------------------------
// head
// ---------------------------------------------------------------------------

describe("head", () => {
  it("pads short strings", () => {
    expect(head("abc", 6)).toBe("abc   ");
  });
  it("truncates long strings", () => {
    expect(head("abcdef", 3)).toBe("abc");
  });
  it("returns exact length unchanged", () => {
    expect(head("abc", 3)).toBe("abc");
  });
});

// ---------------------------------------------------------------------------
// lowerCase
// ---------------------------------------------------------------------------

describe("lowerCase", () => {
  it("lowercases latin text", () => {
    expect(lowerCase("AQUAM")).toBe("aquam");
    expect(lowerCase("ReGiNa")).toBe("regina");
  });
});

// ---------------------------------------------------------------------------
// latin-string: equChar remaining branches (from branch-coverage)
// ---------------------------------------------------------------------------
describe("latin-string: equChar remaining branches", () => {
  it("equChar u matches u and v", () => {
    expect(equChar("u", "u")).toBe(true);
    expect(equChar("v", "u")).toBe(true);
    expect(equChar("a", "u")).toBe(false);
  });

  it("equChar with uppercase U/V", () => {
    expect(equChar("U", "U")).toBe(true);
    expect(equChar("V", "U")).toBe(true);
    expect(equChar("U", "V")).toBe(true);
    expect(equChar("V", "V")).toBe(true);
    expect(equChar("A", "V")).toBe(false);
  });

  it("equChar with uppercase I/J", () => {
    expect(equChar("I", "I")).toBe(true);
    expect(equChar("J", "I")).toBe(true);
    expect(equChar("I", "J")).toBe(true);
    expect(equChar("J", "J")).toBe(true);
    expect(equChar("A", "J")).toBe(false);
  });

  it("ltuStr/gtuStr with u/v equivalence in strings", () => {
    expect(ltuStr("auc", "avc")).toBe(false);
    expect(gtuStr("auc", "avc")).toBe(false);
    expect(ltuStr("aua", "avb")).toBe(true);
    expect(gtuStr("aub", "ava")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// latin-string: edge cases (from engine-coverage)
// ---------------------------------------------------------------------------
describe("latin-string: additional edge cases", () => {
  it("ltuChar default case", () => {
    expect(ltuChar("a", "b")).toBe(true);
    expect(ltuChar("b", "a")).toBe(false);
  });

  it("gtuChar default case", () => {
    expect(gtuChar("b", "a")).toBe(true);
    expect(gtuChar("a", "b")).toBe(false);
  });

  it("ltuChar u/v equivalence", () => {
    expect(ltuChar("a", "v")).toBe(true);
    expect(ltuChar("z", "v")).toBe(false);
  });

  it("gtuChar u/v equivalence", () => {
    expect(gtuChar("z", "u")).toBe(true);
    expect(gtuChar("a", "u")).toBe(false);
  });

  it("ltuStr with gtuChar branch", () => {
    expect(ltuStr("z", "a")).toBe(false);
  });

  it("gtuStr with ltuChar branch", () => {
    expect(gtuStr("a", "z")).toBe(false);
  });

  it("ltuStr/gtuStr equal strings", () => {
    expect(ltuStr("abc", "abc")).toBe(false);
    expect(gtuStr("abc", "abc")).toBe(false);
  });

  it("head pads, truncates, and preserves", () => {
    expect(head("abc", 5)).toBe("abc  ");
    expect(head("abcdef", 3)).toBe("abc");
    expect(head("abc", 3)).toBe("abc");
  });
});

// ---------------------------------------------------------------------------
// latin-string: ltuStr/gtuStr character ordering branches (from remaining-branches)
// ---------------------------------------------------------------------------
describe("latin-string: ltuStr/gtuStr character ordering branches", () => {
  it("ltuStr returns false when first diff char is greater (line 73)", () => {
    expect(ltuStr("ba", "ab")).toBe(false);
  });

  it("gtuStr returns false when first diff char is less (line 86)", () => {
    expect(gtuStr("ab", "ba")).toBe(false);
  });

  it("ltuStr with u/v equivalent chars followed by different chars", () => {
    expect(ltuStr("ua", "vb")).toBe(true);
  });

  it("gtuStr with i/j equivalent chars followed by different chars", () => {
    expect(gtuStr("jb", "ia")).toBe(true);
  });
});
