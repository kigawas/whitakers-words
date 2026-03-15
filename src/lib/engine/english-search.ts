import type { DictionaryEntry } from "../types/dictionary.js";

// ---------------------------------------------------------------------------
// English-to-Latin reverse lookup.
//
// Builds an inverted index from English meaning words → dictionary entries.
// At runtime, searches this index for English words and returns matching
// Latin dictionary entries, ranked by frequency.
// ---------------------------------------------------------------------------

export interface EnglishSearchResult {
  readonly de: DictionaryEntry;
  readonly entryIndex: number;
  /** How strongly the English word matches (higher = better). */
  readonly rank: number;
}

export interface EnglishIndex {
  /** Map from lowercase English word → array of (entryIndex, rank). */
  readonly byWord: ReadonlyMap<string, readonly EnglishIndexEntry[]>;
  /** The source entries array. */
  readonly entries: readonly DictionaryEntry[];
}

interface EnglishIndexEntry {
  readonly entryIndex: number;
  readonly rank: number;
}

// Frequency ranking: A=most common → X=unknown
const FREQ_RANK: Record<string, number> = {
  A: 6,
  B: 5,
  C: 4,
  D: 3,
  E: 2,
  F: 1,
  X: 3, // treat unknown as moderate
};

/**
 * Build an inverted index from English meaning words to dictionary entries.
 * Extracts individual words from the meaning field of each entry.
 */
export function buildEnglishIndex(entries: readonly DictionaryEntry[]): EnglishIndex {
  const byWord = new Map<string, EnglishIndexEntry[]>();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    if (!entry) continue;

    const mean = entry.mean;
    if (mean.length === 0) continue;

    // Extract individual words from the meaning
    const words = extractEnglishWords(mean);
    const freq = entry.tran.freq;
    const rank = FREQ_RANK[freq] ?? 3;

    // Track which words we've already indexed for this entry
    const seen = new Set<string>();
    for (const word of words) {
      if (word.length < 2) continue; // skip single chars
      if (seen.has(word)) continue;
      seen.add(word);

      let bucket = byWord.get(word);
      if (!bucket) {
        bucket = [];
        byWord.set(word, bucket);
      }
      bucket.push({ entryIndex: i, rank });
    }
  }

  // Sort each bucket by rank (descending)
  for (const bucket of byWord.values()) {
    bucket.sort((a, b) => b.rank - a.rank);
  }

  return { byWord, entries };
}

/**
 * Search the English index for a word.
 * Returns matching Latin dictionary entries, ranked by relevance.
 */
export function searchEnglish(
  index: EnglishIndex,
  word: string,
  maxResults = 6,
): EnglishSearchResult[] {
  const normalized = word.toLowerCase().trim();
  const bucket = index.byWord.get(normalized);
  if (!bucket) return [];

  const results: EnglishSearchResult[] = [];
  const seen = new Set<number>(); // deduplicate by entryIndex

  for (const entry of bucket) {
    if (seen.has(entry.entryIndex)) continue;
    seen.add(entry.entryIndex);

    const de = index.entries[entry.entryIndex];
    if (!de) continue;

    results.push({
      de,
      entryIndex: entry.entryIndex,
      rank: entry.rank,
    });

    if (results.length >= maxResults) break;
  }

  return results;
}

/** Extract individual lowercase words from a meaning string. */
function extractEnglishWords(mean: string): string[] {
  // Remove common non-word markers
  const cleaned = mean
    .replace(/\([^)]*\)/g, " ") // remove parenthetical
    .replace(/\[[^\]]*\]/g, " ") // remove brackets
    .replace(/[;,/!?."'`~=<>+\-|#@$%^&*{}]/g, " ") // remove punctuation
    .toLowerCase();

  return cleaned.split(/\s+/).filter((w) => w.length >= 2 && /^[a-z]+$/.test(w));
}
