import type { QualityRecord } from "./inflections.js";

// ---------------------------------------------------------------------------
// Unified quality field extraction.
//
// Extracts the discriminated-union-specific fields from a QualityRecord
// into a flat string array. This eliminates duplicate switch-on-pofs patterns
// in deduplication (list-sweep.ts) and formatting (text-output.ts).
// ---------------------------------------------------------------------------

/**
 * Extracted fields from a QualityRecord — a flat, POS-independent representation.
 * Used by both dedup key generation and output formatting.
 */
export interface QualityValues {
  readonly pofs: string;
  /** Declension/conjugation: [which, var] or empty for POS without it */
  readonly decl: readonly [number, number] | null;
  /** Case, number, gender — for nominal POS types */
  readonly cs: string;
  readonly number: string;
  readonly gender: string;
  /** Comparison — for ADJ/ADV */
  readonly comparison: string;
  /** Tense, voice, mood — for V/VPAR */
  readonly tense: string;
  readonly voice: string;
  readonly mood: string;
  /** Person — for V */
  readonly person: string;
  /** Numeral sort — for NUM */
  readonly sort: string;
}

const EMPTY: QualityValues = {
  pofs: "",
  decl: null,
  cs: "",
  number: "",
  gender: "",
  comparison: "",
  tense: "",
  voice: "",
  mood: "",
  person: "",
  sort: "",
};

/**
 * Extract field values from a QualityRecord into a flat representation.
 * This is the single switch-on-pofs that replaces parallel switches
 * in dedup key generation and formatting.
 */
export function extractQuality(qual: QualityRecord): QualityValues {
  switch (qual.pofs) {
    case "N":
      return {
        ...EMPTY,
        pofs: "N",
        decl: [qual.noun.decl.which, qual.noun.decl.var],
        cs: qual.noun.cs,
        number: qual.noun.number,
        gender: qual.noun.gender,
      };
    case "PRON":
      return {
        ...EMPTY,
        pofs: "PRON",
        decl: [qual.pron.decl.which, qual.pron.decl.var],
        cs: qual.pron.cs,
        number: qual.pron.number,
        gender: qual.pron.gender,
      };
    case "PACK":
      return {
        ...EMPTY,
        pofs: "PACK",
        decl: [qual.pack.decl.which, qual.pack.decl.var],
        cs: qual.pack.cs,
        number: qual.pack.number,
        gender: qual.pack.gender,
      };
    case "ADJ":
      return {
        ...EMPTY,
        pofs: "ADJ",
        decl: [qual.adj.decl.which, qual.adj.decl.var],
        cs: qual.adj.cs,
        number: qual.adj.number,
        gender: qual.adj.gender,
        comparison: qual.adj.comparison,
      };
    case "NUM":
      return {
        ...EMPTY,
        pofs: "NUM",
        decl: [qual.num.decl.which, qual.num.decl.var],
        cs: qual.num.cs,
        number: qual.num.number,
        gender: qual.num.gender,
        sort: qual.num.sort,
      };
    case "ADV":
      return { ...EMPTY, pofs: "ADV", comparison: qual.adv.comparison };
    case "V":
      return {
        ...EMPTY,
        pofs: "V",
        decl: [qual.verb.con.which, qual.verb.con.var],
        tense: qual.verb.tenseVoiceMood.tense,
        voice: qual.verb.tenseVoiceMood.voice,
        mood: qual.verb.tenseVoiceMood.mood,
        person: String(qual.verb.person),
        number: qual.verb.number,
      };
    case "VPAR":
      return {
        ...EMPTY,
        pofs: "VPAR",
        decl: [qual.vpar.con.which, qual.vpar.con.var],
        cs: qual.vpar.cs,
        number: qual.vpar.number,
        gender: qual.vpar.gender,
        tense: qual.vpar.tenseVoiceMood.tense,
        voice: qual.vpar.tenseVoiceMood.voice,
        mood: qual.vpar.tenseVoiceMood.mood,
      };
    case "SUPINE":
      return {
        ...EMPTY,
        pofs: "SUPINE",
        decl: [qual.supine.con.which, qual.supine.con.var],
        cs: qual.supine.cs,
        number: qual.supine.number,
        gender: qual.supine.gender,
      };
    case "PREP":
      return { ...EMPTY, pofs: "PREP", cs: qual.prep.cs };
    case "CONJ":
      return { ...EMPTY, pofs: "CONJ" };
    case "INTERJ":
      return { ...EMPTY, pofs: "INTERJ" };
    default:
      return { ...EMPTY, pofs: qual.pofs };
  }
}

/** Build a dedup key from extracted quality values + entry index. */
export function qualityDedupeKey(idx: number, v: QualityValues): string {
  const parts = [String(idx), v.pofs];
  if (v.cs) parts.push(v.cs);
  if (v.number) parts.push(v.number);
  if (v.gender) parts.push(v.gender);
  if (v.comparison) parts.push(v.comparison);
  if (v.sort) parts.push(v.sort);
  if (v.tense) parts.push(v.tense);
  if (v.voice) parts.push(v.voice);
  if (v.mood) parts.push(v.mood);
  if (v.person) parts.push(v.person);
  return parts.join(":");
}
