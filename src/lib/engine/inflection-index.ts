import type { InflectionRecord } from "../types/inflections.js";

// ---------------------------------------------------------------------------
// In-memory inflection lookup by ending.
//
// Ada uses a 2D array index: Lelf/Lell(ending_size, last_char).
// We use a Map keyed by "size:lastChar" for non-blank endings,
// plus a separate array for blank (size=0) endings.
// ---------------------------------------------------------------------------

export interface InflectionIndex {
  /** Inflections with zero-length endings (the stem IS the whole word). */
  readonly blank: readonly InflectionRecord[];
  /** Inflections keyed by `${size}:${lastChar}` for non-blank endings. */
  readonly byEnding: ReadonlyMap<string, readonly InflectionRecord[]>;
}

function endingKey(size: number, lastChar: string): string {
  return `${size}:${lastChar}`;
}

export function buildInflectionIndex(records: readonly InflectionRecord[]): InflectionIndex {
  const blank: InflectionRecord[] = [];
  const byEnding = new Map<string, InflectionRecord[]>();

  for (const rec of records) {
    if (rec.ending.size === 0) {
      blank.push(rec);
    } else {
      const suf = rec.ending.suf;
      const lastChar = suf.charAt(suf.length - 1);
      const key = endingKey(rec.ending.size, lastChar);
      let bucket = byEnding.get(key);
      if (!bucket) {
        bucket = [];
        byEnding.set(key, bucket);
      }
      bucket.push(rec);
    }
  }

  return { blank, byEnding };
}

/**
 * Look up inflections that could match a given ending.
 * Returns all inflection records whose ending size and last character match.
 * The caller must still verify the full ending string matches.
 */
export function lookupInflections(
  index: InflectionIndex,
  endingSize: number,
  lastChar: string,
): readonly InflectionRecord[] {
  if (endingSize === 0) return index.blank;
  return index.byEnding.get(endingKey(endingSize, lastChar)) ?? [];
}
