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

export function numberOfStems(pofs: PartOfSpeech): StemKey {
  switch (pofs) {
    case "N":
      return 2;
    case "PRON":
      return 2;
    case "PACK":
      return 2;
    case "ADJ":
      return 4;
    case "NUM":
      return 4;
    case "ADV":
      return 3;
    case "V":
      return 4;
    case "VPAR":
      return 0;
    case "SUPINE":
      return 0;
    case "PREP":
      return 1;
    case "CONJ":
      return 1;
    case "INTERJ":
      return 1;
    case "TACKON":
      return 0;
    case "PREFIX":
      return 1;
    case "SUFFIX":
      return 1;
    case "X":
      return 0;
  }
}
