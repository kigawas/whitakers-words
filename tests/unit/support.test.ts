import { describe, expect, it } from "vitest";
import {
  isAlphaEtc,
  isPunctuation,
  vToUAndJToI,
  vToUAndJToIString,
} from "../../src/lib/support/char-utils.js";
import {
  equChar,
  equStr,
  gtuChar,
  gtuStr,
  head,
  lowerCase,
  ltuChar,
  ltuStr,
} from "../../src/lib/support/latin-string.js";

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
