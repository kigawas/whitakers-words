// ---------------------------------------------------------------------------
// Roman Numeral detection and parsing
// ---------------------------------------------------------------------------

const ROMAN_VALUES: Readonly<Record<string, number>> = {
  M: 1000,
  D: 500,
  C: 100,
  L: 50,
  X: 10,
  V: 5,
  I: 1,
};

// Structural validation regex for Roman numerals.
// Enforces all standard rules:
// - M{0,3}: up to 3 thousands
// - (CM|CD|D?C{0,3}): hundreds (900, 400, or 0-3 hundreds with optional 500)
// - (XC|XL|L?X{0,3}): tens (90, 40, or 0-3 tens with optional 50)
// - (IX|IV|V?I{0,3}): units (9, 4, or 0-3 ones with optional 5)
const VALID_ROMAN_RE = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

/**
 * Returns true if the word is a structurally valid Roman numeral.
 * Case-sensitive — expects uppercase input.
 */
export function isRomanNumeral(word: string): boolean {
  if (word.length === 0) return false;
  return VALID_ROMAN_RE.test(word);
}

/**
 * Returns the numeric value if the word is a valid Roman numeral, null otherwise.
 *
 * Uses a structural regex for validation, then standard right-to-left parsing
 * with subtractive notation for value computation.
 */
export function parseRomanNumeral(word: string): number | null {
  if (!isRomanNumeral(word)) return null;

  let total = 0;
  let prevValue = 0;

  for (let i = word.length - 1; i >= 0; i--) {
    const ch = word[i];
    if (ch === undefined) return null;
    const value = ROMAN_VALUES[ch];
    if (value === undefined) return null;

    if (value < prevValue) {
      total -= value;
    } else {
      total += value;
    }
    prevValue = value;
  }

  return total;
}
