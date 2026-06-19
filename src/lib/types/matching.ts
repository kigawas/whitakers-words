// "Contained in" matching functions — Ada's overridden `<=` operator.
// In Ada, `Left <= Right` means "Left is contained in Right", where
// X (or 0 for numeric types) is the wildcard matching everything.
//
// Two tiers live here:
//   - matchesX(left, right): the directional `<=` primitives (left ⊑ right).
//   - xCompatible(a, b): symmetric helpers (a ⊑ b OR b ⊑ a), for fields where
//     the wildcard can sit on either side — e.g. an inflection and a dictionary
//     entry that may BOTH carry a wildcard declension or comparison. These are
//     defined in terms of the primitives, so the `<=` model stays the source.
//
// This module is the single home for that wildcard matching. Several primitives
// (matchesPofs, matchesCase, matchesNumber, matchesPerson, matchesTVM,
// matchesStemKey, matchesAge, matchesFrequency) currently have no caller: the
// engine enumerates every inflection rather than filtering a parse against a
// requested spec, so it never matches those fields. They are kept as a faithful
// 1:1 mirror of Ada's `<=` operators (and for that future filtering use).

import type {
  Age,
  Case,
  Comparison,
  Frequency,
  Gender,
  GrammaticalNumber,
  PartOfSpeech,
  Person,
  StemKey,
} from "./enums.js";
import type { DecnRecord, TenseVoiceMoodRecord } from "./inflections.js";

/** X on Right matches everything. Pack on Left matches Pron on Right. */
export function matchesPofs(left: PartOfSpeech, right: PartOfSpeech): boolean {
  return right === left || (left === "PACK" && right === "PRON") || right === "X";
}

/** (0,0) matches everything except Which=9. (Which,0) matches any variant of same Which. */
export function matchesDecn(left: DecnRecord, right: DecnRecord): boolean {
  return (
    (right.which === left.which && right.var === left.var) ||
    (right.which === 0 && right.var === 0 && left.which !== 9) ||
    (right.which === left.which && right.var === 0)
  );
}

/**
 * Symmetric declension match: the wildcard may sit on either side. Inflection
 * records routinely carry a wildcard variant (e.g. `1 0`) and dictionary
 * entries can too (e.g. the `0 0` comparatives), so a compatible pair is one
 * where either is contained in the other.
 */
export function decnsCompatible(a: DecnRecord, b: DecnRecord): boolean {
  return matchesDecn(a, b) || matchesDecn(b, a);
}

/** X on Right matches everything. C on Right matches M and F on Left. */
export function matchesGender(left: Gender, right: Gender): boolean {
  return right === left || right === "X" || (right === "C" && (left === "M" || left === "F"));
}

/** X on Right matches everything. */
export function matchesCase(left: Case, right: Case): boolean {
  return right === left || right === "X";
}

/** X on Right matches everything. */
export function matchesNumber(left: GrammaticalNumber, right: GrammaticalNumber): boolean {
  return right === left || right === "X";
}

/** 0 on Right matches everything. */
export function matchesPerson(left: Person, right: Person): boolean {
  return right === left || right === 0;
}

/** X on Right matches everything. */
export function matchesComparison(left: Comparison, right: Comparison): boolean {
  return right === left || right === "X";
}

/**
 * Symmetric comparison match: the `X` (unspecified degree) wildcard may sit on
 * either side — an inflection ending or a dictionary entry can each leave the
 * comparison unspecified — so a compatible pair is one where either contains
 * the other.
 */
export function comparisonsCompatible(a: Comparison, b: Comparison): boolean {
  return matchesComparison(a, b) || matchesComparison(b, a);
}

/** X on Right matches everything (per field). */
export function matchesTVM(left: TenseVoiceMoodRecord, right: TenseVoiceMoodRecord): boolean {
  return (
    (right.tense === left.tense || right.tense === "X") &&
    (right.voice === left.voice || right.voice === "X") &&
    (right.mood === left.mood || right.mood === "X")
  );
}

/** 0 on Right matches everything. Only works for 2-stem parts, not verbs. */
export function matchesStemKey(left: StemKey, right: StemKey): boolean {
  return right === left || right === 0;
}

/** X on Right matches everything. */
export function matchesAge(left: Age, right: Age): boolean {
  return right === left || right === "X";
}

/** X on Right matches everything. */
export function matchesFrequency(left: Frequency, right: Frequency): boolean {
  return right === left || right === "X";
}
