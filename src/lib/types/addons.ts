import type { PartEntry } from "./dictionary.js";
import type { PartOfSpeech, StemKey } from "./enums.js";

// ---------------------------------------------------------------------------
// Target entry — discriminated union matching Ada's Target_Entry
// Used by tackons (the base entry) and suffixes (the target).
// Same as dictionary PartEntry — the target describes what the addon
// transforms into / attaches to.
// ---------------------------------------------------------------------------

export type TargetEntry = PartEntry;

// ---------------------------------------------------------------------------
// Prefix entry — describes POS transformation (Root POS → Target POS)
// ---------------------------------------------------------------------------

export interface PrefixEntry {
  readonly root: PartOfSpeech;
  readonly target: PartOfSpeech;
}

// ---------------------------------------------------------------------------
// Suffix entry — root POS + key, target entry + key
// ---------------------------------------------------------------------------

export interface SuffixEntry {
  readonly root: PartOfSpeech;
  readonly rootKey: StemKey;
  readonly target: TargetEntry;
  readonly targetKey: StemKey;
}

// ---------------------------------------------------------------------------
// Tackon — enclitic particle (e.g. -que, -ve, -ne)
// ---------------------------------------------------------------------------

export interface TackonItem {
  readonly word: string;
  readonly base: TargetEntry;
  readonly mean: string;
}

// ---------------------------------------------------------------------------
// Prefix — word-initial morpheme (e.g. ante-, ab-, ad-)
// ---------------------------------------------------------------------------

export interface PrefixItem {
  readonly fix: string;
  readonly connect: string;
  readonly entr: PrefixEntry;
  readonly mean: string;
}

// ---------------------------------------------------------------------------
// Suffix — word-final morpheme
// ---------------------------------------------------------------------------

export interface SuffixItem {
  readonly fix: string;
  readonly connect: string;
  readonly entr: SuffixEntry;
  readonly mean: string;
}

// ---------------------------------------------------------------------------
// Aggregated addons data
// ---------------------------------------------------------------------------

export interface AddonsData {
  readonly tackons: readonly TackonItem[];
  readonly packons: readonly TackonItem[];
  readonly tickons: readonly PrefixItem[];
  readonly prefixes: readonly PrefixItem[];
  readonly suffixes: readonly SuffixItem[];
}
