import { formatWordAnalysis } from "../formatter/text-output.js";
import { parseAddonsFile } from "../parsers/addons.js";
import { parseDictFile } from "../parsers/dictline.js";
import { parseInflectsFile } from "../parsers/inflects.js";
import type { UniqueEntry } from "../parsers/uniques.js";
import { parseUniquesFile } from "../parsers/uniques.js";
import type { AddonsData } from "../types/addons.js";
import type { DictionaryEntry } from "../types/dictionary.js";
import type { InflectionRecord } from "../types/inflections.js";
import { type AddonResult, tryAddons } from "./addons-engine.js";
import { buildDictionaryIndex, type DictionaryIndex } from "./dictionary-index.js";
import {
  buildEnglishIndex,
  type EnglishIndex,
  type EnglishSearchResult,
  searchEnglish,
} from "./english-search.js";
import { buildInflectionIndex, type InflectionIndex } from "./inflection-index.js";
import { listSweep } from "./list-sweep.js";
import { applyTricks } from "./tricks.js";
import { analyzeWord, type ParseResult } from "./word-analysis.js";

// ---------------------------------------------------------------------------
// WordsEngine — top-level API
// ---------------------------------------------------------------------------

export interface WordsEngineData {
  readonly dictline: string;
  readonly inflects: string;
  readonly addons: string;
  readonly uniques: string;
}

export interface WordAnalysis {
  readonly word: string;
  readonly results: readonly ParseResult[];
  readonly uniqueResults: readonly UniqueEntry[];
  readonly addonResults: readonly AddonResult[];
  readonly trickResults: readonly ParseResult[];
}

export class WordsEngine {
  readonly #dictEntries: readonly DictionaryEntry[];
  readonly #inflRecords: readonly InflectionRecord[];
  readonly #dictIndex: DictionaryIndex;
  readonly #inflIndex: InflectionIndex;
  readonly #addons: AddonsData;
  readonly #uniques: readonly UniqueEntry[];
  readonly #uniquesByFirstChar: ReadonlyMap<string, readonly UniqueEntry[]>;
  readonly #englishIndex: EnglishIndex;

  private constructor(
    dictEntries: readonly DictionaryEntry[],
    inflRecords: readonly InflectionRecord[],
    dictIndex: DictionaryIndex,
    inflIndex: InflectionIndex,
    addons: AddonsData,
    uniques: readonly UniqueEntry[],
    englishIndex: EnglishIndex,
  ) {
    this.#dictEntries = dictEntries;
    this.#inflRecords = inflRecords;
    this.#dictIndex = dictIndex;
    this.#inflIndex = inflIndex;
    this.#addons = addons;
    this.#uniques = uniques;
    this.#uniquesByFirstChar = buildUniquesIndex(uniques);
    this.#englishIndex = englishIndex;
  }

  /**
   * Create a new WordsEngine from raw data file contents.
   * The consumer provides the file contents (loaded via fs, fetch, etc.).
   */
  static create(data: WordsEngineData): WordsEngine {
    const dictEntries = parseDictFile(data.dictline);
    const inflRecords = parseInflectsFile(data.inflects);
    const addons = parseAddonsFile(data.addons);
    const uniques = parseUniquesFile(data.uniques);

    const dictIndex = buildDictionaryIndex(dictEntries);
    const inflIndex = buildInflectionIndex(inflRecords);
    const englishIndex = buildEnglishIndex(dictEntries);

    return new WordsEngine(
      dictEntries,
      inflRecords,
      dictIndex,
      inflIndex,
      addons,
      uniques,
      englishIndex,
    );
  }

  /** Analyze a single Latin word, returning all possible parses. */
  parseWord(word: string): WordAnalysis {
    const lowerWord = word.toLowerCase();

    // 1. Check uniques first
    const uniqueResults = this.#lookupUniques(lowerWord);

    // 2. Standard dictionary + inflection analysis
    let results = analyzeWord(lowerWord, this.#inflIndex, this.#dictIndex);

    // 3. Deduplicate and rank
    results = listSweep(results);

    // 4. If no results, try tricks (spelling variations)
    let trickResults: ParseResult[] = [];
    if (results.length === 0 && uniqueResults.length === 0) {
      const trickWords = applyTricks(lowerWord);
      for (const tw of trickWords) {
        const trickParses = analyzeWord(tw, this.#inflIndex, this.#dictIndex);
        if (trickParses.length > 0) {
          trickResults = listSweep(trickParses);
          break; // take first successful trick
        }
      }
    }

    // 5. If still no results, try addons (prefix/suffix/tackon stripping)
    let addonResults: AddonResult[] = [];
    if (results.length === 0 && uniqueResults.length === 0 && trickResults.length === 0) {
      addonResults = tryAddons(lowerWord, this.#addons, this.#inflIndex, this.#dictIndex);
    }

    return { word, results, uniqueResults, addonResults, trickResults };
  }

  /** Search English-to-Latin. */
  searchEnglish(word: string, maxResults = 6): EnglishSearchResult[] {
    return searchEnglish(this.#englishIndex, word, maxResults);
  }

  /** Format a word analysis as human-readable text. */
  formatWord(word: string): string {
    const analysis = this.parseWord(word);
    return formatWordAnalysis(analysis);
  }

  /** Get the addons data. */
  get addons(): AddonsData {
    return this.#addons;
  }

  /** Get the number of dictionary entries. */
  get dictionarySize(): number {
    return this.#dictEntries.length;
  }

  /** Get the number of inflection records. */
  get inflectionCount(): number {
    return this.#inflRecords.length;
  }

  /** Get the number of unique entries. */
  get uniqueCount(): number {
    return this.#uniques.length;
  }

  #lookupUniques(word: string): UniqueEntry[] {
    let firstChar = word.charAt(0);
    if (firstChar === "v") firstChar = "u";
    if (firstChar === "j") firstChar = "i";

    const bucket = this.#uniquesByFirstChar.get(firstChar);
    if (!bucket) return [];

    const results: UniqueEntry[] = [];
    for (const entry of bucket) {
      if (equLatin(entry.word.toLowerCase(), word)) {
        results.push(entry);
      }
    }
    return results;
  }
}

function equLatin(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ca = normalizeLatinChar(a.charAt(i));
    const cb = normalizeLatinChar(b.charAt(i));
    if (ca !== cb) return false;
  }
  return true;
}

function normalizeLatinChar(c: string): string {
  if (c === "v") return "u";
  if (c === "j") return "i";
  return c;
}

function buildUniquesIndex(uniques: readonly UniqueEntry[]): Map<string, UniqueEntry[]> {
  const index = new Map<string, UniqueEntry[]>();
  for (const entry of uniques) {
    let firstChar = entry.word.charAt(0).toLowerCase();
    if (firstChar === "v") firstChar = "u";
    if (firstChar === "j") firstChar = "i";

    let bucket = index.get(firstChar);
    if (!bucket) {
      bucket = [];
      index.set(firstChar, bucket);
    }
    bucket.push(entry);
  }
  return index;
}
