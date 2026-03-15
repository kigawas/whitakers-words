import type { AddonResult } from "../engine/addons-engine.js";
import type { ParseResult } from "../engine/word-analysis.js";
import type { UniqueEntry } from "../parsers/uniques.js";
import type { DictionaryEntry } from "../types/dictionary.js";
import type { QualityRecord } from "../types/inflections.js";
import { dictionaryForm } from "./dictionary-form.js";

export interface WordAnalysisOutput {
  word: string;
  results: readonly ParseResult[];
  uniqueResults: readonly UniqueEntry[];
  addonResults?: readonly AddonResult[];
  trickResults?: readonly ParseResult[];
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
    lines.push(u.de.mean);
  }

  // Group standard results by entryIndex, merge | continuations
  const merged = groupAndMerge(analysis.results);
  for (const group of merged) {
    for (const r of group.results) {
      lines.push(formatInflectionLine(r));
    }
    const first = group.results[0];
    if (first) {
      lines.push(`${dictionaryForm(first.de)}   ${formatFlags(first.de)}`);
      lines.push(group.meaning);
    }
  }

  // Trick results
  if (analysis.trickResults && analysis.trickResults.length > 0) {
    for (const group of groupAndMerge(analysis.trickResults)) {
      for (const r of group.results) {
        lines.push(formatInflectionLine(r));
      }
      const first = group.results[0];
      if (first) {
        lines.push(`${dictionaryForm(first.de)}   ${formatFlags(first.de)}`);
        lines.push(group.meaning);
      }
    }
  }

  // Addon results
  if (analysis.addonResults) {
    for (const ar of analysis.addonResults) {
      const addonName = ar.type === "tackon" ? ar.addon.word : ar.addon.fix;
      lines.push(`${addonName.padEnd(21)}${ar.type.toUpperCase()}`);
      lines.push(ar.addon.mean);
      for (const group of groupAndMerge(ar.baseResults)) {
        for (const r of group.results) {
          lines.push(formatInflectionLine(r));
        }
        const first = group.results[0];
        if (first) {
          lines.push(`${dictionaryForm(first.de)}   ${formatFlags(first.de)}`);
          lines.push(group.meaning);
        }
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
      if (prev) prev.meaning += ` ${mean.replace(/^\|+/, "")}`;
    } else {
      merged.push({ results: groupResults, meaning: mean });
    }
  }

  return merged;
}

export function formatInflectionLine(r: ParseResult): string {
  const ending = r.ir.ending.suf;
  const stemDot = ending ? `${r.stem}.${ending}` : r.stem;
  const qualStr = formatQualityRecord(r.ir.qual);
  return padRight(stemDot, 21) + qualStr;
}

function formatQualityLine(stem: string, ending: string, qual: QualityRecord): string {
  const stemDot = ending ? `${stem}.${ending}` : stem;
  return padRight(stemDot, 21) + formatQualityRecord(qual);
}

function formatQualityRecord(qual: QualityRecord): string {
  switch (qual.pofs) {
    case "N":
      return `N      ${qual.noun.decl.which} ${qual.noun.decl.var} ${qual.noun.cs} ${qual.noun.number} ${qual.noun.gender}`;
    case "PRON":
      return `PRON   ${qual.pron.decl.which} ${qual.pron.decl.var} ${qual.pron.cs} ${qual.pron.number} ${qual.pron.gender}`;
    case "PACK":
      return `PACK   ${qual.pack.decl.which} ${qual.pack.decl.var} ${qual.pack.cs} ${qual.pack.number} ${qual.pack.gender}`;
    case "ADJ":
      return `ADJ    ${qual.adj.decl.which} ${qual.adj.decl.var} ${qual.adj.cs} ${qual.adj.number} ${qual.adj.gender} ${qual.adj.comparison}`;
    case "NUM":
      return `NUM    ${qual.num.decl.which} ${qual.num.decl.var} ${qual.num.cs} ${qual.num.number} ${qual.num.gender} ${qual.num.sort}`;
    case "ADV":
      return `ADV    ${qual.adv.comparison}`;
    case "V":
      return `V      ${qual.verb.con.which} ${qual.verb.con.var} ${qual.verb.tenseVoiceMood.tense} ${qual.verb.tenseVoiceMood.voice}  ${qual.verb.tenseVoiceMood.mood} ${qual.verb.person} ${qual.verb.number}`;
    case "VPAR":
      return `VPAR   ${qual.vpar.con.which} ${qual.vpar.con.var} ${qual.vpar.cs} ${qual.vpar.number} ${qual.vpar.gender} ${qual.vpar.tenseVoiceMood.tense} ${qual.vpar.tenseVoiceMood.voice}  PPL`;
    case "SUPINE":
      return `SUPINE ${qual.supine.con.which} ${qual.supine.con.var} ${qual.supine.cs} ${qual.supine.number} ${qual.supine.gender}`;
    case "PREP":
      return `PREP   ${qual.prep.cs}`;
    case "CONJ":
      return "CONJ";
    case "INTERJ":
      return "INTERJ";
    default:
      return qual.pofs;
  }
}

function formatFlags(de: DictionaryEntry): string {
  const t = de.tran;
  return `[${t.age}${t.area}${t.geo}${t.freq}${t.source}]`;
}

function padRight(s: string, width: number): string {
  if (s.length >= width) return `${s} `;
  return s + " ".repeat(width - s.length);
}
