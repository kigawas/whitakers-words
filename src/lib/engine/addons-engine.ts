import type { UniqueEntry } from "../parsers/uniques.js";
import { equStr } from "../support/latin-string.js";
import type { PrefixItem, SuffixItem, TackonItem } from "../types/addons.js";
import type { QualityRecord } from "../types/inflections.js";
import { matchesDecn } from "../types/matching.js";
import type { DictionaryIndex } from "./dictionary-index.js";
import { lookupStems } from "./dictionary-index.js";
import type { InflectionIndex } from "./inflection-index.js";
import { listSweep } from "./list-sweep.js";
import type { SuffixTrieNode } from "./suffix-trie.js";
import { findMatchingSuffixes } from "./suffix-trie.js";
import type { ParseResult } from "./word-analysis.js";
import { analyzeWord, isIdemReading, matchAndResolve, runInflections } from "./word-analysis.js";

// ---------------------------------------------------------------------------
// Addon stripping — try removing tackons, prefixes, suffixes from a word
// that didn't parse directly, then re-analyze the remainder.
// ---------------------------------------------------------------------------

/** A tackon or packon reading: the addon, then the readings of its base. */
export interface TackonResult {
  readonly type: "tackon";
  readonly addon: TackonItem;
  readonly baseResults: readonly ParseResult[];
  /** Unique readings of the base: "cetteque" = cette + -que. */
  readonly baseUniques?: readonly UniqueEntry[];
  /**
   * Packon and tackon readings of the base: "quocumque" = quo + cum + -que,
   * "huiusmodique" = huius + modi + -que.
   */
  readonly baseAddons?: readonly TackonResult[];
}

export type AddonResult =
  | TackonResult
  | {
      readonly type: "prefix";
      readonly addon: PrefixItem;
      readonly baseResults: readonly ParseResult[];
    }
  | {
      readonly type: "suffix";
      readonly addon: SuffixItem;
      readonly baseResults: readonly ParseResult[];
    };

/**
 * The word without the tackon at its end, or undefined if it does not end in
 * it. Like Ada's Subtract_Tackon, u/v and i/j are alike: "quiuis" ends in "vis".
 */
function subtractTackon(word: string, tack: string): string | undefined {
  if (word.length <= tack.length) return undefined;
  const base = word.slice(0, word.length - tack.length);
  return equStr(word.slice(base.length), tack) ? base : undefined;
}

/**
 * Packon readings of a word: Ada reads a qu-/cu- word as a qu- pronoun plus
 * packon ("quidam" = qui + dam) whenever it is not a plain qu- pronoun,
 * alongside any other readings ("quiddam" is also an indeclinable noun).
 */
export function quPackons(
  word: string,
  results: readonly ParseResult[],
  packons: readonly TackonItem[],
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): TackonResult[] {
  const isQuPronoun = (r: ParseResult) =>
    r.de.part.pofs === "PRON" && r.de.part.pron.decl.which === 1;
  if (!/^(qu|cu)/.test(word) || results.some(isQuPronoun)) return [];
  return tryPackons(word, packons, inflIndex, dictIndex);
}

/**
 * Try packons on a qu-/cu- word, as Ada's Process_Packons does: strip the
 * packon, split what is left into a qu-/cu- stem and a PRON ending, and attach
 * it to the PACK entry whose meaning names that packon ("(w/-dam) certain").
 * E.g., "quendam" → strip "dam", n back to m → "quem" → qu.em under qu PACK.
 */
export function tryPackons(
  word: string,
  packons: readonly TackonItem[],
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): TackonResult[] {
  const results: TackonResult[] = [];
  for (const packon of packons) {
    const tack = packon.word.toLowerCase();
    let base = subtractTackon(word, tack);
    if (base === undefined) continue;
    // Ada: "Takes care of the m -> n shift with dam" (quendam, quorundam).
    if (tack.startsWith("dam") && base.endsWith("n")) base = `${base.slice(0, -1)}m`;

    const baseResults: ParseResult[] = [];
    for (const pair of runInflections(base, inflIndex)) {
      const qual = pair.ir.qual;
      if (qual.pofs !== "PRON" || packon.base.pofs !== "PACK") continue;
      if (!matchesDecn(qual.pron.decl, packon.base.pack.decl)) continue;
      for (const ds of lookupStems(dictIndex, pair.stem)) {
        const entry = dictIndex.entries[ds.entryIndex];
        if (entry?.part.pofs !== "PACK" || !entry.mean.startsWith(`(w/-${tack}`)) continue;
        // Same variant only, as for the qu- pronouns. Unlike Ada, also keep the
        // stem key: "cu" takes only the cu- endings, so cui is DAT S, not NOM P.
        const decl = entry.part.pack.decl;
        if (decl.which !== qual.pron.decl.which || decl.var !== qual.pron.decl.var) continue;
        if (pair.ir.key !== 0 && pair.ir.key !== ds.stemKey) continue;
        baseResults.push({ stem: pair.stem, ir: pair.ir, de: entry, entryIndex: ds.entryIndex });
      }
    }
    if (baseResults.length > 0) {
      results.push({ type: "tackon", addon: packon, baseResults: listSweep(baseResults) });
    }
  }
  return results;
}

/**
 * A word as Ada's Word reads it (words_engine-word_package.adb), which is how
 * a tackon's base is read too: its dictionary readings, uniques and packons,
 * or when none of those parse, its tackon readings. Results are unswept, and
 * still include idem.
 */
export interface WordReading {
  readonly results: readonly ParseResult[];
  readonly uniques: readonly UniqueEntry[];
  readonly addons: readonly TackonResult[];
}

/**
 * The four tackons Ada tries in its Enclitic, after Word, on any base reading;
 * Word itself tries the others, in Try_Tackons.
 */
export function isEnclitic(tackon: TackonItem): boolean {
  return ["que", "ne", "ve", "est"].includes(tackon.word);
}

/**
 * Whether a base reading fits the tackon, as Ada's Try_Tackons sweeps them
 * (words_engine-word_package.adb:1645): a base of X takes anything, N and PRON
 * must match the declension too, and ADJ (-cumque) only the part of speech.
 */
function fitsTackonBase(qual: QualityRecord, tackon: TackonItem): boolean {
  const base = tackon.base;
  if (base.pofs === "X" || isEnclitic(tackon)) return true;
  if (qual.pofs === "N" && base.pofs === "N") return matchesDecn(qual.noun.decl, base.n.decl);
  if (qual.pofs === "PRON" && base.pofs === "PRON") {
    return matchesDecn(qual.pron.decl, base.pron.decl);
  }
  return qual.pofs === "ADJ" && base.pofs === "ADJ";
}

/**
 * A word's readings with its addons' readings spliced in and the addons gone,
 * as Ada's Try_Tackons sweeps a base: an inner tackon's own line never has the
 * part of speech the tackon wants, but the readings under it may.
 */
function sweep(reading: WordReading): WordReading {
  const results = [...reading.results];
  const uniques = [...reading.uniques];
  for (const addon of reading.addons) {
    const inner = sweep({
      results: addon.baseResults,
      uniques: addon.baseUniques ?? [],
      addons: addon.baseAddons ?? [],
    });
    results.push(...inner.results);
    uniques.push(...inner.uniques);
  }
  return { results, uniques, addons: [] };
}

/**
 * Try stripping tackons from the end of a word: "aquamque" → aquam + -que.
 * As in Ada, readWord reads the base as a whole word, so it may be a unique, a
 * packon or a tackon reading itself: "cetteque" → cette + -que, "quocumque" →
 * quo + cum + -que, "huiusmodique" → huius + modi + -que.
 */
export function tryTackons(
  word: string,
  tackons: readonly TackonItem[],
  readWord: (word: string) => WordReading,
): TackonResult[] {
  const results: TackonResult[] = [];
  // Tackons with the same word (-pte, -modi) share a base
  const bases = new Map<string, WordReading>();

  for (const tackon of tackons) {
    const base = subtractTackon(word, tackon.word.toLowerCase());
    if (base === undefined) continue;
    let reading = bases.get(base);
    if (reading === undefined) {
      reading = readWord(base);
      bases.set(base, reading);
    }
    // As on its own, the base has no idem reading, except before -dem. Only its
    // own readings: idem that came through an inner -dem stays ("idempte").
    const own =
      tackon.word === "dem"
        ? reading
        : { ...reading, results: reading.results.filter((r) => !isIdemReading(r)) };
    // Ada's Enclitic keeps the base as Word reads it; Try_Tackons sweeps it
    // ("huiuscemodi" = huius + modi, without -ce's line)
    const swept = isEnclitic(tackon) ? own : sweep(own);
    const fits = (qual: QualityRecord) => fitsTackonBase(qual, tackon);
    const baseResults = swept.results.filter((r) => fits(r.ir.qual));
    const baseUniques = swept.uniques.filter((u) => fits(u.qual));
    const baseAddons = swept.addons;
    if (baseResults.length > 0 || baseUniques.length > 0 || baseAddons.length > 0) {
      results.push({
        type: "tackon",
        addon: tackon,
        baseResults: listSweep(baseResults),
        baseUniques,
        baseAddons,
      });
    }
  }
  return results;
}

/**
 * Try stripping prefixes from the beginning of a word.
 * E.g., "antecedo" → strip "ante" → analyze "cedo"
 * Handles connect characters: "accedo" → prefix "ad" with connect "c" → strip "ac" → analyze "cedo"
 */
export function tryPrefixes(
  word: string,
  prefixes: readonly PrefixItem[],
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): AddonResult[] {
  const results: AddonResult[] = [];
  for (const prefix of prefixes) {
    const fix = prefix.fix.toLowerCase();
    if (word.length <= fix.length) continue;

    if (word.startsWith(fix)) {
      const rest = word.slice(fix.length);
      // Check connect character
      if (prefix.connect && prefix.connect !== " " && prefix.connect.length > 0) {
        if (rest.length > 0 && rest.charAt(0) === prefix.connect.toLowerCase()) {
          const baseResults = analyzeWord(rest, inflIndex, dictIndex);
          if (baseResults.length > 0) {
            results.push({ type: "prefix", addon: prefix, baseResults: listSweep(baseResults) });
          }
        }
      } else {
        const baseResults = analyzeWord(rest, inflIndex, dictIndex);
        if (baseResults.length > 0) {
          results.push({ type: "prefix", addon: prefix, baseResults: listSweep(baseResults) });
        }
      }
    }
  }
  return results;
}

/**
 * Try stripping suffixes from inflection-derived stems and re-analyzing.
 *
 * Unlike tackons/prefixes (which attach to the whole word), suffixes attach to
 * the STEM portion of a word. So we first split the word into stem+ending pairs
 * via runInflections, then try stripping each suffix from each stem.
 *
 * Uses a reversed-character trie for O(max_suffix_length) matching per stem
 * instead of O(suffixes) per stem.
 *
 * E.g., "ludica" → runInflections produces stem "ludic" + ending "a"
 *        → trie finds suffix "ic" at end of "ludic" → stripped stem "lud"
 *        → lookupStems("lud") finds "ludus" (N 2nd)
 */
export function trySuffixes(
  word: string,
  suffixTrie: SuffixTrieNode,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): AddonResult[] {
  const results: AddonResult[] = [];

  // Get all stem+ending pairs from inflection splitting.
  // Group pairs by stem so we can try each unique stem against suffixes,
  // then emit one ParseResult per inflection pair per dictionary match.
  const pairs = runInflections(word, inflIndex);
  const pairsByStem = new Map<string, typeof pairs>();
  for (const p of pairs) {
    let bucket = pairsByStem.get(p.stem);
    if (!bucket) {
      bucket = [];
      pairsByStem.set(p.stem, bucket);
    }
    bucket.push(p);
  }

  for (const [stem, stemPairs] of pairsByStem) {
    // Use trie to find all matching suffixes in O(max_suffix_length)
    const matches = findMatchingSuffixes(suffixTrie, stem);

    for (const { suffix, strippedStem } of matches) {
      // Check connect character
      if (suffix.connect && suffix.connect !== " " && suffix.connect.length > 0) {
        if (strippedStem.charAt(strippedStem.length - 1) !== suffix.connect.toLowerCase()) {
          continue;
        }
      }

      // The derived word inflects as the suffix's target, so the target acts
      // as a synthesized part-entry: run each inflection pair through the same
      // matcher the dictionary search uses. This enforces the target's POS,
      // stem key, and declension (e.g. the "ic" suffix forms an ADJ 1 1, so a
      // stray ADJ 3 6 "a" ending can't slip through as an accusative singular)
      // and resolves the inflection's wildcards against the target.
      const target = suffix.entr.target;
      const targetKey = suffix.entr.targetKey;

      // Look up the stripped stem directly in the dictionary.
      const dictStems = lookupStems(dictIndex, strippedStem);
      const baseResults: ParseResult[] = [];
      for (const ds of dictStems) {
        const entry = dictIndex.entries[ds.entryIndex];
        if (!entry) continue;
        // Filter by root POS
        if (suffix.entr.root !== "X" && entry.part.pofs !== suffix.entr.root) continue;
        // Filter by root key (0 = match any)
        if (suffix.entr.rootKey !== 0 && suffix.entr.rootKey !== ds.stemKey) continue;
        // Emit one result per inflection pair compatible with the target.
        for (const pair of stemPairs) {
          const resolvedIr = matchAndResolve(pair.ir, target, targetKey);
          if (!resolvedIr) continue;
          baseResults.push({
            stem: pair.stem,
            ir: resolvedIr,
            de: entry,
            entryIndex: ds.entryIndex,
          });
        }
      }
      if (baseResults.length > 0) {
        results.push({ type: "suffix", addon: suffix, baseResults: listSweep(baseResults) });
      }
    }
  }

  return results;
}
