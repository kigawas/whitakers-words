import type { DictionaryEntry } from "../types/dictionary.js";
import type { InflectionRecord } from "../types/inflections.js";
import type { DictionaryIndex } from "./dictionary-index.js";
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

  // 2. Try endings of size 1 to min(MAX_ENDING_SIZE, wordLen-1)
  const maxEnding = Math.min(7, wordLen - 1); // MAX_ENDING_SIZE = 7
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
    const dictStems = lookupStems(dictIndex, pair.stem);
    if (dictStems.length === 0) continue;

    for (const ds of dictStems) {
      const entry = dictIndex.entries[ds.entryIndex];
      if (!entry) continue;

      // Verify POS compatibility: inflection POS must match dictionary POS
      if (!pofsCompatible(pair.ir.qual.pofs, entry.part.pofs)) continue;

      // Verify stem key compatibility
      if (pair.ir.key !== 0 && pair.ir.key !== ds.stemKey) continue;

      // Verify declension/conjugation compatibility
      if (!declCompatible(pair.ir, entry)) continue;

      results.push({
        stem: pair.stem,
        ir: pair.ir,
        de: entry,
        entryIndex: ds.entryIndex,
      });
    }
  }

  return results;
}

/**
 * Check if inflection POS is compatible with dictionary POS.
 * PACK inflections can match PRON dictionary entries.
 */
function pofsCompatible(inflPofs: string, dictPofs: string): boolean {
  if (inflPofs === dictPofs) return true;
  if (inflPofs === "PACK" && dictPofs === "PRON") return true;
  if (inflPofs === "X" || dictPofs === "X") return true;
  return false;
}

/**
 * Check if the declension/conjugation of the inflection is compatible
 * with the dictionary entry.
 */
function declCompatible(ir: InflectionRecord, de: DictionaryEntry): boolean {
  const qual = ir.qual;
  const part = de.part;

  switch (qual.pofs) {
    case "N":
      if (part.pofs !== "N") return false;
      return matchesDecn(qual.noun.decl, part.n.decl);
    case "PRON":
      if (part.pofs !== "PRON") return false;
      return matchesDecn(qual.pron.decl, part.pron.decl);
    case "PACK":
      if (part.pofs === "PRON") return true; // PACK matches any PRON
      if (part.pofs === "PACK") {
        return matchesDecn(qual.pack.decl, part.pack.decl);
      }
      return false;
    case "ADJ":
      if (part.pofs !== "ADJ") return false;
      return matchesDecn(qual.adj.decl, part.adj.decl);
    case "NUM":
      if (part.pofs !== "NUM") return false;
      return matchesDecn(qual.num.decl, part.num.decl);
    case "ADV":
      return part.pofs === "ADV";
    case "V":
      if (part.pofs !== "V") return false;
      return matchesDecn(qual.verb.con, part.v.con);
    case "VPAR":
      if (part.pofs !== "V") return false;
      return matchesDecn(qual.vpar.con, part.v.con);
    case "SUPINE":
      if (part.pofs !== "V") return false;
      return matchesDecn(qual.supine.con, part.v.con);
    case "PREP":
      return part.pofs === "PREP";
    case "CONJ":
      return part.pofs === "CONJ";
    case "INTERJ":
      return part.pofs === "INTERJ";
    default:
      return true;
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
