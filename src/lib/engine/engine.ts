import { formatWordAnalysis } from "../formatter/text-output.js";
import { parseAddonsFile } from "../parsers/addons.js";
import { parseDictFile } from "../parsers/dictline.js";
import { parseInflectsFile } from "../parsers/inflects.js";
import type { UniqueEntry } from "../parsers/uniques.js";
import { parseUniquesFile } from "../parsers/uniques.js";
import type { AddonsData } from "../types/addons.js";
import type { DictionaryEntry } from "../types/dictionary.js";
import type { InflectionRecord } from "../types/inflections.js";
import { type AddonResult, tryPrefixes, trySuffixes, tryTackons } from "./addons-engine.js";
import { type CompoundResult, tryCompound } from "./compounds.js";
import { buildDictionaryIndex, type DictionaryIndex } from "./dictionary-index.js";
import {
  buildEnglishIndex,
  type EnglishIndex,
  type EnglishSearchResult,
  searchEnglish,
} from "./english-search.js";
import { buildInflectionIndex, type InflectionIndex } from "./inflection-index.js";
import { listSweep } from "./list-sweep.js";
import { parseRomanNumeral } from "./roman-numerals.js";
import { buildSuffixTrie, type SuffixTrieNode } from "./suffix-trie.js";
import { type SyncopeResult, trySyncope } from "./syncope.js";
import { applyTricks } from "./tricks.js";
import { type TwoWordResult, tryTwoWords } from "./two-words.js";
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

export interface RomanNumeralResult {
  readonly value: number;
}

export interface WordAnalysis {
  readonly word: string;
  readonly results: readonly ParseResult[];
  readonly uniqueResults: readonly UniqueEntry[];
  readonly addonResults: readonly AddonResult[];
  readonly trickResults: readonly ParseResult[];
  readonly syncopeResult: SyncopeResult | null;
  readonly twoWordResult: TwoWordResult | null;
  readonly romanNumeralResult: RomanNumeralResult | null;
  readonly compoundResults: readonly CompoundResult[];
}

export type { CompoundResult } from "./compounds.js";

export class WordsEngine {
  readonly #dictEntries: readonly DictionaryEntry[];
  readonly #inflRecords: readonly InflectionRecord[];
  readonly #dictIndex: DictionaryIndex;
  readonly #inflIndex: InflectionIndex;
  readonly #addons: AddonsData;
  readonly #uniques: readonly UniqueEntry[];
  readonly #uniquesByFirstChar: ReadonlyMap<string, readonly UniqueEntry[]>;
  readonly #englishIndex: EnglishIndex;
  // Pre-computed combined addon arrays (avoid re-spreading on every parseWord call)
  readonly #allTackons: AddonsData["tackons"];
  readonly #allPackons: AddonsData["packons"];
  readonly #allPrefixes: AddonsData["prefixes"];
  readonly #suffixTrie: SuffixTrieNode;

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
    this.#allTackons = addons.tackons;
    this.#allPackons = addons.packons;
    this.#allPrefixes = [...addons.prefixes, ...addons.tickons];
    this.#suffixTrie = buildSuffixTrie(addons.suffixes);
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

    // Synthesize a base "sum/esse" entry if not already present.
    // DICTLINE.GEN has compound V 5 1 entries (absum, adsum, possum) but no
    // standalone "sum". Ada generates this at compile time via its STEMFILE.
    addSumEntry(dictEntries);

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

  /** Analyze a single Latin word, returning all possible parses.
   *  If nextWord is provided, also checks for compound verb forms (PPL + sum/esse).
   */
  parseWord(word: string, nextWord = ""): WordAnalysis {
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

    // 4b. Always try syncope — syncopated perfect forms. Ada applies syncope
    // even when standard results exist (it's shown alongside normal results).
    const syncopeResult = trySyncope(lowerWord, this.#inflIndex, this.#dictIndex);

    // 5. Try tackons (enclitics like -que, -ne, -ve) when no direct results found.
    const addonResults: AddonResult[] = [];
    const noResults = () =>
      results.length === 0 &&
      uniqueResults.length === 0 &&
      trickResults.length === 0 &&
      addonResults.length === 0;

    if (noResults()) {
      addonResults.push(
        ...tryTackons(
          lowerWord,
          this.#allTackons,
          this.#allPackons,
          this.#inflIndex,
          this.#dictIndex,
        ),
      );
    }

    // 6. Try suffixes — Ada tries suffix stripping before two-word splitting.
    if (noResults()) {
      addonResults.push(
        ...trySuffixes(lowerWord, this.#suffixTrie, this.#inflIndex, this.#dictIndex),
      );
    }

    // 7. Two-word splitting — fallback after tackons/suffixes but before prefixes.
    let twoWordResult: TwoWordResult | null = null;
    if (noResults() && !syncopeResult) {
      twoWordResult = tryTwoWords(lowerWord, this.#inflIndex, this.#dictIndex);
    }

    // 8. Try prefixes — last resort after two-word splitting.
    if (noResults() && !twoWordResult) {
      addonResults.push(
        ...tryPrefixes(lowerWord, this.#allPrefixes, this.#inflIndex, this.#dictIndex),
      );
    }

    // 9. Roman numeral detection — runs alongside other results (not fallback).
    let romanNumeralResult: RomanNumeralResult | null = null;
    const romanValue = parseRomanNumeral(word.toUpperCase());
    if (romanValue !== null) {
      romanNumeralResult = { value: romanValue };
    }

    // 10. Compound perfect passive — PPL + sum/esse/fuisse
    const compoundResults = nextWord.length > 0 ? tryCompound(results, nextWord) : [];

    // When a compound is detected, filter results to only matching NOM VPAR entries
    // (Ada's Do_Clear_Pas_Nom_Ppl removes non-VPAR and non-NOM VPAR results)
    if (compoundResults.length > 0) {
      const compoundEntryIndices = new Set(compoundResults.map((c) => c.entryIndex));
      results = results.filter(
        (r) =>
          r.ir.qual.pofs === "VPAR" &&
          r.ir.qual.vpar.tenseVoiceMood.tense === "PERF" &&
          r.ir.qual.vpar.tenseVoiceMood.voice === "PASSIVE" &&
          r.ir.qual.vpar.tenseVoiceMood.mood === "PPL" &&
          r.ir.qual.vpar.cs === "NOM" &&
          compoundEntryIndices.has(r.entryIndex),
      );
    }

    return {
      word,
      results,
      uniqueResults,
      addonResults,
      trickResults,
      syncopeResult,
      twoWordResult,
      romanNumeralResult,
      compoundResults,
    };
  }

  /**
   * Parse a line of Latin text, handling compound verb detection (PPL + sum/esse).
   * Returns an analysis per word. When a compound is detected, the next word
   * (the sum/esse form) is consumed and not returned as a separate analysis.
   */
  parseLine(line: string): WordAnalysis[] {
    const cleaned = line.replace(/[^a-zA-Z]/g, " ");
    const words = cleaned.split(/\s+/).filter((w) => w.length > 0);
    const analyses: WordAnalysis[] = [];

    let skipNext = false;
    for (let i = 0; i < words.length; i++) {
      if (skipNext) {
        skipNext = false;
        continue;
      }

      const word = words[i] ?? "";
      if (word.length === 0) continue;
      const nextWord = words[i + 1] ?? "";
      const analysis = this.parseWord(word, nextWord);

      if (analysis.compoundResults.length > 0) {
        skipNext = true;
      }
      analyses.push(analysis);
    }
    return analyses;
  }

  /** Format a line of Latin text with compound verb detection. */
  formatLine(line: string): string {
    const analyses = this.parseLine(line);
    const parts: string[] = [];
    for (const a of analyses) {
      const output = formatWordAnalysis(a);
      if (output.length > 0) parts.push(output);
    }
    return parts.join("\n");
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

/**
 * Synthesize a standalone "sum/esse/fui/futurus" entry if not present in DICTLINE.
 * Ada generates this at compile time in its STEMFILE. DICTLINE.GEN only has compound
 * V 5 1 entries (absum, adsum, possum) but the base "sum" verb needs its own entry
 * so that forms like "est", "esse", "erat" can be found via blank-stem lookup.
 */
function addSumEntry(entries: DictionaryEntry[]): void {
  // Check if a standalone sum entry already exists
  const hasSum = entries.some(
    (e) =>
      e.part.pofs === "V" && e.part.v.con.which === 5 && e.stems[0] === "s" && e.stems[1] === "",
  );
  if (hasSum) return;

  // Stems: s (present 1sg "sum"), blank (key=2 endings like "est"/"esse" are full forms),
  // fu (perfect "fui"), fut (future participle "futurus")
  const sumEntry: DictionaryEntry = {
    stems: ["s", "", "fu", "fut"],
    part: { pofs: "V", v: { con: { which: 5, var: 1 }, kind: "TO_BE" } },
    tran: { age: "X", area: "X", geo: "X", freq: "A", source: "X" },
    mean: "be; exist; (also used to form verb perfect passive tenses) with NOM PERF PPL",
  };
  entries.push(sumEntry);
}
