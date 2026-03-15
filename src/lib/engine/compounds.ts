import type { DictionaryEntry } from "../types/dictionary.js";
import type { GrammaticalNumber, Mood, Person, Tense } from "../types/enums.js";
import type { ParseResult } from "./word-analysis.js";

// ---------------------------------------------------------------------------
// Compound perfect passive detection (PPL + sum/esse/fuisse).
//
// When a perfect passive participle (VPAR PERF PASSIVE PPL) is followed by
// a form of "sum" (est, sunt, erat, fuit, sit, esset, etc.), the pair
// forms a compound verb: "amatus est" = PERF PASSIVE IND 3 S of "amo".
//
// Ada's Compounds_With_Sum in words_engine-parse.adb implements this.
// ---------------------------------------------------------------------------

/** Result of Is_Sum: tense/mood/person/number of a conjugated form of "sum". */
export interface SumFormInfo {
  readonly tense: Tense;
  readonly mood: Mood;
  readonly person: Person;
  readonly number: GrammaticalNumber;
}

/** Compound verb result attached to a WordAnalysis. */
export interface CompoundResult {
  /** The PPL+xxx stem label (e.g., "PPL+est") */
  readonly stem: string;
  /** Conjugation from the VPAR entry */
  readonly con: { readonly which: number; readonly var: number };
  /** Derived compound tense/voice/mood */
  readonly tense: string;
  readonly voice: string;
  readonly mood: string;
  /** Person/number from the sum form (or 0/X for infinitives) */
  readonly person: number;
  readonly number: string;
  /** Explanation gloss */
  readonly gloss: string;
  /** The verb's dictionary entry */
  readonly de: DictionaryEntry;
  readonly entryIndex: number;
}

// ---------------------------------------------------------------------------
// Is_Sum — lookup table of all conjugated forms of "sum, esse, fui"
// Indexed by [mood][tense][number][person]. Mirrors Ada's Sa array.
// ---------------------------------------------------------------------------

type SumTable = Record<string, SumFormInfo>;

function buildSumTable(): SumTable {
  const table: SumTable = {};

  // Ada's Sa array: [mood (IND/SUB)][tense (PRES-FUTP)][number (S/P)][person (1-3)]
  const forms: Array<[string, Tense, Mood, GrammaticalNumber, Person]> = [
    // IND PRES
    ["sum", "PRES", "IND", "S", 1],
    ["es", "PRES", "IND", "S", 2],
    ["est", "PRES", "IND", "S", 3],
    ["sumus", "PRES", "IND", "P", 1],
    ["estis", "PRES", "IND", "P", 2],
    ["sunt", "PRES", "IND", "P", 3],
    // IND IMPF
    ["eram", "IMPF", "IND", "S", 1],
    ["eras", "IMPF", "IND", "S", 2],
    ["erat", "IMPF", "IND", "S", 3],
    ["eramus", "IMPF", "IND", "P", 1],
    ["eratis", "IMPF", "IND", "P", 2],
    ["erant", "IMPF", "IND", "P", 3],
    // IND FUT
    ["ero", "FUT", "IND", "S", 1],
    ["eris", "FUT", "IND", "S", 2],
    ["erit", "FUT", "IND", "S", 3],
    ["erimus", "FUT", "IND", "P", 1],
    ["eritis", "FUT", "IND", "P", 2],
    ["erunt", "FUT", "IND", "P", 3],
    // IND PERF
    ["fui", "PERF", "IND", "S", 1],
    ["fuisti", "PERF", "IND", "S", 2],
    ["fuit", "PERF", "IND", "S", 3],
    ["fuimus", "PERF", "IND", "P", 1],
    ["fuistis", "PERF", "IND", "P", 2],
    ["fuerunt", "PERF", "IND", "P", 3],
    // IND PLUP
    ["fueram", "PLUP", "IND", "S", 1],
    ["fueras", "PLUP", "IND", "S", 2],
    ["fuerat", "PLUP", "IND", "S", 3],
    ["fueramus", "PLUP", "IND", "P", 1],
    ["fueratis", "PLUP", "IND", "P", 2],
    ["fuerant", "PLUP", "IND", "P", 3],
    // IND FUTP
    ["fuero", "FUTP", "IND", "S", 1],
    ["fueris", "FUTP", "IND", "S", 2],
    ["fuerit", "FUTP", "IND", "S", 3],
    ["fuerimus", "FUTP", "IND", "P", 1],
    ["fueritis", "FUTP", "IND", "P", 2],
    // Ada has "fuerunt" for FUTP 3 P as well — same as PERF 3 P
    ["fuerunt", "FUTP", "IND", "P", 3],
    // SUB PRES
    ["sim", "PRES", "SUB", "S", 1],
    ["sis", "PRES", "SUB", "S", 2],
    ["sit", "PRES", "SUB", "S", 3],
    ["simus", "PRES", "SUB", "P", 1],
    ["sitis", "PRES", "SUB", "P", 2],
    ["sint", "PRES", "SUB", "P", 3],
    // SUB IMPF
    ["essem", "IMPF", "SUB", "S", 1],
    ["esses", "IMPF", "SUB", "S", 2],
    ["esset", "IMPF", "SUB", "S", 3],
    ["essemus", "IMPF", "SUB", "P", 1],
    ["essetis", "IMPF", "SUB", "P", 2],
    ["essent", "IMPF", "SUB", "P", 3],
    // SUB PERF
    ["fuerim", "PERF", "SUB", "S", 1],
    ["fueris", "PERF", "SUB", "S", 2],
    ["fuerit", "PERF", "SUB", "S", 3],
    ["fuerimus", "PERF", "SUB", "P", 1],
    ["fueritis", "PERF", "SUB", "P", 2],
    ["fuerint", "PERF", "SUB", "P", 3],
    // SUB PLUP
    ["fuissem", "PLUP", "SUB", "S", 1],
    ["fuisses", "PLUP", "SUB", "S", 2],
    ["fuisset", "PLUP", "SUB", "S", 3],
    ["fuissemus", "PLUP", "SUB", "P", 1],
    ["fuissetis", "PLUP", "SUB", "P", 2],
    ["fuissent", "PLUP", "SUB", "P", 3],
  ];

  for (const [word, tense, mood, number, person] of forms) {
    // Don't overwrite if already present (e.g., "fuerunt" appears twice)
    if (!table[word]) {
      table[word] = { tense, mood, person, number };
    }
  }

  return table;
}

const SUM_TABLE = buildSumTable();

/** Check if a word is a conjugated form of "sum, esse, fui". */
export function isSumForm(word: string): SumFormInfo | null {
  if (word.length === 0) return null;
  const first = word[0];
  // Fast reject: sum forms only start with s, e, f
  if (first !== "s" && first !== "e" && first !== "f") return null;
  return SUM_TABLE[word] ?? null;
}

/** Check if a word is "esse" (present infinitive of sum). */
export function isEsse(word: string): boolean {
  return word === "esse";
}

/** Check if a word is "fuisse" (perfect infinitive of sum). */
export function isFuisse(word: string): boolean {
  return word === "fuisse";
}

// ---------------------------------------------------------------------------
// Compound tense derivation — Ada's Get_Compound_Tense
// ---------------------------------------------------------------------------

/**
 * For PERF PASSIVE PPL + sum finite form:
 * PRES/PERF → PERF, IMPF/PLUP → PLUP, FUT → FUTP
 */
function getCompoundTense(sumTense: Tense): Tense {
  switch (sumTense) {
    case "PRES":
    case "PERF":
      return "PERF";
    case "IMPF":
    case "PLUP":
      return "PLUP";
    case "FUT":
      return "FUTP";
    default:
      /* v8 ignore next */
      return "X";
  }
}

const PPL_GLOSS = "PERF PASSIVE PPL + verb TO_BE => PASSIVE perfect system";

// ---------------------------------------------------------------------------
// Main compound detection
// ---------------------------------------------------------------------------

/**
 * Try to form a compound verb from VPAR results + a following word.
 * Returns compound results if the next word is a form of sum/esse/fuisse.
 */
export function tryCompound(results: readonly ParseResult[], nextWord: string): CompoundResult[] {
  if (nextWord.length === 0) return [];

  const lowerNext = nextWord.toLowerCase();

  // Check if next word is a form of sum
  const sumInfo = isSumForm(lowerNext);
  const esse = isEsse(lowerNext);
  const fuisse = isFuisse(lowerNext);

  if (!sumInfo && !esse && !fuisse) return [];

  // Find VPAR PERF PASSIVE PPL results
  const compounds: CompoundResult[] = [];
  const seen = new Set<number>(); // deduplicate by entryIndex

  for (const r of results) {
    if (r.ir.qual.pofs !== "VPAR") continue;
    const vpar = r.ir.qual.vpar;
    const tvm = vpar.tenseVoiceMood;

    // Only PERF PASSIVE PPL
    if (tvm.tense !== "PERF" || tvm.voice !== "PASSIVE" || tvm.mood !== "PPL") continue;

    // For finite sum forms, only NOM case participles form compounds
    if (sumInfo && vpar.cs !== "NOM") continue;

    // Skip duplicate dictionary entries
    if (seen.has(r.entryIndex)) continue;
    seen.add(r.entryIndex);

    // Determine verb kind for voice display
    const verbKind = r.de.part.pofs === "V" ? r.de.part.v.kind : "";
    const showVoice = verbKind !== "DEP" && verbKind !== "SEMIDEP";

    if (sumInfo) {
      // PPL + finite sum → compound finite verb
      const compoundTense = getCompoundTense(sumInfo.tense);
      compounds.push({
        stem: `PPL+${lowerNext}`,
        con: r.de.part.pofs === "V" ? r.de.part.v.con : { which: 0, var: 0 },
        tense: compoundTense,
        voice: showVoice ? "PASSIVE" : "",
        mood: sumInfo.mood,
        person: sumInfo.person,
        number: sumInfo.number,
        gloss: PPL_GLOSS,
        de: r.de,
        entryIndex: r.entryIndex,
      });
    } else if (esse || fuisse) {
      // PPL + esse/fuisse → compound infinitive
      compounds.push({
        stem: `PPL+${lowerNext}`,
        con: r.de.part.pofs === "V" ? r.de.part.v.con : { which: 0, var: 0 },
        tense: "PERF",
        voice: showVoice ? "PASSIVE" : "",
        mood: "INF",
        person: 0,
        number: "X",
        gloss: PPL_GLOSS,
        de: r.de,
        entryIndex: r.entryIndex,
      });
    }
  }

  return compounds;
}
