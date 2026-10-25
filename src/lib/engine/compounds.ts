import type { DictionaryEntry } from "../types/dictionary.js";
import type { GrammaticalNumber, Mood, Person, Tense, Voice } from "../types/enums.js";
import type { ParseResult } from "./word-analysis.js";

// ---------------------------------------------------------------------------
// Compound verb detection (PPL + sum/esse/fuisse).
//
// When a participle (VPAR PERF PASSIVE, FUT ACTIVE or FUT PASSIVE PPL) is
// followed by a form of "sum" (est, sunt, erat, fuit, sit, esset, etc.), the
// pair forms a compound verb: "amatus est" = PERF PASSIVE IND 3 S of "amo".
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
// Compound glosses and tenses — Ada's Participle_Glosses tables and
// Get_Compound_Tense
// ---------------------------------------------------------------------------

/** A participle's tense and voice, as the gloss tables key it. */
type ParticipleKey = "PERF PASSIVE" | "FUT ACTIVE" | "FUT PASSIVE";

type Glosses = Readonly<Record<ParticipleKey, string>>;

/** Ada's Participle_Glosses: the participles that make a compound with sum. */
const SUM_GLOSSES: Glosses = {
  "PERF PASSIVE": "PERF PASSIVE PPL + verb TO_BE => PASSIVE perfect system",
  "FUT ACTIVE": "FUT ACTIVE PPL + verb TO_BE => ACTIVE Periphrastic - about to, going to",
  "FUT PASSIVE": "FUT PASSIVE PPL + verb TO_BE => PASSIVE Periphrastic - should/ought/had to",
};

/** Ada's Participle_Glosses_With_Esse. */
const ESSE_GLOSSES: Glosses = {
  "PERF PASSIVE": "PERF PASSIVE PPL + esse => PERF PASSIVE INF",
  "FUT ACTIVE": "FUT ACTIVE PPL + esse => PRES Periphastic/FUT ACTIVE INF - be about/going to",
  "FUT PASSIVE": "FUT PASSIVE PPL + esse => PRES PASSIVE INF",
};

/** Ada's Participle_Glosses_With_Fuisse. */
const FUISSE_GLOSSES: Glosses = {
  "PERF PASSIVE": "PERF PASSIVE PPL + esse => PERF PASSIVE INF",
  "FUT ACTIVE": "FUT ACT PPL+fuisse => PERF ACT INF Periphrastic - to have been about/going to",
  "FUT PASSIVE": "FUT PASSIVE PPL + fuisse => PERF PASSIVE INF Periphrastic - about to, going to",
};

/** A reading's key in the gloss tables, if it is a participle they list. */
function participleKey(r: ParseResult): ParticipleKey | undefined {
  if (r.ir.qual.pofs !== "VPAR") return undefined;
  const { tense, voice, mood } = r.ir.qual.vpar.tenseVoiceMood;
  const key = `${tense} ${voice}`;
  return mood === "PPL" && key in SUM_GLOSSES ? (key as ParticipleKey) : undefined;
}

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

/**
 * For a participle + esse or fuisse: a future one reads as PERF with fuisse,
 * and with esse as FUT (active) or PRES (passive); any other keeps its tense.
 */
function infinitiveTense(tense: Tense, voice: Voice, esse: boolean): Tense {
  if (tense !== "FUT") return tense;
  if (!esse) return "PERF";
  return voice === "PASSIVE" ? "PRES" : "FUT";
}

// ---------------------------------------------------------------------------
// Main compound detection
// ---------------------------------------------------------------------------

/** A compound and the readings Ada keeps beside it. */
export interface Compound {
  readonly compound: CompoundResult;
  /** The word's participles that stay, in their order */
  readonly results: readonly ParseResult[];
}

/**
 * Ada's Compounds_With_Sum: a participle followed by a form of sum, esse or
 * fuisse. Before a finite form of sum, a NOM participle of its number that
 * is PERF PASSIVE, FUT ACTIVE or FUT PASSIVE makes the compound, and only
 * the NOM participles of that number stay (Do_Clear_Pas_Nom_Ppl). Before
 * esse or fuisse, a future participle, or a PERF PASSIVE one before esse,
 * makes it, and every participle stays (Do_Clear_Pas_Ppl). Ada adds one PPL+
 * line, with the conjugation and gloss of the first participle, where its
 * backward sweep ends, and under the last, whose kind blanks a DEP verb's
 * voice.
 */
export function tryCompound(results: readonly ParseResult[], nextWord: string): Compound | null {
  const next = nextWord.toLowerCase();
  const sum = isSumForm(next);
  const esse = isEsse(next);
  if (!sum && !esse && !isFuisse(next)) return null;

  const ofSum = (r: ParseResult) =>
    r.ir.qual.pofs === "VPAR" &&
    r.ir.qual.vpar.cs === "NOM" &&
    r.ir.qual.vpar.number === sum?.number;
  const makes = (r: ParseResult) => {
    const key = participleKey(r);
    if (sum) return key !== undefined && ofSum(r);
    return key === "FUT ACTIVE" || key === "FUT PASSIVE" || (key === "PERF PASSIVE" && esse);
  };
  if (!results.some(makes)) return null;

  const kept = results.filter(sum ? ofSum : (r) => r.ir.qual.pofs === "VPAR");
  const byEntry = [...kept].sort((a, b) => a.entryIndex - b.entryIndex);
  const first = byEntry.find((r) => participleKey(r) !== undefined);
  const firstKey = first && participleKey(first);
  const last = byEntry[byEntry.length - 1];
  if (!first || !firstKey || !last || first.ir.qual.pofs !== "VPAR") return null;

  const { con, tenseVoiceMood: tvm } = first.ir.qual.vpar;
  const dep = last.de.part.pofs === "V" && last.de.part.v.kind === "DEP";
  const glosses = sum ? SUM_GLOSSES : esse ? ESSE_GLOSSES : FUISSE_GLOSSES;
  let tense: Tense;
  if (!sum) tense = infinitiveTense(tvm.tense, tvm.voice, esse);
  else tense = firstKey === "PERF PASSIVE" ? getCompoundTense(sum.tense) : sum.tense;
  return {
    compound: {
      stem: `PPL+${next}`,
      con,
      tense,
      voice: dep ? "" : sum ? "PASSIVE" : tvm.voice,
      mood: sum ? sum.mood : "INF",
      person: sum ? sum.person : 0,
      number: sum ? sum.number : "X",
      gloss: glosses[firstKey],
      de: last.de,
      entryIndex: last.entryIndex,
    },
    results: kept,
  };
}
