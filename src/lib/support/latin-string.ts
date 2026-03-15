// Latin-aware string comparison that treats u/v and i/j as equivalent.
// These mirror the Equ/Ltu/Gtu functions in words_engine-word_package.adb.

/** Character-level equivalence: u≡v, i≡j (case-sensitive pairs). */
export function equChar(c: string, d: string): boolean {
  switch (d) {
    case "u":
    case "v":
      return c === "u" || c === "v";
    case "i":
    case "j":
      return c === "i" || c === "j";
    case "U":
    case "V":
      return c === "U" || c === "V";
    case "I":
    case "J":
      return c === "I" || c === "J";
    default:
      return c === d;
  }
}

/** Character-level less-than: comparing against v treats it as u, j as i. */
export function ltuChar(c: string, d: string): boolean {
  switch (d) {
    case "v":
      return c < "u";
    case "j":
      return c < "i";
    case "V":
      return c < "U";
    case "J":
      return c < "I";
    default:
      return c < d;
  }
}

/** Character-level greater-than: comparing against u treats it as v, i as j. */
export function gtuChar(c: string, d: string): boolean {
  switch (d) {
    case "u":
      return c > "v";
    case "i":
      return c > "j";
    case "U":
      return c > "V";
    case "I":
      return c > "J";
    default:
      return c > d;
  }
}

/** String equality with u/v, i/j equivalence. Strings must be same length. */
export function equStr(s: string, t: string): boolean {
  if (s.length !== t.length) return false;
  for (let i = 0; i < s.length; i++) {
    if (!equChar(s.charAt(i), t.charAt(i))) return false;
  }
  return true;
}

/** String less-than with u/v, i/j equivalence. Strings assumed same length (space-padded). */
export function ltuStr(s: string, t: string): boolean {
  const len = Math.min(s.length, t.length);
  for (let i = 0; i < len; i++) {
    const sc = s.charAt(i);
    const tc = t.charAt(i);
    if (equChar(sc, tc)) continue;
    if (gtuChar(sc, tc)) return false;
    if (ltuChar(sc, tc)) return true;
  }
  return false;
}

/** String greater-than with u/v, i/j equivalence. Strings assumed same length (space-padded). */
export function gtuStr(s: string, t: string): boolean {
  const len = Math.min(s.length, t.length);
  for (let i = 0; i < len; i++) {
    const sc = s.charAt(i);
    const tc = t.charAt(i);
    if (equChar(sc, tc)) continue;
    if (ltuChar(sc, tc)) return false;
    if (gtuChar(sc, tc)) return true;
  }
  return false;
}

/** Lowercase a string. */
export function lowerCase(s: string): string {
  return s.toLowerCase();
}

/**
 * Pad/truncate a string to exactly `len` characters (right-padded with spaces).
 * Equivalent to Ada's Head function.
 */
export function head(s: string, len: number): string {
  if (s.length >= len) return s.slice(0, len);
  return s + " ".repeat(len - s.length);
}
