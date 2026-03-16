// ---------------------------------------------------------------------------
// Syncope — syncopated perfect verb forms
//
// In Latin, perfect-system forms sometimes drop "v" (or "vi"/"ve"/"is")
// producing contracted forms. For example:
//   audivisti → audisti  (drop "vi")
//   amavere  → amare    (drop "av" before "ere")
//   noveris  → noris    (drop "ve")
//
// Ada treats this as a high-priority transformation: "In vast majority of
// cases, if there is a possible syncope it is the correct parse."
//
// Each rule scans the word right-to-left for a pattern, inserts the missing
// characters, and re-analyzes. Only accepted if the result is a verb (V)
// with key=3 (perfect system).
// ---------------------------------------------------------------------------

import type { DictionaryIndex } from "./dictionary-index.js";
import type { InflectionIndex } from "./inflection-index.js";
import { listSweep } from "./list-sweep.js";
import { analyzeWord, type ParseResult } from "./word-analysis.js";

export interface SyncopeResult {
  /** The annotation line, e.g. "Syncope   r => v.r" */
  readonly label: string;
  /** The explanation line */
  readonly explanation: string;
  /** Parse results of the expanded (un-syncopated) form */
  readonly results: readonly ParseResult[];
}

interface SyncopeRule {
  /** Pattern to search for in the word */
  pattern: string | string[];
  /** Characters to insert (inserted AFTER position of first char of pattern) */
  insert: string;
  /** Where to insert relative to the found pattern */
  mode: "before-last" | "before-second" | "after-first";
  /** Annotation label */
  label: string;
  /** Explanation text */
  explanation: string;
}

const SYNCOPE_RULES: SyncopeRule[] = [
  // Rule 1: ii → insert v → ivi (e.g., audii → audivi)
  {
    pattern: "ii",
    insert: "v",
    mode: "after-first",
    label: "Syncope  ii => ivi",
    explanation: "Syncopated perfect ivi can drop 'v' without contracting vowel",
  },
  // Rule 2: as/es/is/os → insert vi → avis/evis/ivis/ovis (e.g., petisti → petivisti)
  {
    pattern: ["as", "es", "is", "os"],
    insert: "vi",
    mode: "after-first",
    label: "Syncope   s => vis",
    explanation: "Syncopated perfect often drops the 'v' and contracts vowel",
  },
  // Rule 3: ar/er/or → insert ve → aver/ever/over (e.g., noris → noveris)
  {
    pattern: ["ar", "er", "or"],
    insert: "ve",
    mode: "after-first",
    label: "Syncope   r => v.r",
    explanation: "Syncopated perfect often drops the 'v' and contracts vowel",
  },
  // Rule 4: ier → insert v → iver (e.g., audierint → audiverint)
  {
    pattern: "ier",
    insert: "v",
    mode: "after-first",
    label: "Syncope  ier=>iver",
    explanation: "Syncopated perfect often drops the 'v' and contracts vowel",
  },
  // Rule 5: s or x → insert is → sis/xis (e.g., dixti → dixisti)
  {
    pattern: ["s", "x"],
    insert: "is",
    mode: "after-first",
    label: "Syncope s/x => +is",
    explanation: "Syncopated perfect sometimes drops the 'is' after 's' or 'x'",
  },
];

/**
 * Try syncope transformations on a word. Returns the first successful
 * syncope result (expanded form that parses as a perfect-system verb).
 */
export function trySyncope(
  word: string,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): SyncopeResult | null {
  for (const rule of SYNCOPE_RULES) {
    const result = tryRule(word, rule, inflIndex, dictIndex);
    if (result) return result;
  }
  return null;
}

function tryRule(
  word: string,
  rule: SyncopeRule,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): SyncopeResult | null {
  const patterns = typeof rule.pattern === "string" ? [rule.pattern] : rule.pattern;

  for (const pat of patterns) {
    // Scan right-to-left for the pattern (Ada scans in reverse)
    // For rule 3 (ar/er/or), Ada starts from S'First + 1, so skip position 0
    const startPos = rule.label.includes("r => v.r") ? 1 : 0;

    for (let i = word.length - pat.length; i >= startPos; i--) {
      if (word.substring(i, i + pat.length) !== pat) continue;

      // Build the expanded form by inserting characters after the first char of the pattern
      const expanded = word.slice(0, i + 1) + rule.insert + word.slice(i + 1);

      // Analyze the expanded form
      const results = analyzeWord(expanded, inflIndex, dictIndex);
      const perfects = results.filter((r) => r.ir.qual.pofs === "V" && r.ir.key === 3);

      if (perfects.length > 0) {
        return {
          label: rule.label,
          explanation: rule.explanation,
          results: listSweep(perfects),
        };
      }
    }
  }

  return null;
}
