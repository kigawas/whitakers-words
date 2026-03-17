import type { AddonResult } from "../engine/addons-engine.js";
import type { CompoundResult } from "../engine/compounds.js";
import type { RomanNumeralResult } from "../engine/engine.js";
import type { SluryResult } from "../engine/slury.js";
import type { SyncopeResult } from "../engine/syncope.js";
import type { TwoWordResult } from "../engine/two-words.js";
import type { ParseResult } from "../engine/word-analysis.js";
import type { UniqueEntry } from "../parsers/uniques.js";
import type { DictionaryEntry } from "../types/dictionary.js";
import type { QualityRecord } from "../types/inflections.js";
import { extractQuality, type QualityValues } from "../types/quality-extract.js";
import { dictionaryForm } from "./dictionary-form.js";
import {
  AGE_TAG_COLUMN,
  CASE_WIDTH,
  DECL_WIDTH,
  f,
  formatFields,
  GENDER_WIDTH,
  MAX_MEANING_SIZE,
  MOOD_WIDTH,
  NUMBER_WIDTH,
  PERSON_WIDTH,
  POS_WIDTH,
  STEM_DOT_WIDTH,
  TENSE_WIDTH,
  TERMINAL_WIDTH,
  VOICE_WIDTH,
} from "./field-layout.js";

export interface WordAnalysisOutput {
  word: string;
  results: readonly ParseResult[];
  uniqueResults: readonly UniqueEntry[];
  addonResults?: readonly AddonResult[];
  trickAnnotations?: readonly string[];
  trickResults?: readonly ParseResult[];
  sluryResult?: SluryResult | null;
  syncopeResult?: SyncopeResult | null;
  twoWordResult?: TwoWordResult | null;
  romanNumeralResult?: RomanNumeralResult | null;
  compoundResults?: readonly CompoundResult[];
}

/**
 * Format a word analysis into human-readable text.
 * Groups inflections by dictionary entry (same entryIndex),
 * then shows dictionary form and meaning once per group.
 */
export function formatWordAnalysis(analysis: WordAnalysisOutput): string {
  const lines: string[] = [];

  // Format unique results
  for (const u of analysis.uniqueResults) {
    lines.push(formatQualityLine(u.word, "", u.qual));
    lines.push(`${dictionaryForm(u.de)}   ${formatFlags(u.de)}`);
    lines.push(truncateMeaning(u.de.mean));
  }

  // Group standard results by entryIndex, merge | continuations,
  // then merge groups with identical meanings (variant dictionary entries).
  // When compounds exist, inject PPL+ lines between VPAR inflections and dict form.
  const compoundsByEntry = new Map<number, CompoundResult>();
  if (analysis.compoundResults) {
    for (const cr of analysis.compoundResults) {
      compoundsByEntry.set(cr.entryIndex, cr);
    }
  }

  const merged = groupAndMerge(analysis.results);
  const rendered = mergeByMeaning(merged);
  for (const block of rendered) {
    if (compoundsByEntry.size > 0) {
      // Inject compound line after VPAR inflection lines, before dict form
      const out: string[] = [];
      for (const line of block) {
        out.push(line);
        // After the last VPAR inflection line, insert compound
        // Detect: next line is dict form (starts with a letter and contains comma)
        // or current line is a VPAR inflection line
      }
      // Simpler approach: find the first dict form line and insert before it
      const dictFormIdx = out.findIndex((l) => /^\S+,\s/.test(l) || /\[.{5}\]/.test(l));
      if (dictFormIdx >= 0) {
        // Check which entryIndex this group belongs to
        const groupResults = merged.find((g) =>
          g.results.some((r) => compoundsByEntry.has(r.entryIndex)),
        );
        const firstResult = groupResults?.results[0];
        if (groupResults && firstResult) {
          const cr = compoundsByEntry.get(firstResult.entryIndex);
          if (cr) {
            const compLine = formatCompoundLine(cr);
            out.splice(dictFormIdx, 0, ...compLine);
            compoundsByEntry.delete(cr.entryIndex);
          }
        }
      }
      lines.push(...out);
    } else {
      lines.push(...block);
    }
  }

  // Any remaining compounds not matched to a group (shouldn't happen normally)
  for (const cr of compoundsByEntry.values()) {
    lines.push(...formatCompoundLine(cr));
    lines.push(`${dictionaryForm(cr.de)}   ${formatFlags(cr.de)}`);
    lines.push(truncateMeaning(cr.de.mean));
  }

  // Roman numeral result
  if (analysis.romanNumeralResult) {
    const w = analysis.word.toLowerCase();
    lines.push(`${padRight(w, STEM_DOT_WIDTH)}NUM    2 0 X   X X CARD`);
    lines.push(`${analysis.romanNumeralResult.value}  as a ROMAN NUMERAL;`);
  }

  // Slury (prefix assimilation) annotations and results
  if (analysis.sluryResult) {
    lines.push(padRight(analysis.sluryResult.label, STEM_DOT_WIDTH));
    lines.push(analysis.sluryResult.explanation);
    if (analysis.sluryResult.results.length > 0) {
      for (const block of mergeByMeaning(groupAndMerge(analysis.sluryResult.results))) {
        lines.push(...block);
      }
    }
  }

  // Trick results with annotations
  if (analysis.trickAnnotations) {
    for (const ann of analysis.trickAnnotations) {
      lines.push(ann);
    }
  }
  if (analysis.trickResults && analysis.trickResults.length > 0) {
    for (const block of mergeByMeaning(groupAndMerge(analysis.trickResults))) {
      lines.push(...block);
    }
  }

  // Syncope results
  if (analysis.syncopeResult) {
    lines.push(padRight(analysis.syncopeResult.label, STEM_DOT_WIDTH));
    lines.push(analysis.syncopeResult.explanation);
    for (const block of mergeByMeaning(groupAndMerge(analysis.syncopeResult.results))) {
      lines.push(...block);
    }
  }

  // Two-word results — show both left and right word analyses
  if (analysis.twoWordResult) {
    lines.push(padRight(analysis.twoWordResult.label, STEM_DOT_WIDTH));
    lines.push(analysis.twoWordResult.explanation);
    if (analysis.twoWordResult.leftResults) {
      for (const block of mergeByMeaning(groupAndMerge(analysis.twoWordResult.leftResults))) {
        lines.push(...block);
      }
    }
    for (const block of mergeByMeaning(groupAndMerge(analysis.twoWordResult.rightResults))) {
      lines.push(...block);
    }
  }

  // Addon results
  if (analysis.addonResults) {
    for (const ar of analysis.addonResults) {
      const addonName = ar.type === "tackon" ? ar.addon.word : ar.addon.fix;
      lines.push(`${addonName.padEnd(STEM_DOT_WIDTH)}${ar.type.toUpperCase()}`);
      lines.push(truncateMeaning(ar.addon.mean));
      for (const block of mergeByMeaning(groupAndMerge(ar.baseResults))) {
        lines.push(...block);
      }
    }
  }

  return lines.join("\n");
}

export interface MergedGroup {
  readonly results: readonly ParseResult[];
  readonly meaning: string;
}

/**
 * Group parse results by entryIndex, then merge DICTLINE continuation
 * entries (meanings starting with "|") into the preceding group.
 */
export function groupAndMerge(results: readonly ParseResult[]): MergedGroup[] {
  // Group by entryIndex, preserving order
  const map = new Map<number, ParseResult[]>();
  const order: number[] = [];
  for (const r of results) {
    let group = map.get(r.entryIndex);
    if (!group) {
      group = [];
      map.set(r.entryIndex, group);
      order.push(r.entryIndex);
    }
    group.push(r);
  }

  // Merge continuations (mutable during construction)
  const merged: { results: ParseResult[]; meaning: string }[] = [];
  for (const idx of order) {
    const groupResults = map.get(idx) ?? [];
    const first = groupResults[0];
    if (!first) continue;

    const mean = first.de.mean;
    if (mean.startsWith("|") && merged.length > 0) {
      const prev = merged[merged.length - 1];
      if (prev) prev.meaning += `\n${mean.replace(/^\|+/, "")}`;
    } else {
      merged.push({ results: groupResults, meaning: mean });
    }
  }

  return merged;
}

/**
 * Render a group into output lines: inflection lines + dictionary form + meaning.
 */
function renderGroup(group: MergedGroup): string[] {
  const out: string[] = [];
  for (const r of group.results) {
    out.push(formatInflectionLine(r));
  }
  const first = group.results[0];
  if (first) {
    out.push(`${dictionaryForm(first.de)}   ${formatFlags(first.de)}`);
    out.push(truncateMeaning(group.meaning));
  }
  return out;
}

/**
 * Compute a key representing the set of inflection lines for a group.
 */
function inflectionKey(group: MergedGroup): string {
  return group.results.map(formatInflectionLine).join("\n");
}

/**
 * Merge groups into rendered blocks, deduplicating in two ways:
 * 1. Groups with identical meanings → show inflection lines once + all dict forms.
 * 2. Groups with identical inflection lines → show inflections once + all meanings.
 * Ada groups results by inflection pattern, showing each pattern once with all
 * matching dictionary meanings listed below.
 */
function mergeByMeaning(groups: MergedGroup[]): string[][] {
  // First pass: merge groups with identical inflection line sets.
  // This collapses the many PRON "qu" entries with the same DAT/ABL/NOM pattern
  // into a single block with inflection lines shown once and meanings listed after.
  const byInflection = new Map<string, MergedGroup[]>();
  const inflOrder: string[] = [];
  for (const g of groups) {
    const key = inflectionKey(g);
    let bucket = byInflection.get(key);
    if (!bucket) {
      bucket = [];
      byInflection.set(key, bucket);
      inflOrder.push(key);
    }
    bucket.push(g);
  }

  const blocks: string[][] = [];
  for (const key of inflOrder) {
    const sameInflection = byInflection.get(key);
    if (!sameInflection) continue;

    if (sameInflection.length === 1 && sameInflection[0]) {
      blocks.push(renderGroup(sameInflection[0]));
    } else {
      // Show inflection lines once, then each dict form + meaning
      const out: string[] = [];
      const seenInflections = new Set<string>();
      for (const r of sameInflection[0]?.results ?? []) {
        const line = formatInflectionLine(r);
        if (!seenInflections.has(line)) {
          seenInflections.add(line);
          out.push(line);
        }
      }
      // Group by meaning: show all unique dict forms, then meaning once.
      // This matches Ada's behavior for variant spellings (attigo/attingo).
      const meaningGroups = new Map<string, MergedGroup[]>();
      const meaningOrder: string[] = [];
      for (const g of sameInflection) {
        let bucket = meaningGroups.get(g.meaning);
        if (!bucket) {
          bucket = [];
          meaningGroups.set(g.meaning, bucket);
          meaningOrder.push(g.meaning);
        }
        bucket.push(g);
      }
      for (const meaning of meaningOrder) {
        const mGroups = meaningGroups.get(meaning);
        if (!mGroups) continue;
        const seenDf = new Set<string>();
        for (const g of mGroups) {
          const first = g.results[0];
          if (first) {
            const df = `${dictionaryForm(first.de)}   ${formatFlags(first.de)}`;
            if (!seenDf.has(df)) {
              seenDf.add(df);
              out.push(df);
            }
          }
        }
        out.push(truncateMeaning(meaning));
      }
      blocks.push(out);
    }
  }
  return blocks;
}

/** Format compound PPL+ line and gloss. */
function formatCompoundLine(cr: CompoundResult): string[] {
  const compLine = formatFields([
    f("V", POS_WIDTH),
    f(cr.con.which, DECL_WIDTH),
    f(cr.con.var, DECL_WIDTH),
    f(cr.tense, TENSE_WIDTH),
    f(cr.voice, VOICE_WIDTH),
    f(cr.mood, MOOD_WIDTH),
    f(cr.person, PERSON_WIDTH),
    f(cr.number, TERMINAL_WIDTH),
  ]).trimEnd();
  return [padRight(cr.stem, STEM_DOT_WIDTH) + compLine, truncateMeaning(cr.gloss)];
}

export function formatInflectionLine(r: ParseResult): string {
  const ending = r.ir.ending.suf;
  const stemDot = ending ? `${r.stem}.${ending}` : r.stem;
  const verbKind = r.de.part.pofs === "V" ? r.de.part.v.kind : "";
  let line = padRight(stemDot, STEM_DOT_WIDTH) + formatQualityRecord(r.ir.qual, verbKind);
  // Append inflection age tag if not default (Ada behavior)
  const age = formatAge(r.ir.age);
  if (age) {
    line = `${line.padEnd(AGE_TAG_COLUMN)}  ${age}`;
  }
  return line;
}

function formatQualityLine(stem: string, ending: string, qual: QualityRecord): string {
  const stemDot = ending ? `${stem}.${ending}` : stem;
  return padRight(stemDot, STEM_DOT_WIDTH) + formatQualityRecord(qual, "");
}

/**
 * Format a quality record using extracted values and the fixed-width field layout.
 * This replaces the per-POS switch with a single data-driven formatter.
 */
function formatQualityRecord(qual: QualityRecord, verbKind: string): string {
  const v = extractQuality(qual);
  return formatQualityFromValues(v, verbKind);
}

function formatQualityFromValues(v: QualityValues, verbKind: string): string {
  // Nominal types: POS + decl + case/number/gender [+ comparison/sort]
  if (v.pofs === "N" || v.pofs === "PRON" || v.pofs === "PACK" || v.pofs === "SUPINE") {
    const fields = [f(v.pofs, POS_WIDTH)];
    if (v.decl) fields.push(f(v.decl[0], DECL_WIDTH), f(v.decl[1], DECL_WIDTH));
    if (v.cs)
      fields.push(f(v.cs, CASE_WIDTH), f(v.number, NUMBER_WIDTH), f(v.gender, GENDER_WIDTH));
    return formatFields(fields).trimEnd();
  }
  if (v.pofs === "ADJ" || v.pofs === "NUM") {
    const fields = [f(v.pofs, POS_WIDTH)];
    if (v.decl) fields.push(f(v.decl[0], DECL_WIDTH), f(v.decl[1], DECL_WIDTH));
    fields.push(f(v.cs, CASE_WIDTH), f(v.number, NUMBER_WIDTH), f(v.gender, GENDER_WIDTH));
    if (v.comparison) fields.push(f(v.comparison, TERMINAL_WIDTH));
    if (v.sort) fields.push(f(v.sort, TERMINAL_WIDTH));
    return formatFields(fields).trimEnd();
  }
  // ADV: simple
  if (v.pofs === "ADV") {
    return `ADV    ${v.comparison}`;
  }
  // V: POS + con + tense(5) + voice(8) + mood(4) + person(2) + number
  if (v.pofs === "V") {
    // For DEP/SEMIDEP verbs, voice is implied — blank it out (Ada behavior)
    const voice = verbKind === "DEP" || verbKind === "SEMIDEP" ? "" : v.voice;
    return formatFields([
      f("V", POS_WIDTH),
      f(v.decl?.[0] ?? 0, DECL_WIDTH),
      f(v.decl?.[1] ?? 0, DECL_WIDTH),
      f(v.tense, TENSE_WIDTH),
      f(voice, VOICE_WIDTH),
      f(v.mood, MOOD_WIDTH),
      f(v.person, PERSON_WIDTH),
      f(v.number, TERMINAL_WIDTH),
    ]).trimEnd();
  }
  // VPAR: POS + con + case/number/gender + tense(5) + voice(8) + PPL
  if (v.pofs === "VPAR") {
    const voice = verbKind === "DEP" || verbKind === "SEMIDEP" ? "" : v.voice;
    return formatFields([
      f("VPAR", POS_WIDTH),
      f(v.decl?.[0] ?? 0, DECL_WIDTH),
      f(v.decl?.[1] ?? 0, DECL_WIDTH),
      f(v.cs, CASE_WIDTH),
      f(v.number, NUMBER_WIDTH),
      f(v.gender, GENDER_WIDTH),
      f(v.tense, TENSE_WIDTH),
      f(voice, VOICE_WIDTH),
      f("PPL", TERMINAL_WIDTH),
    ]).trimEnd();
  }
  // PREP/CONJ/INTERJ: simple
  if (v.pofs === "PREP") return `PREP   ${v.cs}`;
  if (v.pofs === "CONJ") return "CONJ";
  if (v.pofs === "INTERJ") return "INTERJ";
  return v.pofs;
}

function formatFlags(de: DictionaryEntry): string {
  const t = de.tran;
  let flags = `[${t.age}${t.area}${t.geo}${t.freq}${t.source}]`;
  const age = formatDictAge(t.age);
  const freq = formatFrequency(t.freq);
  if (age || freq) {
    flags += `    ${[age, freq].filter(Boolean).join("  ")}`;
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Age and frequency label tables (Ada's Dictionary_Age/Inflection_Age/Dictionary_Frequency arrays)
// ---------------------------------------------------------------------------

/** Ada's Dictionary_Age labels — used on dictionary form lines. */
const DICT_AGE: Record<string, string> = {
  A: "Archaic",
  B: "Early",
  D: "Late",
  E: "Later",
  F: "Medieval",
  G: "NeoLatin",
  H: "Modern",
};

/** Ada's Inflection_Age labels — used on inflection lines. */
const INFL_AGE: Record<string, string> = {
  A: "Archaic",
  B: "Early",
  D: "Late",
  E: "Later",
  F: "Medieval",
  G: "Scholar",
  H: "Modern",
};

/** Ada's Dictionary_Frequency labels. */
const DICT_FREQ: Record<string, string> = {
  D: "lesser",
  E: "uncommon",
  F: "veryrare",
  I: "inscript",
  M: "graffiti",
  N: "Pliny",
};

function formatDictAge(age: string): string {
  return DICT_AGE[age] ?? "";
}

function formatAge(age: string): string {
  return INFL_AGE[age] ?? "";
}

function formatFrequency(freq: string): string {
  return DICT_FREQ[freq] ?? "";
}

/** Truncate each line of a meaning to Ada's Max_Meaning_Print_Size. */
function truncateMeaning(s: string): string {
  return s
    .split("\n")
    .map((line) => (line.length > MAX_MEANING_SIZE ? line.slice(0, MAX_MEANING_SIZE) : line))
    .join("\n");
}

function padRight(s: string, width: number): string {
  if (s.length >= width) return `${s} `;
  return s + " ".repeat(width - s.length);
}
