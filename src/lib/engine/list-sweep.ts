import type { Frequency } from "../types/enums.js";
import { extractQuality, qualityDedupeKey } from "../types/quality-extract.js";
import type { ParseResult } from "./word-analysis.js";

// ---------------------------------------------------------------------------
// List sweep pipeline — deduplicate, filter, normalize, rank.
//
// Each step is independently exported for testing and composability.
// The main `listSweep` function composes them in the correct order.
// ---------------------------------------------------------------------------

/**
 * Full list sweep pipeline: deduplicate → filter → normalize → rank.
 * Order matters: filter uses pre-normalization values (e.g., V 3,4 not 4,1).
 */
export function listSweep(results: ParseResult[]): ParseResult[] {
  return rank(normalizeDisplay(filterByPOS(deduplicate(results))));
}

// ---------------------------------------------------------------------------
// Step 1: Deduplication
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
// Step 2: POS-specific filtering
// ---------------------------------------------------------------------------

/** Filter out grammatically invalid forms based on POS-specific rules. */
export function filterByPOS(results: ParseResult[]): ParseResult[] {
  return results.filter((r) => {
    // PREP: only keep the inflection matching the dictionary entry's obj case
    if (r.ir.qual.pofs === "PREP" && r.de.part.pofs === "PREP") {
      return r.ir.qual.prep.cs === r.de.part.prep.obj;
    }

    // Personal names (kind N=proper name, P=person): filter plural and locative.
    // These are individual persons that cannot be plural or have a location.
    // The Ada original does not do this, but generic variant-0 inflections
    // produce nonsensical forms for proper-name entries.
    if (
      r.ir.qual.pofs === "N" &&
      r.de.part.pofs === "N" &&
      (r.de.part.n.kind === "N" || r.de.part.n.kind === "P") &&
      (r.ir.qual.noun.number === "P" || r.ir.qual.noun.cs === "LOC")
    ) {
      return false;
    }

    // Pluralia tantum (kind=M): plural-only nouns should not produce singular
    // forms. Kind M is "plural or Multiple only" in Ada's type system.
    // Combined with zzz stem1 to block NOM/VOC S, this filters all singulars.
    if (
      r.ir.qual.pofs === "N" &&
      r.de.part.pofs === "N" &&
      r.de.part.n.kind === "M" &&
      r.ir.qual.noun.number === "S"
    ) {
      return false;
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
// Step 3: Display normalization
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

  // V (3,4) → (4,1) display normalization. Only applies to V and SUPINE.
  // VPAR keeps (3,4) — Ada displays VPAR with the raw conjugation values.
  if (q.pofs === "V" && q.verb.con.which === 3 && q.verb.con.var === 4) {
    return {
      ...r,
      ir: {
        ...r.ir,
        qual: { ...q, verb: { ...q.verb, con: { which: 4, var: 1 } } },
      },
    };
  }
  if (q.pofs === "SUPINE" && q.supine.con.which === 3 && q.supine.con.var === 4) {
    return {
      ...r,
      ir: {
        ...r.ir,
        qual: { ...q, supine: { ...q.supine, con: { which: 4, var: 1 } } },
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
// Step 4: Ranking
// ---------------------------------------------------------------------------

/** Sort results by dictionary frequency (most common first) then POS priority,
 *  then within the same entry by number (S < P) and case (Ada order). */
export function rank(results: ParseResult[]): ParseResult[] {
  const sorted = [...results];
  sorted.sort((a, b) => {
    const freqDiff = (FREQ_RANK[a.de.tran.freq] ?? 10) - (FREQ_RANK[b.de.tran.freq] ?? 10);
    if (freqDiff !== 0) return freqDiff;
    const pofsDiff = (POFS_RANK[a.ir.qual.pofs] ?? 12) - (POFS_RANK[b.ir.qual.pofs] ?? 12);
    if (pofsDiff !== 0) return pofsDiff;
    // Within same POS, sort by entry index to keep groups together
    if (a.entryIndex !== b.entryIndex) return a.entryIndex - b.entryIndex;
    // Within same entry, sort by number then case (Ada ordering)
    const av = extractQuality(a.ir.qual);
    const bv = extractQuality(b.ir.qual);
    const numDiff = (NUM_RANK[av.number ?? ""] ?? 2) - (NUM_RANK[bv.number ?? ""] ?? 2);
    if (numDiff !== 0) return numDiff;
    return (CASE_RANK[av.cs ?? ""] ?? 9) - (CASE_RANK[bv.cs ?? ""] ?? 9);
  });
  return sorted;
}

/** Ada case ordering: NOM, VOC, GEN, DAT, ABL, ACC. */
const CASE_RANK: Record<string, number> = {
  NOM: 0,
  VOC: 1,
  GEN: 2,
  DAT: 3,
  ABL: 4,
  ACC: 5,
  X: 6,
};

const NUM_RANK: Record<string, number> = { S: 0, P: 1, X: 2 };

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
