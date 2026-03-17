import type { DictionaryEntry } from "../types/dictionary.js";
import type { Comparison, StemKey } from "../types/enums.js";
import type { InflectionRecord, QualityRecord } from "../types/inflections.js";
import type { DictionaryIndex, DictionaryStem } from "./dictionary-index.js";
import { lookupStems } from "./dictionary-index.js";
import type { InflectionIndex } from "./inflection-index.js";
import { lookupInflections } from "./inflection-index.js";

// ---------------------------------------------------------------------------
// Run_Inflections — generate all possible stem/ending splits for a word
// ---------------------------------------------------------------------------

export interface StemEndingPair {
  readonly stem: string;
  readonly ir: InflectionRecord;
}

/**
 * For a given word, try all possible splits into stem + ending.
 * Returns pairs of (stem, inflection_record) where the ending matches.
 *
 * This mirrors Ada's Run_Inflections procedure.
 */
export function runInflections(word: string, inflectionIndex: InflectionIndex): StemEndingPair[] {
  const results: StemEndingPair[] = [];
  const wordLen = word.length;

  // 1. Try blank endings (the whole word is the stem)
  if (wordLen <= 18) {
    // MAX_STEM_SIZE = 18
    for (const ir of inflectionIndex.blank) {
      results.push({ stem: word, ir });
    }
  }

  // 2. Try endings of size 1 to min(MAX_ENDING_SIZE, wordLen)
  // endingSize can equal wordLen (stem = "") for blank-stem entries like sum/esse
  const maxEnding = Math.min(7, wordLen); // MAX_ENDING_SIZE = 7
  for (let endingSize = maxEnding; endingSize >= 1; endingSize--) {
    const stemLen = wordLen - endingSize;
    if (stemLen > 18) continue; // MAX_STEM_SIZE = 18

    const lastChar = word.charAt(wordLen - 1);
    const candidates = lookupInflections(inflectionIndex, endingSize, lastChar);
    if (candidates.length === 0) continue;

    const wordEnding = word.slice(stemLen);
    const stem = word.slice(0, stemLen);

    for (const ir of candidates) {
      // Verify the full ending matches (not just size and last char)
      if (ir.ending.suf === wordEnding) {
        results.push({ stem, ir });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Search_Dictionaries — look up stems in the dictionary
// ---------------------------------------------------------------------------

export interface ParseResult {
  readonly stem: string;
  readonly ir: InflectionRecord;
  readonly de: DictionaryEntry;
  readonly entryIndex: number;
}

/**
 * For each stem/ending pair from runInflections, look up the stem in the
 * dictionary and verify the match is grammatically valid.
 *
 * This mirrors Ada's Dictionary_Search / Search_Dictionaries procedure.
 */
export function searchDictionaries(
  pairs: readonly StemEndingPair[],
  dictIndex: DictionaryIndex,
): ParseResult[] {
  const results: ParseResult[] = [];

  for (const pair of pairs) {
    let dictStems: readonly DictionaryStem[];

    if (pair.stem.length === 0) {
      // Empty stem (ending = entire word) — search the blank-stem dictionary (Ada's Bdl).
      // BDL is pre-filtered at build time to only contain blank stems.
      // Skip wildcard ADJ/NUM inflections (key=0) — these are designed to match
      // any real stem, not blank stems. Allowing them produces false positives
      // like "i" → ADJ "imus" via BDL.
      const pofs = pair.ir.qual.pofs;
      if (pair.ir.key === 0 && (pofs === "ADJ" || pofs === "NUM")) continue;
      dictStems = dictIndex.bdl;
    } else {
      dictStems = lookupStems(dictIndex, pair.stem);
    }
    if (dictStems.length === 0) continue;

    for (const ds of dictStems) {
      const entry = dictIndex.entries[ds.entryIndex];
      if (!entry) continue;

      // Verify compatibility and resolve wildcards in one pass
      const resolvedIr = matchAndResolve(pair.ir, entry, ds.stemKey);
      if (!resolvedIr) continue;

      results.push({
        stem: pair.stem,
        ir: resolvedIr,
        de: entry,
        entryIndex: ds.entryIndex,
      });
    }
  }

  return results;
}

/**
 * Check compatibility AND resolve wildcards in one pass.
 * Returns the resolved InflectionRecord if compatible, null if not.
 * Combines Ada's POS check, declension check, and Reduce_Stem_List wildcard resolution.
 */
function matchAndResolve(
  ir: InflectionRecord,
  de: DictionaryEntry,
  stemKey: StemKey,
): InflectionRecord | null {
  const qual = ir.qual;
  const part = de.part;
  const inflPofs = qual.pofs;
  const dictPofs = part.pofs;

  // POS compatibility
  if (inflPofs !== dictPofs) {
    if (inflPofs === "PACK" && dictPofs === "PRON") {
      /* ok */
    } else if ((inflPofs === "VPAR" || inflPofs === "SUPINE") && dictPofs === "V") {
      /* ok */
    } else if (inflPofs !== "X" && dictPofs !== "X") {
      return null;
    }
  }

  // Stem key compatibility: key 0 is wildcard, otherwise must match exactly.
  // Exception: ADJ/ADV/NUM entries can have comparison/sort forms that use a
  // different stem key than the one stored (e.g., imus ADJ SUPER has only
  // stem1 but matches key=4 inflections). But NOT for blank-stem (BDL) matches
  // where the stem is empty — those need strict key matching to avoid false positives.
  if (ir.key !== 0 && stemKey !== 0 && ir.key !== stemKey) {
    if (dictPofs !== "ADJ" && dictPofs !== "ADV" && dictPofs !== "NUM") {
      return null;
    }
    // Reject blank-stem matches even for ADJ/ADV/NUM — the key mismatch exemption
    // is for comparison forms (stem1 matching key=4 inflections), not for BDL entries.
    if (de.stems[0] !== undefined && de.stems[0].length <= 1) {
      return null;
    }
  }

  // Declension/comparison compatibility + wildcard resolution
  const resolved = matchAndResolveQuality(qual, part, stemKey);
  if (!resolved) return null;

  return resolved === qual ? ir : { ...ir, qual: resolved };
}

/** Match declension/comparison and resolve wildcards. Returns null if incompatible. */
function matchAndResolveQuality(
  qual: QualityRecord,
  part: DictionaryEntry["part"],
  stemKey: StemKey,
): QualityRecord | null {
  switch (qual.pofs) {
    case "N":
      if (part.pofs !== "N") return null;
      if (!matchesDecn(qual.noun.decl, part.n.decl)) return null;
      return {
        pofs: "N",
        noun: {
          decl: part.n.decl,
          cs: qual.noun.cs,
          number: qual.noun.number,
          gender:
            qual.noun.gender === "C" || qual.noun.gender === "X" ? part.n.gender : qual.noun.gender,
        },
      };
    case "PRON":
      if (part.pofs !== "PRON") return null;
      if (!matchesDecn(qual.pron.decl, part.pron.decl)) return null;
      return {
        pofs: "PRON",
        pron: {
          decl: part.pron.decl,
          cs: qual.pron.cs,
          number: qual.pron.number,
          gender: qual.pron.gender,
        },
      };
    case "PACK":
      if (part.pofs !== "PRON") return null;
      return {
        pofs: "PACK",
        pack: {
          decl: part.pron.decl,
          cs: qual.pack.cs,
          number: qual.pack.number,
          gender: qual.pack.gender,
        },
      };
    case "ADJ": {
      if (part.pofs !== "ADJ") return null;
      if (!matchesDecn(qual.adj.decl, part.adj.decl)) return null;
      const ic = qual.adj.comparison;
      const dc = part.adj.co;
      if (ic !== dc && ic !== "X" && dc !== "X") return null;
      return {
        pofs: "ADJ",
        adj: {
          decl: part.adj.decl,
          cs: qual.adj.cs,
          number: qual.adj.number,
          gender: qual.adj.gender,
          comparison: ic === "X" ? adjCompFromKey(stemKey) : ic,
        },
      };
    }
    case "NUM":
      if (part.pofs !== "NUM") return null;
      if (!matchesDecn(qual.num.decl, part.num.decl)) return null;
      return {
        pofs: "NUM",
        num: {
          decl: part.num.decl,
          cs: qual.num.cs,
          number: qual.num.number,
          gender: qual.num.gender,
          sort: qual.num.sort,
        },
      };
    case "ADV":
      if (part.pofs !== "ADV") return null;
      if (part.adv.co !== qual.adv.comparison && part.adv.co !== "X" && qual.adv.comparison !== "X")
        return null;
      return {
        pofs: "ADV",
        adv: {
          comparison: qual.adv.comparison === "X" ? advCompFromKey(stemKey) : qual.adv.comparison,
        },
      };
    case "V":
      if (part.pofs !== "V") return null;
      if (!matchesDecn(qual.verb.con, part.v.con)) return null;
      return {
        pofs: "V",
        verb: {
          con: part.v.con,
          tenseVoiceMood: qual.verb.tenseVoiceMood,
          person: qual.verb.person,
          number: qual.verb.number,
        },
      };
    case "VPAR":
      if (part.pofs !== "V") return null;
      if (!matchesDecn(qual.vpar.con, part.v.con)) return null;
      return {
        pofs: "VPAR",
        vpar: {
          con: part.v.con,
          cs: qual.vpar.cs,
          number: qual.vpar.number,
          gender: qual.vpar.gender,
          tenseVoiceMood: qual.vpar.tenseVoiceMood,
        },
      };
    case "SUPINE":
      if (part.pofs !== "V") return null;
      if (!matchesDecn(qual.supine.con, part.v.con)) return null;
      return {
        pofs: "SUPINE",
        supine: {
          con: part.v.con,
          cs: qual.supine.cs,
          number: qual.supine.number,
          gender: qual.supine.gender,
        },
      };
    case "PREP":
      return part.pofs === "PREP" ? qual : null;
    case "CONJ":
      return part.pofs === "CONJ" ? qual : null;
    case "INTERJ":
      return part.pofs === "INTERJ" ? qual : null;
    default:
      /* v8 ignore next */
      return qual;
  }
}

/**
 * Matches declension/conjugation with wildcard support.
 * (0,0) matches everything except which=9.
 * (N,0) matches any variant with the same which.
 */
function matchesDecn(
  inflDecn: { which: number; var: number },
  dictDecn: { which: number; var: number },
): boolean {
  // Exact match
  if (inflDecn.which === dictDecn.which && inflDecn.var === dictDecn.var) {
    return true;
  }
  // (0,0) inflection matches everything except which=9
  if (inflDecn.which === 0 && inflDecn.var === 0 && dictDecn.which !== 9) {
    return true;
  }
  // (N,0) inflection matches any variant
  if (inflDecn.which === dictDecn.which && inflDecn.var === 0) {
    return true;
  }
  // Dictionary (0,0) matches everything except inflection which=9
  if (dictDecn.which === 0 && dictDecn.var === 0 && inflDecn.which !== 9) {
    return true;
  }
  // Dictionary (N,0) matches any variant
  if (dictDecn.which === inflDecn.which && dictDecn.var === 0) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Wildcard resolution — Ada's Reduce_Stem_List
//
// When an inflection record has wildcard values (gender C/X, declension 0),
// resolve them from the dictionary entry. This produces output like
// "N 1 1 NOM S F" (with dictionary gender F) instead of "N 1 1 NOM S C".
// ---------------------------------------------------------------------------

/** Ada's Adj_Comp_From_Key: stem key → adjective comparison level. */
const ADJ_COMP_FROM_KEY: Record<number, Comparison> = {
  0: "POS",
  1: "POS",
  2: "POS",
  3: "COMP",
  4: "SUPER",
};
function adjCompFromKey(key: StemKey): Comparison {
  return ADJ_COMP_FROM_KEY[key] ?? "X";
}

/** Ada's Adv_Comp_From_Key: stem key → adverb comparison level. */
const ADV_COMP_FROM_KEY: Record<number, Comparison> = { 1: "POS", 2: "COMP", 3: "SUPER" };
function advCompFromKey(key: StemKey): Comparison {
  return ADV_COMP_FROM_KEY[key] ?? "X";
}

// ---------------------------------------------------------------------------
// Main word analysis entry point
// ---------------------------------------------------------------------------

/**
 * Analyze a single Latin word: find all possible dictionary entries and
 * their inflections. Expects lowercase input.
 */
export function analyzeWord(
  word: string,
  inflectionIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): ParseResult[] {
  const pairs = runInflections(word, inflectionIndex);
  return searchDictionaries(pairs, dictIndex);
}
