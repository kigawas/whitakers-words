import type { AddonsData, PrefixItem, SuffixItem, TackonItem } from "../types/addons.js";
import type { DictionaryIndex } from "./dictionary-index.js";
import { lookupStems } from "./dictionary-index.js";
import type { InflectionIndex } from "./inflection-index.js";
import { listSweep } from "./list-sweep.js";
import type { SuffixTrieNode } from "./suffix-trie.js";
import { findMatchingSuffixes } from "./suffix-trie.js";
import type { ParseResult } from "./word-analysis.js";
import { analyzeWord, runInflections } from "./word-analysis.js";

// ---------------------------------------------------------------------------
// Addon stripping — try removing tackons, prefixes, suffixes from a word
// that didn't parse directly, then re-analyze the remainder.
// ---------------------------------------------------------------------------

export type AddonResult =
  | {
      readonly type: "tackon";
      readonly addon: TackonItem;
      readonly baseResults: readonly ParseResult[];
    }
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
 * Try stripping tackons (enclitics) from the end of a word.
 * E.g., "aquamque" → strip "que" → analyze "aquam"
 */
export function tryTackons(
  word: string,
  tackons: readonly TackonItem[],
  packons: readonly TackonItem[],
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): AddonResult[] {
  const results: AddonResult[] = [];
  // Cache base-word analysis results to avoid redundant work.
  const baseCache = new Map<string, ParseResult[]>();

  function getBase(base: string): ParseResult[] {
    let r = baseCache.get(base);
    if (r === undefined) {
      r = analyzeWord(base, inflIndex, dictIndex);
      baseCache.set(base, r);
    }
    return r;
  }

  // Packons — only match PRON/PACK base words.
  for (const packon of packons) {
    const tack = packon.word.toLowerCase();
    if (word.length > tack.length && word.endsWith(tack)) {
      const base = word.slice(0, word.length - tack.length);
      const baseResults = getBase(base).filter(
        (r) => r.ir.qual.pofs === "PACK" || r.ir.qual.pofs === "PRON",
      );
      if (baseResults.length > 0) {
        results.push({ type: "tackon", addon: packon, baseResults: listSweep(baseResults) });
      }
    }
  }

  // Regular tackons — filter base results by tackon's base POS when specified.
  for (const tackon of tackons) {
    const tack = tackon.word.toLowerCase();
    if (word.length > tack.length && word.endsWith(tack)) {
      const base = word.slice(0, word.length - tack.length);
      let baseResults = getBase(base);
      // Filter by tackon's base POS when it's not X (any)
      if (tackon.base.pofs !== "X") {
        baseResults = baseResults.filter((r) => r.ir.qual.pofs === tackon.base.pofs);
      }
      if (baseResults.length > 0) {
        results.push({ type: "tackon", addon: tackon, baseResults: listSweep(baseResults) });
      }
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
        // Emit one result per inflection pair whose POS matches the suffix's
        // target POS.
        const targetPofs = suffix.entr.target.pofs;
        const targetKey = suffix.entr.targetKey;
        for (const pair of stemPairs) {
          if (targetPofs !== "X" && pair.ir.qual.pofs !== targetPofs) continue;
          if (targetKey !== 0 && pair.ir.key !== targetKey) continue;
          baseResults.push({ stem: pair.stem, ir: pair.ir, de: entry, entryIndex: ds.entryIndex });
        }
      }
      if (baseResults.length > 0) {
        results.push({ type: "suffix", addon: suffix, baseResults: listSweep(baseResults) });
      }
    }
  }

  return results;
}

/**
 * Try all addons on a word that didn't parse directly.
 * Order: tackons first, then prefixes, then suffixes.
 */
export function tryAddons(
  word: string,
  addons: AddonsData,
  suffixTrie: SuffixTrieNode,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): AddonResult[] {
  const results: AddonResult[] = [];

  // Tackons (enclitics) — most common, try first
  results.push(...tryTackons(word, addons.tackons, addons.packons, inflIndex, dictIndex));

  // Prefixes (including tickons)
  results.push(...tryPrefixes(word, [...addons.prefixes, ...addons.tickons], inflIndex, dictIndex));

  // Suffixes
  results.push(...trySuffixes(word, suffixTrie, inflIndex, dictIndex));

  return results;
}
