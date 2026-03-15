import type { AddonsData, PrefixItem, SuffixItem, TackonItem } from "../types/addons.js";
import type { DictionaryIndex } from "./dictionary-index.js";
import type { InflectionIndex } from "./inflection-index.js";
import type { ParseResult } from "./word-analysis.js";
import { analyzeWord } from "./word-analysis.js";

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
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): AddonResult[] {
  const results: AddonResult[] = [];
  for (const tackon of tackons) {
    const tack = tackon.word.toLowerCase();
    if (word.length > tack.length && word.endsWith(tack)) {
      const base = word.slice(0, word.length - tack.length);
      const baseResults = analyzeWord(base, inflIndex, dictIndex);
      if (baseResults.length > 0) {
        results.push({ type: "tackon", addon: tackon, baseResults });
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
          // Connect matches — analyze the rest (keeping the connect char)
          const baseResults = analyzeWord(rest, inflIndex, dictIndex);
          if (baseResults.length > 0) {
            results.push({ type: "prefix", addon: prefix, baseResults });
          }
        }
      } else {
        const baseResults = analyzeWord(rest, inflIndex, dictIndex);
        if (baseResults.length > 0) {
          results.push({ type: "prefix", addon: prefix, baseResults });
        }
      }
    }
  }
  return results;
}

/**
 * Try stripping suffixes from the end of a word and re-analyzing.
 * E.g., "ludica" → strip suffix "ic" → analyze "lud" with target POS ADJ
 */
export function trySuffixes(
  word: string,
  suffixes: readonly SuffixItem[],
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): AddonResult[] {
  const results: AddonResult[] = [];
  for (const suffix of suffixes) {
    const fix = suffix.fix.toLowerCase();
    if (word.length <= fix.length) continue;

    if (word.endsWith(fix)) {
      const rest = word.slice(0, word.length - fix.length);
      if (rest.length === 0) continue;

      // Check connect character
      if (suffix.connect && suffix.connect !== " " && suffix.connect.length > 0) {
        if (rest.charAt(rest.length - 1) === suffix.connect.toLowerCase()) {
          const baseResults = analyzeWord(rest, inflIndex, dictIndex);
          // Filter: base word POS must match suffix root POS
          const filtered = baseResults.filter(
            (r) => suffix.entr.root === "X" || r.de.part.pofs === suffix.entr.root,
          );
          if (filtered.length > 0) {
            results.push({ type: "suffix", addon: suffix, baseResults: filtered });
          }
        }
      } else {
        const baseResults = analyzeWord(rest, inflIndex, dictIndex);
        const filtered = baseResults.filter(
          (r) => suffix.entr.root === "X" || r.de.part.pofs === suffix.entr.root,
        );
        if (filtered.length > 0) {
          results.push({ type: "suffix", addon: suffix, baseResults: filtered });
        }
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
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): AddonResult[] {
  const results: AddonResult[] = [];

  // Tackons (enclitics) — most common, try first
  results.push(...tryTackons(word, [...addons.tackons, ...addons.packons], inflIndex, dictIndex));

  // Prefixes (including tickons)
  results.push(...tryPrefixes(word, [...addons.prefixes, ...addons.tickons], inflIndex, dictIndex));

  // Suffixes
  results.push(...trySuffixes(word, addons.suffixes, inflIndex, dictIndex));

  return results;
}
