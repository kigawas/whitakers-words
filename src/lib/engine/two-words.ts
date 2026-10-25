// ---------------------------------------------------------------------------
// Two-word splitting — final fallback
//
// When all other parsing methods fail, try splitting the input word at
// every possible position into two parts and analyze each independently.
// Ada warns: "may go very wrong; if not obviously right, it is probably
// incorrect."
// ---------------------------------------------------------------------------

import type { DictionaryIndex } from "./dictionary-index.js";
import type { InflectionIndex } from "./inflection-index.js";
import { listSweep, type SweepOptions } from "./list-sweep.js";
import { analyzeWord, type ParseResult } from "./word-analysis.js";

export interface TwoWordResult {
  /** The two-word annotation line */
  readonly label: string;
  /** The explanation line */
  readonly explanation: string;
  /** Left word */
  readonly left: string;
  /** Right word */
  readonly right: string;
  /** Parse results for the left word (the first part) */
  readonly leftResults: readonly ParseResult[];
  /** Parse results for the right word (the second part) */
  readonly rightResults: readonly ParseResult[];
}

/**
 * Try splitting the word into two parts and analyzing each independently.
 * Returns the first successful split where both parts produce valid results.
 * Only the second (right) word's results are shown, following Ada's behavior.
 */
export function tryTwoWords(
  word: string,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
  options: SweepOptions = {},
): TwoWordResult | null {
  // As in Ada, the left part has at least 2 characters and the right at least 3
  for (let i = 2; i <= word.length - 3; i++) {
    const left = word.slice(0, i);
    const right = word.slice(i);

    // Analyze both parts
    const leftResults = analyzeWord(left, inflIndex, dictIndex);
    if (leftResults.length === 0) continue;

    const rightResults = analyzeWord(right, inflIndex, dictIndex);
    if (rightResults.length === 0) continue;

    // Both parts parse — this is a valid two-word split
    return {
      label: "Two words",
      explanation: `May be 2 words combined (${left}+${right}) If not obvious, probably incorrect`,
      left,
      right,
      leftResults: listSweep(leftResults, options),
      rightResults: listSweep(rightResults, options),
    };
  }

  return null;
}
