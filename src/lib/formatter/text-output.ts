import type { AddonResult, TackonResult } from "../engine/addons-engine.js";
import type { CompoundResult } from "../engine/compounds.js";
import type { RomanNumeralResult } from "../engine/engine.js";
import { type EntryOrder, rank } from "../engine/list-sweep.js";
import type { SluryResult } from "../engine/slury.js";
import type { SyncopeResult } from "../engine/syncope.js";
import type { TwoWordResult } from "../engine/two-words.js";
import type { ParseResult } from "../engine/word-analysis.js";
import type { UniqueEntry } from "../parsers/uniques.js";
import type { DictionaryEntry } from "../types/dictionary.js";
import type { NumeralSort } from "../types/enums.js";
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
  /** The order the results are in (default "dictionary"), kept where readings sort together. */
  entryOrder?: EntryOrder;
}

/**
 * Format a word analysis into human-readable text.
 * Groups inflections by dictionary entry (same entryIndex),
 * then shows dictionary form and meaning once per group.
 */
export function formatWordAnalysis(analysis: WordAnalysisOutput): string {
  const lines: string[] = [];
  const order = analysis.entryOrder ?? "dictionary";

  // The word as Ada's Word reads it: uniques, packons, then the dictionary
  // readings, grouped by entry, merging | continuations and variant entries.
  const compound = analysis.compoundResults?.[0];
  const addons = analysis.addonResults ?? [];
  const reading = {
    uniques: analysis.uniqueResults,
    results: analysis.results,
    addons: addons.filter(isPackon),
  };
  pushReading(lines, reading, order, NO_SET, compound);

  // Roman numeral result
  if (analysis.romanNumeralResult) {
    const w = analysis.word.toLowerCase();
    lines.push(`${padRight(w, STEM_DOT_WIDTH)}NUM    2 0 X   X X CARD`);
    lines.push(`${analysis.romanNumeralResult.value}  as a ROMAN NUMERAL;`);
  }

  // Ada prints a syncope's explanation once per word (Put_Word_Meaning's
  // Used_Meanings), so the word's own syncope leaves it to a slur's
  let syncopeExplained = false;
  const pushSyncope = (syncope: SyncopeResult) => {
    lines.push(padRight(syncope.label, STEM_DOT_WIDTH));
    if (!syncopeExplained) lines.push(syncope.explanation);
    syncopeExplained = true;
    for (const block of mergeByMeaning(groupAndMerge(syncope.results), order)) {
      lines.push(...block);
    }
  };

  // Slury (prefix assimilation) annotations and results
  if (analysis.sluryResult) {
    lines.push(padRight(analysis.sluryResult.label, STEM_DOT_WIDTH));
    lines.push(analysis.sluryResult.explanation);
    if (analysis.sluryResult.results.length > 0) {
      for (const block of mergeByMeaning(groupAndMerge(analysis.sluryResult.results), order)) {
        lines.push(...block);
      }
    }
    if (analysis.sluryResult.syncope) pushSyncope(analysis.sluryResult.syncope);
  }

  // Trick results with annotations
  if (analysis.trickAnnotations) {
    for (const ann of analysis.trickAnnotations) {
      lines.push(ann);
    }
  }
  if (analysis.trickResults && analysis.trickResults.length > 0) {
    for (const block of mergeByMeaning(groupAndMerge(analysis.trickResults), order)) {
      lines.push(...block);
    }
  }

  // Syncope results
  if (analysis.syncopeResult) pushSyncope(analysis.syncopeResult);

  // Two words. Ada's Two_Words (tricks.adb:551-588) puts both halves in one
  // parse array with no fix line between them, so the right half's first set
  // sorts with the left half's last (lenaeum: eum's is before lena).
  if (analysis.twoWordResult) {
    const tw = analysis.twoWordResult;
    lines.push(padRight(tw.label, STEM_DOT_WIDTH));
    lines.push(tw.explanation);
    const left = { uniques: tw.leftUniques, results: tw.leftResults, addons: tw.leftAddons };
    const [first, rest] = splitFirstSet({
      uniques: tw.rightUniques,
      results: tw.rightResults,
      addons: tw.rightAddons,
    });
    pushReading(lines, left, order, first);
    pushReading(lines, rest, order, NO_SET);
  }

  // Addon results
  for (const ar of addons.filter((a) => !isPackon(a))) pushAddon(lines, ar, order);

  return lines.join("\n");
}

/** Readings that Ada's List_Sweep sorts as one set: those between two fix lines. */
interface SweepSet {
  readonly uniques: readonly UniqueEntry[];
  readonly results: readonly ParseResult[];
}

/** A word as Ada's Word reads it: uniques, packons or tackons, dictionary readings. */
interface Reading extends SweepSet {
  readonly addons: readonly TackonResult[];
}

const NO_SET: SweepSet = { uniques: [], results: [] };

/** A packon, which Ada's Word reads before a qu- word's dictionary readings. */
const isPackon = (ar: AddonResult): ar is TackonResult =>
  ar.type === "tackon" && ar.addon.base.pofs === "PACK";

/**
 * A reading in Ada's order. Ada's Word reads a word's uniques, then its
 * packons (Qu, word_package.adb:1755) or tackons, then its dictionary
 * readings, and List_Sweep's Sweeping (list_sweep.adb:529-581) sorts the
 * readings between two fix lines as one set. So the dictionary readings sort
 * with the last addon's base (quamquam: the quam packon, then qu.am and
 * quamquam CONJ by dictionary line), and so do `next`, the readings that
 * follow the reading before another fix line.
 */
function pushReading(
  lines: string[],
  reading: Reading,
  order: EntryOrder,
  next: SweepSet,
  compound?: CompoundResult,
): void {
  const last = reading.addons.at(-1);
  if (!last) {
    pushSet(lines, join(reading, next, order), order, compound);
    return;
  }
  pushUniques(lines, reading.uniques);
  for (const ar of reading.addons.slice(0, -1)) pushAddon(lines, ar, order);
  const rest = join({ uniques: [], results: reading.results }, next, order);
  pushAddon(lines, last, order, rest, compound);
}

/**
 * A reading's first set, the readings before its first fix line, and the
 * rest of it. Without packons or tackons, the whole reading is one set.
 */
function splitFirstSet(reading: Reading): [SweepSet, Reading] {
  if (reading.addons.length === 0) return [reading, { ...NO_SET, addons: [] }];
  return [
    { uniques: reading.uniques, results: [] },
    { ...reading, uniques: [] },
  ];
}

/** Two sets as one: the uniques first, as Ada's sort puts D_K Unique first, then the rest ranked. */
function join(a: SweepSet, b: SweepSet, order: EntryOrder): SweepSet {
  return {
    uniques: [...a.uniques, ...b.uniques],
    results: rank([...a.results, ...b.results], order),
  };
}

/** A set's uniques, then its readings grouped by entry. */
function pushSet(
  lines: string[],
  set: SweepSet,
  order: EntryOrder,
  compound?: CompoundResult,
): void {
  pushUniques(lines, set.uniques);
  const groups = groupAndMerge(set.results, compound?.entryIndex);
  for (const block of mergeByMeaning(groups, order, compound)) lines.push(...block);
}

/**
 * Unique readings. Ada's Load_Uniques switches on the blank part it is filling
 * (line_stuff.adb:527), so every unique entry has part X and its dictionary
 * form is the stem alone: "eodem  X". As in Put_Parse_Details, a form is
 * skipped when it repeats the one before, and a meaning waits until the next
 * entry's differs (eadem: three entries, one form, one meaning).
 */
function pushUniques(lines: string[], uniques: readonly UniqueEntry[]): void {
  uniques.forEach((u, i) => {
    lines.push(formatQualityLine(u.word, "", u.qual));
    if (u.de.stems[0] !== uniques[i - 1]?.de.stems[0]) {
      lines.push(`${u.de.stems[0]}  X   ${formatFlags(u.de)}`);
    }
    if (u.de.mean !== uniques[i + 1]?.de.mean) lines.push(truncateMeaning(u.de.mean));
  });
}

/**
 * An addon, then its base read as a word, with `next` sorted into the base's
 * last set.
 */
function pushAddon(
  lines: string[],
  ar: AddonResult,
  order: EntryOrder,
  next = NO_SET,
  compound?: CompoundResult,
): void {
  const addonName = ar.type === "tackon" ? ar.addon.word : ar.addon.fix;
  lines.push(`${addonName.padEnd(STEM_DOT_WIDTH)}${ar.type.toUpperCase()}`);
  lines.push(truncateMeaning(ar.addon.mean));
  const base =
    ar.type === "tackon"
      ? { uniques: ar.baseUniques ?? [], results: ar.baseResults, addons: ar.baseAddons ?? [] }
      : { uniques: [], results: ar.baseResults, addons: [] };
  pushReading(lines, base, order, next, compound);
}

export interface MergedGroup {
  readonly results: readonly ParseResult[];
  readonly meaning: string;
}

/**
 * Group parse results by entryIndex, then merge DICTLINE continuation
 * entries (meanings starting with "|") into the preceding group. The entry a
 * compound is under (`compoundEntry`) keeps a group of its own: Ada counts the
 * PPL+ line among that entry's lines, so they differ from the entry's before it.
 */
export function groupAndMerge(
  results: readonly ParseResult[],
  compoundEntry?: number,
): MergedGroup[] {
  // Group by entryIndex, preserving order
  const map = new Map<number, ParseResult[]>();
  for (const r of results) {
    let group = map.get(r.entryIndex);
    if (!group) {
      group = [];
      map.set(r.entryIndex, group);
    }
    group.push(r);
  }

  // Merge continuations into the entry before them of the same form; a "|"
  // line with none (poti ADJ, which follows a noun) stands alone, its bars
  // trimmed as in Ada's Trim_Bar.
  const merged: { results: ParseResult[]; meaning: string; form: string }[] = [];
  for (const groupResults of clusterByForm([...map.values()])) {
    const first = groupResults[0];
    if (!first) continue;

    const form = dictionaryForm(first.de);
    const mean = first.de.mean;
    const prev = merged[merged.length - 1];
    if (mean.startsWith("|") && prev?.form === form && first.entryIndex !== compoundEntry) {
      prev.meaning += `\n${mean.replace(/^\|+/, "")}`;
    } else {
      const meaning = numeralMeaning(first) ?? mean.replace(/^\|+/, "");
      merged.push({ results: groupResults, meaning, form });
    }
  }

  return merged.map(({ results, meaning }) => ({ results, meaning }));
}

/** Ada's Constructed_Meaning line for a numeral read as each sort. */
const NUMERAL_MEANING: Partial<Record<NumeralSort, (n: string) => string>> = {
  CARD: (n) => `${n} - (CARD answers 'how many');`,
  ORD: (n) => `${n}th - (ORD, 'in series'); (a/the)${n}th (part) (fract w/pars?);`,
  DIST: (n) => `${n} each/apiece/times/fold/together/at a time - 'how many each'; by ${n}s;`,
  ADVERB: (n) => `${n} times, on${n} occasions - (ADVERB answers 'how often');`,
};

/**
 * Ada's Constructed_Meaning: a numeral with a value prints its value and the
 * sort of its first reading in place of its meaning (unus: " 1 - (CARD
 * answers 'how many');"), with the leading space of Ada's Integer'Image.
 */
function numeralMeaning(r: ParseResult): string | undefined {
  if (r.de.part.pofs !== "NUM" || r.de.part.num.value <= 0) return undefined;
  const n = ` ${r.de.part.num.value}`;
  if (r.ir.qual.pofs !== "NUM") return `Number ${n}`;
  return NUMERAL_MEANING[r.ir.qual.num.sort]?.(n);
}

/**
 * Prints a dictionary line only when its form differs from the previous
 * entry's, as Ada's Put_Parse_Details does ("put at first chance, skip
 * duplicates"). The qu- pronoun entries of one headword ("qui, quae, quod")
 * share a single dictionary line.
 */
class DictionaryLines {
  #lastForm: string | undefined;

  push(out: string[], de: DictionaryEntry): void {
    const form = dictionaryForm(de);
    if (form === this.#lastForm) return;
    this.#lastForm = form;
    out.push(`${form}   ${formatFlags(de)}`);
  }
}

/** The PPL+ lines of a compound under the group's entry, if any. */
function compoundLines(group: MergedGroup, compound: CompoundResult | undefined): string[] {
  return compound && firstEntry(group) === compound.entryIndex ? formatCompoundLine(compound) : [];
}

/**
 * Render a group into output lines: inflection lines + dictionary form + meaning.
 * Ada's Cycle_Over_Pa (list_package.adb:369) ends a run of readings where the
 * part of speech changes, and Put_Parse_Details prints the dictionary line
 * after an entry's first run: infix.i's V reading, infigo's line, then its
 * VPAR readings. A compound under the group's entry prints after its
 * inflection lines, all participles, as the compound keeps only those.
 */
function renderGroup(
  group: MergedGroup,
  dictLines: DictionaryLines,
  compound: CompoundResult | undefined,
  withMeaning: boolean,
): string[] {
  const first = group.results[0] as ParseResult; // groupAndMerge makes no empty group
  const lines = group.results.map(formatInflectionLine);
  const nextRun = group.results.findIndex((r) => r.ir.qual.pofs !== first.ir.qual.pofs);
  const firstRun = nextRun < 0 ? lines.length : nextRun;
  const out = [...lines.slice(0, firstRun), ...compoundLines(group, compound)];
  dictLines.push(out, first.de);
  out.push(...lines.slice(firstRun));
  if (withMeaning) out.push(truncateMeaning(group.meaning));
  return out;
}

/**
 * Move entries that print the same dictionary form next to the first of them,
 * in dictionary order. They are one lemma (jus "gravy" and jus "law"; the qu-
 * pronouns of one headword), which Ada lists in dictionary order under one form
 * line. Ada prints no form for any qu- pronoun, so it keeps them all together.
 */
function clusterByForm(entryGroups: readonly ParseResult[][]): ParseResult[][] {
  const byForm = new Map<string, ParseResult[][]>();
  for (const g of entryGroups) {
    const first = g[0];
    const form = first ? dictionaryForm(first.de) : "";
    let cluster = byForm.get(form);
    if (!cluster) {
      cluster = [];
      byForm.set(form, cluster);
    }
    cluster.push(g);
  }
  const entryIndex = (g: readonly ParseResult[]) => g[0]?.entryIndex ?? 0;
  return [...byForm.values()].flatMap((c) => c.sort((a, b) => entryIndex(a) - entryIndex(b)));
}

const firstEntry = (g: MergedGroup) => g.results[0]?.entryIndex ?? 0;

/**
 * The key each group's inflection lines print under. Ada prints a run of
 * entries with the same lines once, with the first entry, comparing each
 * entry only with the one just before it in dictionary order, and before it
 * blanks a DEP verb's voice. So comitor shares comito's comit.abor line, but
 * miseror, after misereo, keeps its own; so does apiscor, whose VPAR lines
 * follow apio's SUPINE line, and a participle under a PPL+ compound, which
 * Ada counts among its lines. An entry with another between it and the last
 * with its lines prints them again: labos, after laboro, repeats labor's.
 * Ranked by frequency, a word has no Ada order to follow, so entries with
 * the same lines share them wherever they are, as labor and labos do.
 */
function lineKeys(
  groups: readonly MergedGroup[],
  order: EntryOrder,
  compound: CompoundResult | undefined,
): Map<MergedGroup, string> {
  const lines = (g: MergedGroup, line: (r: ParseResult) => string) =>
    [...g.results.map(line), ...compoundLines(g, compound)].join("\n");
  const unblanked = (g: MergedGroup) => lines(g, (r) => inflectionLine(r, ""));
  const onePofs = (g: MergedGroup) => new Set(g.results.map((r) => r.ir.qual.pofs)).size === 1;
  const keys = new Map<MergedGroup, string>();
  let prev: MergedGroup | undefined;
  for (const g of [...groups].sort((a, b) => firstEntry(a) - firstEntry(b))) {
    const prevKey = prev && keys.get(prev);
    const shares =
      prev !== undefined && onePofs(prev) && onePofs(g) && unblanked(prev) === unblanked(g);
    const own = order === "frequency" ? lines(g, formatInflectionLine) : `${firstEntry(g)}`;
    keys.set(g, shares && prevKey ? prevKey : own);
    prev = g;
  }
  return keys;
}

/**
 * Merge groups into rendered blocks, deduplicating in two ways:
 * 1. Groups with identical meanings → show inflection lines once + all dict forms.
 * 2. Groups that share their inflection lines (lineKeys) → show them once + all meanings.
 * Ada shows a run of entries' shared lines once, with each entry's dictionary
 * form and meaning listed below.
 */
function mergeByMeaning(
  groups: MergedGroup[],
  order: EntryOrder,
  compound?: CompoundResult,
): string[][] {
  // First pass: merge groups with identical inflection line sets.
  // This collapses the many PRON "qu" entries with the same DAT/ABL/NOM pattern
  // into a single block with inflection lines shown once and meanings listed after.
  const byInflection = new Map<string, MergedGroup[]>();
  const inflOrder: string[] = [];
  const keys = lineKeys(groups, order, compound);
  for (const g of groups) {
    const key = keys.get(g) ?? "";
    let bucket = byInflection.get(key);
    if (!bucket) {
      bucket = [];
      byInflection.set(key, bucket);
      inflOrder.push(key);
    }
    bucket.push(g);
  }

  // Ada lists a verb's entries in dictionary order and prints the lines with
  // the first, whose kind decides a DEP verb's voice (comito before comitor).
  const buckets = inflOrder.map((key) => byInflection.get(key) ?? []);
  for (const bucket of buckets) {
    if (bucket.length > 1 && bucket[0]?.results[0]?.de.part.pofs === "V") {
      bucket.sort((a, b) => firstEntry(a) - firstEntry(b));
    }
  }
  const runs = buckets.map(meaningRuns);
  const waits = meaningWaits(runs, groups);

  const blocks: string[][] = [];
  const dictLines = new DictionaryLines();
  for (const [i, sameInflection] of buckets.entries()) {
    if (sameInflection.length === 1 && sameInflection[0]) {
      blocks.push(renderGroup(sameInflection[0], dictLines, compound, !waits[i]));
    } else {
      // Show inflection lines once, then each dict form + meaning.
      const out: string[] = [];
      const seenInflections = new Set<string>();
      for (const r of sameInflection[0]?.results ?? []) {
        const line = formatInflectionLine(r);
        if (!seenInflections.has(line)) {
          seenInflections.add(line);
          out.push(line);
        }
      }
      // Show all unique dict forms of a meaning, then the meaning once. This
      // matches Ada's behavior for variant spellings (attigo/attingo).
      const bucketRuns = runs[i] ?? [];
      for (const [j, run] of bucketRuns.entries()) {
        for (const g of run) {
          const first = g.results[0];
          if (first) dictLines.push(out, first.de);
        }
        const meaning = run[0]?.meaning;
        const last = j === bucketRuns.length - 1;
        if (meaning !== undefined && !(last && waits[i])) out.push(truncateMeaning(meaning));
      }
      blocks.push(out);
    }
  }
  return blocks;
}

/** A bucket's groups gathered by meaning, in the order each meaning first appears. */
function meaningRuns(bucket: readonly MergedGroup[]): MergedGroup[][] {
  const byMeaning = new Map<string, MergedGroup[]>();
  for (const g of bucket) {
    const run = byMeaning.get(g.meaning);
    if (run) run.push(g);
    else byMeaning.set(g.meaning, [g]);
  }
  return [...byMeaning.values()];
}

/**
 * Which buckets leave out their last meaning. Ada's Putting_Meaning
 * (list_package.adb:669-679) prints no meaning for an entry when the next
 * entry's is the same, so a run of such entries prints it once, after the
 * last (merita es: mereo's waits for mereor's). Ada's next entry is the next
 * in dictionary order, and the port can rank by frequency (entryOrder), so a
 * meaning waits only for the next bucket's first when their entries are also
 * next to each other in dictionary order, either way round (mille, millis
 * before mille, milis). A meaning with continuation lines never waits: Ada
 * compares its last line, a | line that no entry's meaning equals.
 */
function meaningWaits(runs: readonly MergedGroup[][][], groups: readonly MergedGroup[]): boolean[] {
  const order = [...new Set(groups.map(firstEntry))].sort((a, b) => a - b);
  const span = (run: readonly MergedGroup[]) => {
    const at = run.map((g) => order.indexOf(firstEntry(g)));
    return [Math.min(...at), Math.max(...at)];
  };
  return runs.map((bucketRuns, i) => {
    const last = bucketRuns.at(-1);
    const next = runs[i + 1]?.[0];
    const meaning = last?.[0]?.meaning;
    if (!last || !next || meaning === undefined || meaning.includes("\n")) return false;
    if (next[0]?.meaning.split("\n")[0] !== meaning) return false;
    const [a0 = 0, a1 = 0] = span(last);
    const [b0 = 0, b1 = 0] = span(next);
    return a1 + 1 === b0 || b1 + 1 === a0;
  });
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
  return inflectionLine(r, r.de.part.pofs === "V" ? r.de.part.v.kind : "");
}

/** An inflection line, with the voice blanked for a verbKind of DEP. */
function inflectionLine(r: ParseResult, verbKind: string): string {
  const ending = r.ir.ending.suf;
  const stemDot = ending ? `${r.stem}.${ending}` : r.stem;
  let line = padRight(stemDot, STEM_DOT_WIDTH) + formatQualityRecord(r.ir.qual, verbKind);
  // Append inflection age and/or frequency tags (Ada behavior).
  // Age is shown for non-default values; frequency is shown for freq >= C
  // (uncommon or rarer) as a warning. Ada's labels are 8 characters wide.
  const age = formatAge(r.ir.age);
  const freq = formatInflFreq(r.ir.freq);
  const tag = (age ? `${age.padEnd(8)}  ${freq}` : freq).trimEnd();
  if (tag) {
    line = `${line.padEnd(AGE_TAG_COLUMN)}  ${tag}`;
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
    // A DEP verb's voice is implied, so Ada's Print_Modified_Qual blanks it;
    // a SEMIDEP verb keeps it
    const voice = verbKind === "DEP" ? "" : v.voice;
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
    const voice = verbKind === "DEP" ? "" : v.voice;
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
  C: "Classic",
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

/** Ada's Inflection_Frequency labels — shown on inflection lines for freq >= C. */
const INFL_FREQ: Record<string, string> = {
  C: "uncommon",
  D: "infreq",
  E: "rare",
  F: "veryrare",
  I: "inscript",
};

function formatAge(age: string): string {
  return INFL_AGE[age] ?? "";
}

function formatInflFreq(freq: string): string {
  return INFL_FREQ[freq] ?? "";
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
