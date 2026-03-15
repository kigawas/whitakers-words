// All enumeration types as const arrays + derived union types.
// Values match Ada's Enumeration_IO uppercase output format.
// Each enum has an 'X' value meaning "all, none, or unknown".

export const PARTS_OF_SPEECH = [
  "X",
  "N",
  "PRON",
  "PACK",
  "ADJ",
  "NUM",
  "ADV",
  "V",
  "VPAR",
  "SUPINE",
  "PREP",
  "CONJ",
  "INTERJ",
  "TACKON",
  "PREFIX",
  "SUFFIX",
] as const;
export type PartOfSpeech = (typeof PARTS_OF_SPEECH)[number];

export const GENDERS = ["X", "M", "F", "N", "C"] as const;
export type Gender = (typeof GENDERS)[number];

export const CASES = ["X", "NOM", "VOC", "GEN", "LOC", "DAT", "ABL", "ACC"] as const;
export type Case = (typeof CASES)[number];

export const NUMBERS = ["X", "S", "P"] as const;
export type GrammaticalNumber = (typeof NUMBERS)[number];

export type Person = 0 | 1 | 2 | 3;

export const COMPARISONS = ["X", "POS", "COMP", "SUPER"] as const;
export type Comparison = (typeof COMPARISONS)[number];

export const TENSES = ["X", "PRES", "IMPF", "FUT", "PERF", "PLUP", "FUTP"] as const;
export type Tense = (typeof TENSES)[number];

export const VOICES = ["X", "ACTIVE", "PASSIVE"] as const;
export type Voice = (typeof VOICES)[number];

export const MOODS = ["X", "IND", "SUB", "IMP", "INF", "PPL"] as const;
export type Mood = (typeof MOODS)[number];

export const NOUN_KINDS = ["X", "S", "M", "A", "G", "N", "P", "T", "L", "W"] as const;
export type NounKind = (typeof NOUN_KINDS)[number];

export const PRONOUN_KINDS = [
  "X",
  "PERS",
  "REL",
  "REFLEX",
  "DEMONS",
  "INTERR",
  "INDEF",
  "ADJECT",
] as const;
export type PronounKind = (typeof PRONOUN_KINDS)[number];

export const NUMERAL_SORTS = ["X", "CARD", "ORD", "DIST", "ADVERB"] as const;
export type NumeralSort = (typeof NUMERAL_SORTS)[number];

export const VERB_KINDS = [
  "X",
  "TO_BE",
  "TO_BEING",
  "GEN",
  "DAT",
  "ABL",
  "TRANS",
  "INTRANS",
  "IMPERS",
  "DEP",
  "SEMIDEP",
  "PERFDEF",
] as const;
export type VerbKind = (typeof VERB_KINDS)[number];

export const AGES = ["X", "A", "B", "C", "D", "E", "F", "G", "H"] as const;
export type Age = (typeof AGES)[number];

export const FREQUENCIES = ["X", "A", "B", "C", "D", "E", "F", "I", "M", "N"] as const;
export type Frequency = (typeof FREQUENCIES)[number];

export const AREAS = ["X", "A", "B", "D", "E", "G", "L", "P", "S", "T", "W", "Y"] as const;
export type Area = (typeof AREAS)[number];

export const GEOS = [
  "X",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "N",
  "P",
  "Q",
  "R",
  "S",
  "U",
] as const;
export type Geo = (typeof GEOS)[number];

export const SOURCES = [
  "X",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "Y",
  "Z",
] as const;
export type Source = (typeof SOURCES)[number];

export const DICTIONARY_KINDS = [
  "X",
  "ADDONS",
  "XXX",
  "YYY",
  "NNN",
  "RRR",
  "PPP",
  "GENERAL",
  "SPECIAL",
  "LOCAL",
  "UNIQUE",
] as const;
export type DictionaryKind = (typeof DICTIONARY_KINDS)[number];

// Subranges
export type Which = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type Variant = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type StemKey = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type NumeralValue = number; // 0..1000

export const MAX_STEM_SIZE = 18;
export const MAX_ENDING_SIZE = 7;
