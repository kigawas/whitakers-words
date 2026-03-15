import type {
  Age,
  Case,
  Comparison,
  Frequency,
  Gender,
  GrammaticalNumber,
  Mood,
  NumeralSort,
  Person,
  StemKey,
  Tense,
  Variant,
  Voice,
  Which,
} from "./enums.js";

// ---------------------------------------------------------------------------
// Composite records
// ---------------------------------------------------------------------------

export interface DecnRecord {
  readonly which: Which;
  readonly var: Variant;
}

export interface TenseVoiceMoodRecord {
  readonly tense: Tense;
  readonly voice: Voice;
  readonly mood: Mood;
}

export interface EndingRecord {
  readonly size: number; // 0..7
  readonly suf: string; // up to 7 chars
}

// ---------------------------------------------------------------------------
// Part-of-speech-specific inflection records
// ---------------------------------------------------------------------------

export interface NounRecord {
  readonly decl: DecnRecord;
  readonly cs: Case;
  readonly number: GrammaticalNumber;
  readonly gender: Gender;
}

export interface PronounRecord {
  readonly decl: DecnRecord;
  readonly cs: Case;
  readonly number: GrammaticalNumber;
  readonly gender: Gender;
}

export interface PropackRecord {
  readonly decl: DecnRecord;
  readonly cs: Case;
  readonly number: GrammaticalNumber;
  readonly gender: Gender;
}

export interface AdjectiveRecord {
  readonly decl: DecnRecord;
  readonly cs: Case;
  readonly number: GrammaticalNumber;
  readonly gender: Gender;
  readonly comparison: Comparison;
}

export interface NumeralRecord {
  readonly decl: DecnRecord;
  readonly cs: Case;
  readonly number: GrammaticalNumber;
  readonly gender: Gender;
  readonly sort: NumeralSort;
}

export interface AdverbRecord {
  readonly comparison: Comparison;
}

export interface VerbRecord {
  readonly con: DecnRecord;
  readonly tenseVoiceMood: TenseVoiceMoodRecord;
  readonly person: Person;
  readonly number: GrammaticalNumber;
}

export interface VparRecord {
  readonly con: DecnRecord;
  readonly cs: Case;
  readonly number: GrammaticalNumber;
  readonly gender: Gender;
  readonly tenseVoiceMood: TenseVoiceMoodRecord;
}

export interface SupineRecord {
  readonly con: DecnRecord;
  readonly cs: Case;
  readonly number: GrammaticalNumber;
  readonly gender: Gender;
}

export interface PrepositionRecord {
  readonly cs: Case;
}

// ---------------------------------------------------------------------------
// Quality record — discriminated union on pofs
// ---------------------------------------------------------------------------

export type QualityRecord =
  | { readonly pofs: "N"; readonly noun: NounRecord }
  | { readonly pofs: "PRON"; readonly pron: PronounRecord }
  | { readonly pofs: "PACK"; readonly pack: PropackRecord }
  | { readonly pofs: "ADJ"; readonly adj: AdjectiveRecord }
  | { readonly pofs: "NUM"; readonly num: NumeralRecord }
  | { readonly pofs: "ADV"; readonly adv: AdverbRecord }
  | { readonly pofs: "V"; readonly verb: VerbRecord }
  | { readonly pofs: "VPAR"; readonly vpar: VparRecord }
  | { readonly pofs: "SUPINE"; readonly supine: SupineRecord }
  | { readonly pofs: "PREP"; readonly prep: PrepositionRecord }
  | { readonly pofs: "CONJ" }
  | { readonly pofs: "INTERJ" }
  | { readonly pofs: "TACKON" }
  | { readonly pofs: "PREFIX" }
  | { readonly pofs: "SUFFIX" }
  | { readonly pofs: "X" };

// ---------------------------------------------------------------------------
// Inflection record
// ---------------------------------------------------------------------------

export interface InflectionRecord {
  readonly qual: QualityRecord;
  readonly key: StemKey;
  readonly ending: EndingRecord;
  readonly age: Age;
  readonly freq: Frequency;
}

// ---------------------------------------------------------------------------
// Null / default constants
// ---------------------------------------------------------------------------

export const NULL_ENDING: EndingRecord = { size: 0, suf: "" } as const;
export const NULL_QUALITY: QualityRecord = { pofs: "X" } as const;

export const NULL_INFLECTION: InflectionRecord = {
  qual: NULL_QUALITY,
  key: 0,
  ending: NULL_ENDING,
  age: "X",
  freq: "X",
} as const;

// ---------------------------------------------------------------------------
// Exhaustiveness helper
// ---------------------------------------------------------------------------

export function assertNever(x: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(x)}`);
}
