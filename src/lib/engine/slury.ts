// ---------------------------------------------------------------------------
// Slury — prefix assimilation and related transformations
//
// Ada's TRY_SLURY handles:
// 1. TC_Slur: bidirectional prefix assimilation (ad↔a~, in↔i~, ob↔o~, sub↔su~)
// 2. TC_Flip: one-direction prefix replacement
// 3. TC_Flip_Flop: bidirectional prefix replacement
//
// Runs alongside standard results (not a fallback).
// ---------------------------------------------------------------------------

import type { DictionaryIndex } from "./dictionary-index.js";
import type { InflectionIndex } from "./inflection-index.js";
import { listSweep } from "./list-sweep.js";
import { analyzeWord, type ParseResult } from "./word-analysis.js";

export interface SluryResult {
  /** Short annotation, e.g. "Slur ad/a~" */
  readonly label: string;
  /** Long annotation, e.g. "An initial 'ad' may be rendered by a~" */
  readonly explanation: string;
  /** Parse results for the transformed form */
  readonly results: readonly ParseResult[];
}

// ---------------------------------------------------------------------------
// Slury trick table — mirrors Ada's *_Slur_Tricks tables
// ---------------------------------------------------------------------------

type SluryOp =
  | { type: "slur"; prefix: string }
  | { type: "flip"; old: string; new: string }
  | { type: "flip_flop"; x1: string; x2: string };

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

// Ada's A_Slur_Tricks
const A_SLUR: SluryOp[] = [
  { type: "flip_flop", x1: "abs", x2: "aps" },
  { type: "flip_flop", x1: "acq", x2: "adq" },
  { type: "flip_flop", x1: "ante", x2: "anti" },
  { type: "flip_flop", x1: "auri", x2: "aure" },
  { type: "flip_flop", x1: "auri", x2: "auru" },
  { type: "slur", prefix: "ad" },
];

// Ada's C_Slur_Tricks
const C_SLUR: SluryOp[] = [
  { type: "flip", old: "circum", new: "circun" },
  { type: "flip_flop", x1: "con", x2: "com" },
  { type: "flip", old: "co", new: "com" },
  { type: "flip", old: "co", new: "con" },
  { type: "flip_flop", x1: "conl", x2: "coll" },
];

// Ada's I_Slur_Tricks
const I_SLUR: SluryOp[] = [
  { type: "slur", prefix: "in" },
  { type: "flip_flop", x1: "inb", x2: "imb" },
  { type: "flip_flop", x1: "inp", x2: "imp" },
];

// Ada's N_Slur_Tricks
const N_SLUR: SluryOp[] = [{ type: "flip", old: "nun", new: "non" }];

// Ada's O_Slur_Tricks
const O_SLUR: SluryOp[] = [{ type: "slur", prefix: "ob" }];

// Ada's Q_Slur_Tricks
const Q_SLUR: SluryOp[] = [{ type: "flip_flop", x1: "quadri", x2: "quadru" }];

// Ada's S_Slur_Tricks
const S_SLUR: SluryOp[] = [
  { type: "flip", old: "se", new: "ce" },
  { type: "slur", prefix: "sub" },
];

const SLUR_TABLE: Record<string, SluryOp[]> = {
  a: A_SLUR,
  c: C_SLUR,
  i: I_SLUR,
  n: N_SLUR,
  o: O_SLUR,
  q: Q_SLUR,
  s: S_SLUR,
};

// ---------------------------------------------------------------------------
// Core slury logic
// ---------------------------------------------------------------------------

function tword(
  word: string,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): ParseResult[] {
  const results = analyzeWord(word, inflIndex, dictIndex);
  return results.length > 0 ? listSweep(results) : [];
}

/**
 * Ada's Slur procedure — bidirectional prefix assimilation.
 * Direction 1: prefix + consonant → vowel + doubled consonant
 *   "adtingo" → "attingo" (ad + t → a + tt)
 * Direction 2: vowel + doubled consonant → prefix + consonant
 *   "ammoveo" → "admoveo" (a + mm → ad + m)
 */
function trySlurOp(
  word: string,
  prefix: string,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): SluryResult | null {
  const pl = prefix.length;
  const vowelPart = prefix.slice(0, pl - 1); // e.g., "a" for "ad", "su" for "sub"

  // Direction 1: word starts with prefix + consonant → try vowel + doubled consonant
  if (word.length >= pl + 2 && word.startsWith(prefix)) {
    const c = word[pl];
    if (c && !VOWELS.has(c)) {
      const transformed = vowelPart + c + word.slice(pl);
      const results = tword(transformed, inflIndex, dictIndex);
      if (results.length > 0) {
        return {
          label: `Slur ${prefix}/${vowelPart}~`,
          explanation: `An initial '${prefix}' may be rendered by ${vowelPart}~`,
          results,
        };
      }
    }
  }

  // Direction 2: word starts with vowel part + doubled consonant → try prefix + consonant
  if (
    word.length >= pl + 2 &&
    word.startsWith(vowelPart) &&
    word[pl - 1] === word[pl] &&
    word[pl] !== undefined &&
    !VOWELS.has(word[pl])
  ) {
    const transformed = prefix + word.slice(pl);
    const results = tword(transformed, inflIndex, dictIndex);
    if (results.length > 0) {
      return {
        label: `Slur ${vowelPart}~/${prefix}`,
        explanation: `An initial '${vowelPart}~' may be rendered by ${prefix}`,
        results,
      };
    }
  }

  return null;
}

/**
 * Ada's Flip procedure — one-direction replacement at word start.
 */
function tryFlipOp(
  word: string,
  old: string,
  replacement: string,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): SluryResult | null {
  if (word.length >= old.length + 2 && word.startsWith(old)) {
    const transformed = replacement + word.slice(old.length);
    const results = tword(transformed, inflIndex, dictIndex);
    if (results.length > 0) {
      return {
        label: `Word mod ${old}/${replacement}`,
        explanation: `An initial '${old}' may be rendered by '${replacement}'`,
        results,
      };
    }
  }
  return null;
}

/**
 * Ada's Flip_Flop procedure — bidirectional replacement at word start.
 */
function tryFlipFlopOp(
  word: string,
  x1: string,
  x2: string,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): SluryResult | null {
  // x1 → x2
  if (word.length >= x1.length + 2 && word.startsWith(x1)) {
    const transformed = x2 + word.slice(x1.length);
    const results = tword(transformed, inflIndex, dictIndex);
    if (results.length > 0) {
      return {
        label: `Word mod ${x1}/${x2}`,
        explanation: `An initial '${x1}' may be rendered by '${x2}'`,
        results,
      };
    }
  }
  // x2 → x1
  if (word.length >= x2.length + 2 && word.startsWith(x2)) {
    const transformed = x1 + word.slice(x2.length);
    const results = tword(transformed, inflIndex, dictIndex);
    if (results.length > 0) {
      return {
        label: `Word mod ${x2}/${x1}`,
        explanation: `An initial '${x2}' may be rendered by '${x1}'`,
        results,
      };
    }
  }
  return null;
}

/**
 * Try all slury transformations on a word. Returns the first match.
 * Ada only checks first-letter-specific tables.
 */
export function trySlury(
  word: string,
  inflIndex: InflectionIndex,
  dictIndex: DictionaryIndex,
): SluryResult | null {
  if (word.length < 4) return null;

  const firstChar = word[0];
  if (!firstChar) return null;
  const ops = SLUR_TABLE[firstChar];
  if (!ops) return null;

  for (const op of ops) {
    let result: SluryResult | null = null;
    switch (op.type) {
      case "slur":
        result = trySlurOp(word, op.prefix, inflIndex, dictIndex);
        break;
      case "flip":
        result = tryFlipOp(word, op.old, op.new, inflIndex, dictIndex);
        break;
      case "flip_flop":
        result = tryFlipFlopOp(word, op.x1, op.x2, inflIndex, dictIndex);
        break;
    }
    if (result) return result;
  }

  return null;
}
