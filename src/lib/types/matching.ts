// "Contained in" matching functions — Ada's overridden `<=` operator.
// In Ada, `Left <= Right` means "Left is contained in Right", where
// X (or 0 for numeric types) is the wildcard matching everything.

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
