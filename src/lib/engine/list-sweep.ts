import {
  CASES,
  COMPARISONS,
  type Frequency,
  GENDERS,
  MOODS,
  NUMBERS,
  NUMERAL_SORTS,
  PARTS_OF_SPEECH,
  TENSES,
  VOICES,
} from "../types/enums.js";
import type { QualityRecord } from "../types/inflections.js";
import { extractQuality, qualityDedupeKey } from "../types/quality-extract.js";
import type { ParseResult } from "./word-analysis.js";

// ---------------------------------------------------------------------------
// List sweep pipeline — filter, trim, deduplicate, normalize, rank.
//
// Each step is independently exported for testing and composability.
// The main `listSweep` function composes them in the correct order.
// ---------------------------------------------------------------------------

export interface SweepOptions {
  /** Ada's Trim_Output: trim archaic and uncommon inflections (default true). */
  readonly trim?: boolean;
}

/**
 * Full list sweep pipeline: filter → trim → deduplicate → normalize → rank.
 * Order matters: filter uses pre-normalization values (e.g., V 3,4 not 4,1),
 * and as in Ada, trimming comes before deduplication, so of two inflections
 * with the same quality the one the trim keeps survives (manis NOM P).
 */
export function listSweep(
  results: ParseResult[],
  { trim = true }: SweepOptions = {},
): ParseResult[] {
  const filtered = filterByPOS(results);
  return rank(normalizeDisplay(deduplicate(trim ? trimRare(filtered) : filtered)));
}

// ---------------------------------------------------------------------------
// Step 1: POS-specific filtering
// ---------------------------------------------------------------------------

/** Filter out grammatically invalid forms based on POS-specific rules. */
export function filterByPOS(results: ParseResult[]): ParseResult[] {
  return results.filter((r) => {
    // PREP: only keep the inflection matching the dictionary entry's obj case
    if (r.ir.qual.pofs === "PREP" && r.de.part.pofs === "PREP") {
      return r.ir.qual.prep.cs === r.de.part.prep.obj;
    }

    if (r.ir.qual.pofs !== "V" || r.de.part.pofs !== "V") return true;
    const kind = r.de.part.v.kind;
    const tvm = r.ir.qual.verb.tenseVoiceMood;

    // Imperative: only PRES 2nd person or FUT 2nd/3rd person
    if (tvm.mood === "IMP") {
      const validImp =
        (tvm.tense === "PRES" && r.ir.qual.verb.person === 2) ||
        (tvm.tense === "FUT" && (r.ir.qual.verb.person === 2 || r.ir.qual.verb.person === 3));
      if (!validImp) return false;

      // V 3,1 PRES ACTIVE IMP 2 S with blank ending is only for stems ending in -c
      // (dic, duc, fac). Filter spurious matches like "illud" → "illudo".
      if (
        r.ir.ending.size === 0 &&
        tvm.tense === "PRES" &&
        tvm.voice === "ACTIVE" &&
        r.ir.qual.verb.con.which === 3 &&
        r.ir.qual.verb.con.var === 1 &&
        r.stem.length > 0 &&
        r.stem[r.stem.length - 1] !== "c"
      ) {
        return false;
      }
    }

    // IMPERS: only 3rd person allowed
    if (kind === "IMPERS") {
      return r.ir.qual.verb.person === 3 || r.ir.qual.verb.person === 0;
    }

    // DEP: only passive voice allowed (except FUT ACTIVE INF)
    if (kind === "DEP") {
      if (tvm.voice === "ACTIVE" && tvm.tense === "FUT" && tvm.mood === "INF") return true;
      if (
        tvm.voice === "ACTIVE" &&
        (tvm.mood === "IND" || tvm.mood === "SUB" || tvm.mood === "IMP" || tvm.mood === "INF")
      )
        return false;
      return true;
    }

    // SEMIDEP: no passive in PRES/IMPF/FUT, no active in PERF/PLUP/FUTP
    if (kind === "SEMIDEP") {
      if (tvm.mood === "IND" || tvm.mood === "IMP") {
        if (
          tvm.voice === "PASSIVE" &&
          (tvm.tense === "PRES" || tvm.tense === "IMPF" || tvm.tense === "FUT")
        )
          return false;
        if (
          tvm.voice === "ACTIVE" &&
          (tvm.tense === "PERF" || tvm.tense === "PLUP" || tvm.tense === "FUTP")
        )
          return false;
      }
      return true;
    }

    return true;
  });
}

// ---------------------------------------------------------------------------
// Step 2: Trimming rare inflections
// ---------------------------------------------------------------------------

/** Inflection frequencies more common than C (Ada orders X first). */
const COMMON_INFLECTION: ReadonlySet<Frequency> = new Set(["X", "A", "B"]);

/** Entry frequencies more common than D. */
const COMMON_ENTRY: ReadonlySet<Frequency> = new Set(["X", "A", "B", "C"]);

/**
 * Ada's Trim_Output (Order_Parse_Array in words_engine-list_sweep.adb), with
 * Omit_Archaic and Omit_Uncommon on by default: drop archaic inflections if
 * some reading has neither an archaic inflection nor an archaic entry, and
 * uncommon inflections if some reading has a common inflection and entry.
 */
export function trimRare(results: ParseResult[]): ParseResult[] {
  const notOnlyArchaic = results.some((r) => r.ir.age !== "A" && r.de.tran.age !== "A");
  const notOnlyUncommon = results.some(
    (r) => COMMON_INFLECTION.has(r.ir.freq) && COMMON_ENTRY.has(r.de.tran.freq),
  );
  return results.filter(
    (r) =>
      !(notOnlyArchaic && r.ir.age === "A") &&
      !(notOnlyUncommon && !COMMON_INFLECTION.has(r.ir.freq)),
  );
}

// ---------------------------------------------------------------------------
// Step 3: Deduplication
// ---------------------------------------------------------------------------

/** Remove exact duplicates (same entryIndex + same inflection quality). */
export function deduplicate(results: ParseResult[]): ParseResult[] {
  const seen = new Set<string>();
  const out: ParseResult[] = [];

  for (const r of results) {
    const key = qualityDedupeKey(r.entryIndex, extractQuality(r.ir.qual));
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Step 4: Display normalization
// ---------------------------------------------------------------------------

/**
 * Normalize internal encoding values for display:
 * - V con (3,4) → (4,1): 4th conjugation stored as 3rd variant 4
 * - PRON decl (1,X) → (1,0): destroy artificial variant for PRON 1
 */
export function normalizeDisplay(results: ParseResult[]): ParseResult[] {
  return results.map(normalizeDisplayValues);
}

function normalizeDisplayValues(r: ParseResult): ParseResult {
  const q = r.ir.qual;

  // V (3,4) → (4,1) display normalization, for V only, as in Ada's
  // List_Sweep: VPAR and SUPINE keep (3,4) (vent.um SUPINE 3 4).
  if (q.pofs === "V" && q.verb.con.which === 3 && q.verb.con.var === 4) {
    return {
      ...r,
      ir: {
        ...r.ir,
        qual: { ...q, verb: { ...q.verb, con: { which: 4, var: 1 } } },
      },
    };
  }

  // PRON decl (1,X) → (1,0)
  if (q.pofs === "PRON" && q.pron.decl.which === 1) {
    return {
      ...r,
      ir: {
        ...r.ir,
        qual: { ...q, pron: { ...q.pron, decl: { which: 1, var: 0 } } },
      },
    };
  }

  return r;
}

// ---------------------------------------------------------------------------
// Step 5: Ranking
// ---------------------------------------------------------------------------

/** Sort results by dictionary frequency (most common first) then POS priority,
 *  then within the same entry in Ada's order (qualityKey). */
export function rank(results: ParseResult[]): ParseResult[] {
  return results
    .map((r) => ({ r, key: qualityKey(r.ir.qual) }))
    .sort((a, b) => {
      const freqDiff = (FREQ_RANK[a.r.de.tran.freq] ?? 10) - (FREQ_RANK[b.r.de.tran.freq] ?? 10);
      if (freqDiff !== 0) return freqDiff;
      const pofsDiff = (POFS_RANK[a.r.ir.qual.pofs] ?? 12) - (POFS_RANK[b.r.ir.qual.pofs] ?? 12);
      if (pofsDiff !== 0) return pofsDiff;
      // Within same POS, sort by entry index to keep groups together
      if (a.r.entryIndex !== b.r.entryIndex) return a.r.entryIndex - b.r.entryIndex;
      return compareKeys(a.key, b.key);
    })
    .map(({ r }) => r);
}

/**
 * The fields of a reading that Ada's Quality_Record "<" compares
 * (inflections_package.adb:40-214), in its order, by which Order_Parse_Array
 * sorts the readings of one entry: part of speech, then declension or
 * conjugation, number, case, gender, comparison and numeral sort, then tense,
 * voice, mood and person, each as its place in Ada's enumeration (X first, LOC
 * between GEN and DAT, so an infinitive's number X comes before S). A part of
 * speech without a field has none to differ in. Ada's VPAR stops at gender,
 * so a participle's tense, voice and mood leave two readings in place. Ada's
 * further ties, by meaning and ending size, compare readings of one quality,
 * which deduplicate has already merged.
 */
function qualityKey(q: QualityRecord): number[] {
  const v = extractQuality(q);
  const [which = 0, variant = 0] = v.decl ?? [];
  const verb = q.pofs === "VPAR" ? { tense: "", voice: "", mood: "", person: "" } : v;
  return [
    at(PARTS_OF_SPEECH, v.pofs),
    which,
    variant,
    at(NUMBERS, v.number),
    at(CASES, v.cs),
    at(GENDERS, v.gender),
    at(COMPARISONS, v.comparison),
    at(NUMERAL_SORTS, v.sort),
    at(TENSES, verb.tense),
    at(VOICES, verb.voice),
    at(MOODS, verb.mood),
    Number(verb.person),
  ];
}

const at = (values: readonly string[], value: string): number => values.indexOf(value);

/** The first difference between two keys, which qualityKey gives one length, or 0. */
function compareKeys(a: readonly number[], b: readonly number[]): number {
  return a.reduce((diff, k, i) => diff || k - (b[i] as number), 0);
}

/** Lower rank = more common. Frequency A is most common. */
const FREQ_RANK: Record<Frequency | string, number> = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  I: 6,
  M: 7,
  N: 8,
  X: 9,
};

/** Lower rank = higher priority. Nouns first, then verbs, adj, etc. */
const POFS_RANK: Record<string, number> = {
  N: 0,
  PRON: 1,
  PACK: 2,
  V: 3,
  VPAR: 4,
  SUPINE: 5,
  ADJ: 6,
  NUM: 7,
  ADV: 8,
  PREP: 9,
  CONJ: 10,
  INTERJ: 11,
};
