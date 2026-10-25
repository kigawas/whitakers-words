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
// characters, and re-analyzes. Only accepted if a reading is a verb (V)
// with key=3 (perfect system).
// ---------------------------------------------------------------------------

import type { DictionaryIndex } from "./dictionary-index.js";
import type { InflectionIndex } from "./inflection-index.js";
import { listSweep, type SweepOptions } from "./list-sweep.js";
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
  /** Fragments to search for, all of one length */
  fragments: string[];
  /** Characters to insert after the fragment's first character */
  insert: string;
  /** The first position Ada scans */
  from: number;
  /** How many characters must follow the position (Ada's S'Last - n) */
  after: number;
  /** Annotation label */
  label: string;
  /** Explanation text */
  explanation: string;
}

const SYNCOPE_RULES: SyncopeRule[] = [
  // Rule 1: ii → insert v → ivi (e.g., audii → audivi)
  {
    fragments: ["ii"],
    insert: "v",
    from: 0,
    after: 1,
    label: "Syncope  ii => ivi",
    explanation: "Syncopated perfect ivi can drop 'v' without contracting vowel",
  },
  // Rule 2: as/es/is/os → insert vi → avis/evis/ivis/ovis (e.g., petisti → petivisti)
  {
    fragments: ["as", "es", "is", "os"],
    insert: "vi",
    from: 0,
    after: 2,
    label: "Syncope   s => vis",
    explanation: "Syncopated perfect often drops the 'v' and contracts vowel",
  },
  // Rule 3: ar/er/or → insert ve → aver/ever/over (e.g., noris → noveris)
  {
    fragments: ["ar", "er", "or"],
    insert: "ve",
    from: 1,
    after: 2,
    label: "Syncope   r => v.r",
    explanation: "Syncopated perfect often drops the 'v' and contracts vowel",
  },
  // Rule 4: ier → insert v → iver (e.g., audierint → audiverint)
  {
    fragments: ["ier"],
    insert: "v",
    from: 0,
    after: 3,
    label: "Syncope  ier=>iver",
    explanation: "Syncopated perfect often drops the 'v' and contracts vowel",
  },
  // Rule 5: s or x → insert is → sis/xis (e.g., dixti → dixisti)
  {
    fragments: ["s", "x"],
    insert: "is",
    from: 0,
    after: 2,
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
  options: SweepOptions = {},
): SyncopeResult | null {
  for (const rule of SYNCOPE_RULES) {
    const result = tryRule(word, rule, inflIndex, dictIndex, options);
    if (result) return result;
  }
  return null;
}

function tryRule(
  word: string,
  rule: SyncopeRule,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
  options: SweepOptions,
): SyncopeResult | null {
  // Ada scans right to left and stops at the first expanded form that reads
  // at all. It keeps every reading when its last one is a perfect (amore:
  // amovere, the present infinitive with the perfect), and otherwise tries
  // the next rule; the port takes any perfect reading for the last.
  const size = rule.fragments[0]?.length ?? 0;
  for (let i = word.length - 1 - rule.after; i >= rule.from; i--) {
    if (!rule.fragments.includes(word.substring(i, i + size))) continue;
    const expanded = word.slice(0, i + 1) + rule.insert + word.slice(i + 1);
    const results = analyzeWord(expanded, inflIndex, dictIndex);
    if (results.length === 0) continue;
    if (!results.some((r) => r.ir.qual.pofs === "V" && r.ir.key === 3)) return null;
    return {
      label: rule.label,
      explanation: rule.explanation,
      results: listSweep(results, options),
    };
  }

  return null;
}
