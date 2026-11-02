// ---------------------------------------------------------------------------
// Two-word splitting — final fallback
//
// When all other parsing methods fail, try splitting the input word at
// every possible position into two parts and analyze each independently.
// Ada warns: "may go very wrong; if not obviously right, it is probably
// incorrect."
// ---------------------------------------------------------------------------

import type { UniqueEntry } from "../parsers/uniques.js";
import type { TackonResult, WordReading } from "./addons-engine.js";
import { listSweep, type SweepOptions } from "./list-sweep.js";
import type { ParseResult } from "./word-analysis.js";

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
  /** Unique readings of the left word */
  readonly leftUniques: readonly UniqueEntry[];
  /** Unique readings of the right word */
  readonly rightUniques: readonly UniqueEntry[];
  /** Packon and tackon readings of the left word: "idemmet" = i + dem, met */
  readonly leftAddons: readonly TackonResult[];
  /** Packon and tackon readings of the right word */
  readonly rightAddons: readonly TackonResult[];
}

const parses = (r: WordReading) =>
  r.results.length > 0 || r.uniques.length > 0 || r.addons.length > 0;

/**
 * Whether the reading ends in a tackon or packon with one reading under it.
 * Ada rejects such a right half, as the next-to-last entry of its parse array
 * is then the tackon: "regishuiusmodi" (huius + modi) is not split, but
 * "registecum" (te ABL and ACC + cum) is.
 */
function endsInLoneTackonReading(r: WordReading): boolean {
  const last = r.addons.at(-1);
  if (last === undefined) return false;
  const base = {
    results: last.baseResults,
    uniques: last.baseUniques ?? [],
    addons: last.baseAddons ?? [],
  };
  if (base.addons.length > 0) return endsInLoneTackonReading(base);
  return base.results.length + base.uniques.length === 1;
}

/**
 * Try splitting the word into two parts, each read as a whole word as Ada's
 * Word reads it ("idemmet" = idem + met, where idem is i + -dem). Returns the
 * first split where both parts parse.
 */
export function tryTwoWords(
  word: string,
  readWord: (word: string) => WordReading,
  options: SweepOptions = {},
): TwoWordResult | null {
  // As in Ada, the left part has at least 2 characters and the right at least 3
  for (let i = 2; i <= word.length - 3; i++) {
    const left = word.slice(0, i);
    const right = word.slice(i);

    const leftReading = readWord(left);
    if (!parses(leftReading)) continue;

    const rightReading = readWord(right);
    if (!parses(rightReading) || endsInLoneTackonReading(rightReading)) continue;

    // Both parts parse — this is a valid two-word split
    return {
      label: "Two words",
      explanation: `May be 2 words combined (${left}+${right}) If not obvious, probably incorrect`,
      left,
      right,
      leftResults: listSweep([...leftReading.results], options),
      rightResults: listSweep([...rightReading.results], options),
      leftUniques: leftReading.uniques,
      rightUniques: rightReading.uniques,
      leftAddons: leftReading.addons,
      rightAddons: rightReading.addons,
    };
  }

  return null;
}
