import type { Frequency } from "../types/enums.js";
import type { ParseResult } from "./word-analysis.js";

/**
 * Deduplicate and rank parse results.
 * - Remove exact duplicates (same entryIndex + same inflection details)
 * - Sort by: dictionary frequency (A>B>C>D>E>F), then by POS priority
 * - Filter out disallowed stems (e.g., impersonal verbs only in 3rd person)
 */
export function listSweep(results: ParseResult[]): ParseResult[] {
  // 1. Remove exact duplicates
  const deduped = removeDuplicates(results);

  // 2. Filter impersonal verbs — only 3rd person allowed
  const filtered = deduped.filter((r) => {
    if (r.ir.qual.pofs === "V" && r.de.part.pofs === "V" && r.de.part.v.kind === "IMPERS") {
      return r.ir.qual.verb.person === 3 || r.ir.qual.verb.person === 0;
    }
    return true;
  });

  // 3. Sort by frequency then POS priority
  filtered.sort((a, b) => {
    const freqDiff = freqRank(a.de.tran.freq) - freqRank(b.de.tran.freq);
    if (freqDiff !== 0) return freqDiff;
    return pofsRank(a.ir.qual.pofs) - pofsRank(b.ir.qual.pofs);
  });

  return filtered;
}

/**
 * Two results are duplicates if they have the same entryIndex AND
 * the same inflection key fields.
 */
function removeDuplicates(results: ParseResult[]): ParseResult[] {
  const seen = new Set<string>();
  const out: ParseResult[] = [];

  for (const r of results) {
    const key = dedupeKey(r);
    if (!seen.has(key)) {
      seen.add(key);
      out.push(r);
    }
  }

  return out;
}

function dedupeKey(r: ParseResult): string {
  const q = r.ir.qual;
  const idx = r.entryIndex;

  switch (q.pofs) {
    case "N":
      return `${idx}:N:${q.noun.cs}:${q.noun.number}:${q.noun.gender}`;
    case "PRON":
      return `${idx}:PRON:${q.pron.cs}:${q.pron.number}:${q.pron.gender}`;
    case "PACK":
      return `${idx}:PACK:${q.pack.cs}:${q.pack.number}:${q.pack.gender}`;
    case "ADJ":
      return `${idx}:ADJ:${q.adj.cs}:${q.adj.number}:${q.adj.gender}:${q.adj.comparison}`;
    case "NUM":
      return `${idx}:NUM:${q.num.cs}:${q.num.number}:${q.num.gender}:${q.num.sort}`;
    case "ADV":
      return `${idx}:ADV:${q.adv.comparison}`;
    case "V":
      return `${idx}:V:${q.verb.tenseVoiceMood.tense}:${q.verb.tenseVoiceMood.voice}:${q.verb.tenseVoiceMood.mood}:${q.verb.person}:${q.verb.number}`;
    case "VPAR":
      return `${idx}:VPAR:${q.vpar.cs}:${q.vpar.number}:${q.vpar.gender}:${q.vpar.tenseVoiceMood.tense}:${q.vpar.tenseVoiceMood.voice}:${q.vpar.tenseVoiceMood.mood}`;
    case "SUPINE":
      return `${idx}:SUPINE:${q.supine.cs}:${q.supine.number}:${q.supine.gender}`;
    case "PREP":
      return `${idx}:PREP:${q.prep.cs}`;
    case "CONJ":
      return `${idx}:CONJ`;
    case "INTERJ":
      return `${idx}:INTERJ`;
    default:
      return `${idx}:${q.pofs}:${r.stem}`;
  }
}

/** Lower rank = more common. Frequency A is most common. */
function freqRank(freq: Frequency): number {
  switch (freq) {
    case "A":
      return 0;
    case "B":
      return 1;
    case "C":
      return 2;
    case "D":
      return 3;
    case "E":
      return 4;
    case "F":
      return 5;
    case "I":
      return 6;
    case "M":
      return 7;
    case "N":
      return 8;
    case "X":
      return 9;
    default:
      return 10;
  }
}

/** Lower rank = higher priority. Nouns first, then verbs, adj, etc. */
function pofsRank(pofs: string): number {
  switch (pofs) {
    case "N":
      return 0;
    case "PRON":
      return 1;
    case "PACK":
      return 2;
    case "V":
      return 3;
    case "VPAR":
      return 4;
    case "SUPINE":
      return 5;
    case "ADJ":
      return 6;
    case "NUM":
      return 7;
    case "ADV":
      return 8;
    case "PREP":
      return 9;
    case "CONJ":
      return 10;
    case "INTERJ":
      return 11;
    default:
      return 12;
  }
}
