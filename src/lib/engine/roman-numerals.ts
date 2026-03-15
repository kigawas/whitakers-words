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

const VALID_ROMAN_RE = /^[MDCLXVI]+$/;

/**
 * Returns true if the word contains only valid Roman digit characters
 * (M, D, C, L, X, V, I). Case-sensitive — expects uppercase input.
 */
export function isRomanNumeral(word: string): boolean {
  if (word.length === 0) return false;
  return VALID_ROMAN_RE.test(word);
}

/**
 * Returns the numeric value if the word is a valid Roman numeral, null otherwise.
 *
 * Processing is right-to-left: if a digit is smaller than the digit to its right,
 * it is subtracted; otherwise it is added.
 *
 * Enforced rules:
 * - No more than 3 identical characters in sequence.
 * - Only I, X, C may appear in subtractive position.
 */
export function parseRomanNumeral(word: string): number | null {
  if (!isRomanNumeral(word)) return null;

  // Check for more than 3 identical characters in a row
  for (let i = 0; i < word.length - 3; i++) {
    if (word[i] === word[i + 1] && word[i] === word[i + 2] && word[i] === word[i + 3]) {
      return null;
    }
  }

  let total = 0;
  let prevValue = 0;

  for (let i = word.length - 1; i >= 0; i--) {
    const ch = word[i];
    if (ch === undefined) return null;
    const value = ROMAN_VALUES[ch];
    if (value === undefined) return null;

    if (value < prevValue) {
      // Only I, X, C can be subtractive
      if (ch !== "I" && ch !== "X" && ch !== "C") {
        return null;
      }
      total -= value;
    } else {
      total += value;
    }
    prevValue = value;
  }

  return total;
}
