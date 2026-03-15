import type {
  Age,
  Area,
  Case,
  Comparison,
  Frequency,
  Gender,
  Geo,
  NounKind,
  NumeralSort,
  NumeralValue,
  PartOfSpeech,
  PronounKind,
  Source,
  StemKey,
  VerbKind,
} from "./enums.js";
import type { DecnRecord } from "./inflections.js";

// ---------------------------------------------------------------------------
// Dictionary part entries — discriminated union on pofs
// ---------------------------------------------------------------------------

export interface NounEntry {
  readonly decl: DecnRecord;
  readonly gender: Gender;
  readonly kind: NounKind;
}

export interface PronounEntry {
  readonly decl: DecnRecord;
  readonly kind: PronounKind;
}

export interface PropackEntry {
  readonly decl: DecnRecord;
  readonly kind: PronounKind;
}

export interface AdjectiveEntry {
  readonly decl: DecnRecord;
  readonly co: Comparison;
}

export interface NumeralEntry {
  readonly decl: DecnRecord;
  readonly sort: NumeralSort;
  readonly value: NumeralValue;
}

export interface AdverbEntry {
  readonly co: Comparison;
}

export interface VerbEntry {
  readonly con: DecnRecord;
  readonly kind: VerbKind;
}

export interface PrepositionEntry {
  readonly obj: Case;
}

// ---------------------------------------------------------------------------
// Part entry — discriminated union
// ---------------------------------------------------------------------------

export type PartEntry =
  | { readonly pofs: "N"; readonly n: NounEntry }
  | { readonly pofs: "PRON"; readonly pron: PronounEntry }
  | { readonly pofs: "PACK"; readonly pack: PropackEntry }
  | { readonly pofs: "ADJ"; readonly adj: AdjectiveEntry }
  | { readonly pofs: "NUM"; readonly num: NumeralEntry }
  | { readonly pofs: "ADV"; readonly adv: AdverbEntry }
  | { readonly pofs: "V"; readonly v: VerbEntry }
  | { readonly pofs: "VPAR" }
  | { readonly pofs: "SUPINE" }
  | { readonly pofs: "PREP"; readonly prep: PrepositionEntry }
  | { readonly pofs: "CONJ" }
  | { readonly pofs: "INTERJ" }
  | { readonly pofs: "TACKON" }
  | { readonly pofs: "PREFIX" }
  | { readonly pofs: "SUFFIX" }
  | { readonly pofs: "X" };

// ---------------------------------------------------------------------------
// Translation record
// ---------------------------------------------------------------------------

export interface TranslationRecord {
  readonly age: Age;
  readonly area: Area;
  readonly geo: Geo;
  readonly freq: Frequency;
  readonly source: Source;
}

// ---------------------------------------------------------------------------
// Dictionary entry
// ---------------------------------------------------------------------------

export type Stems = readonly [string, string, string, string];

export interface DictionaryEntry {
  readonly stems: Stems;
  readonly part: PartEntry;
  readonly tran: TranslationRecord;
  readonly mean: string;
}

// ---------------------------------------------------------------------------
// Null / default constants
// ---------------------------------------------------------------------------

export const NULL_STEMS: Stems = ["", "", "", ""] as const;

export const NULL_PART_ENTRY: PartEntry = { pofs: "X" } as const;

export const NULL_TRANSLATION: TranslationRecord = {
  age: "X",
  area: "X",
  geo: "X",
  freq: "X",
  source: "X",
} as const;

export const NULL_DICTIONARY_ENTRY: DictionaryEntry = {
  stems: NULL_STEMS,
  part: NULL_PART_ENTRY,
  tran: NULL_TRANSLATION,
  mean: "",
} as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const STEM_COUNTS: Record<PartOfSpeech, StemKey> = {
  X: 0,
  N: 2,
  PRON: 2,
  PACK: 2,
  ADJ: 4,
  NUM: 4,
  ADV: 3,
  V: 4,
  VPAR: 0,
  SUPINE: 0,
  PREP: 1,
  CONJ: 1,
  INTERJ: 1,
  TACKON: 0,
  PREFIX: 1,
  SUFFIX: 1,
};

export function numberOfStems(pofs: PartOfSpeech): StemKey {
  return STEM_COUNTS[pofs];
}
