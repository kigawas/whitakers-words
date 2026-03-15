import type {
  AdjectiveEntry,
  AdverbEntry,
  DictionaryEntry,
  NounEntry,
  NumeralEntry,
  PartEntry,
  PrepositionEntry,
  PronounEntry,
  PropackEntry,
  Stems,
  TranslationRecord,
  VerbEntry,
} from "../types/dictionary.js";
import type {
  Age,
  Area,
  Case,
  Comparison,
  Frequency,
  Gender,
  Geo,
  NounKind,
  NumeralSort,
  NumeralValue,
  PronounKind,
  Source,
  Variant,
  VerbKind,
  Which,
} from "../types/enums.js";
import type { DecnRecord } from "../types/inflections.js";
import { parsePofs } from "./pofs-map.js";

// ---------------------------------------------------------------------------
// Column layout (derived from Ada Default_Width constants)
//
// 4 stems × (18 + 1 space) = 76 chars  (cols 0..75)
// Part_Entry: 23 chars                  (cols 76..98)
//   POS: 6 chars, space, POS-specific: up to 16 chars (Numeral is largest)
// Space separator                       (col 99)
// Translation: 9 chars                  (cols 100..108)
//   Age(1) Space Area(1) Space Geo(1) Space Freq(1) Space Source(1)
// Space separator                       (col 109)
// Meaning: up to 80 chars              (cols 110..189)
// ---------------------------------------------------------------------------

const STEM_SIZE = 18;
const STEMS_TOTAL = 4 * (STEM_SIZE + 1); // 76
const POS_WIDTH = 6;
const PART_ENTRY_WIDTH = 23; // POS(6) + 1 + largest variant (Numeral=16)
const TRAN_WIDTH = 9;

function trimStem(s: string): string {
  return s.trimEnd();
}

function parseDecn(s: string): DecnRecord {
  // "N V" where N=which, V=variant, separated by space, total 3 chars
  const which = Number.parseInt(s.charAt(0), 10) as Which;
  const v = Number.parseInt(s.charAt(2), 10) as Variant;
  return { which, var: v };
}

function parsePartEntry(s: string): PartEntry {
  // s is 23 chars: POS(6) + space + variant-specific(16)
  const pofs = parsePofs(s.slice(0, POS_WIDTH));
  const rest = s.slice(POS_WIDTH + 1); // 16 chars

  switch (pofs) {
    case "N": {
      const decl = parseDecn(rest);
      const gender = rest.charAt(4).trimEnd() as Gender;
      const kind = rest.charAt(6).trimEnd() as NounKind;
      return { pofs: "N", n: { decl, gender, kind } satisfies NounEntry };
    }
    case "PRON": {
      const decl = parseDecn(rest);
      const kind = rest.slice(4).trimEnd() as PronounKind;
      return { pofs: "PRON", pron: { decl, kind } satisfies PronounEntry };
    }
    case "PACK": {
      const decl = parseDecn(rest);
      const kind = rest.slice(4).trimEnd() as PronounKind;
      return { pofs: "PACK", pack: { decl, kind } satisfies PropackEntry };
    }
    case "ADJ": {
      const decl = parseDecn(rest);
      const co = rest.slice(4).trimEnd() as Comparison;
      return { pofs: "ADJ", adj: { decl, co } satisfies AdjectiveEntry };
    }
    case "ADV": {
      const co = rest.trimEnd() as Comparison;
      return { pofs: "ADV", adv: { co } satisfies AdverbEntry };
    }
    case "V": {
      const decl = parseDecn(rest);
      const kind = rest.slice(4).trimEnd() as VerbKind;
      return { pofs: "V", v: { con: decl, kind } satisfies VerbEntry };
    }
    case "NUM": {
      const decl = parseDecn(rest);
      const sort = rest.slice(4, 10).trimEnd() as NumeralSort;
      const value = Number.parseInt(rest.slice(11).trimEnd(), 10) as NumeralValue;
      return {
        pofs: "NUM",
        num: { decl, sort, value: Number.isNaN(value) ? 0 : value } satisfies NumeralEntry,
      };
    }
    case "PREP": {
      const obj = rest.trimEnd() as Case;
      return { pofs: "PREP", prep: { obj } satisfies PrepositionEntry };
    }
    case "CONJ":
      return { pofs: "CONJ" };
    case "INTERJ":
      return { pofs: "INTERJ" };
    case "VPAR":
      return { pofs: "VPAR" };
    case "SUPINE":
      return { pofs: "SUPINE" };
    case "TACKON":
      return { pofs: "TACKON" };
    case "PREFIX":
      return { pofs: "PREFIX" };
    case "SUFFIX":
      return { pofs: "SUFFIX" };
    case "X":
      return { pofs: "X" };
  }
}

function parseTranslation(s: string): TranslationRecord {
  // "A A A A A" — 5 single-char fields separated by spaces = 9 chars
  return {
    age: s.charAt(0) as Age,
    area: s.charAt(2) as Area,
    geo: s.charAt(4) as Geo,
    freq: s.charAt(6) as Frequency,
    source: s.charAt(8) as Source,
  };
}

export function parseDictLine(line: string): DictionaryEntry {
  // Parse 4 stems
  const stems: [string, string, string, string] = [
    trimStem(line.slice(0, STEM_SIZE)),
    trimStem(line.slice(19, 19 + STEM_SIZE)),
    trimStem(line.slice(38, 38 + STEM_SIZE)),
    trimStem(line.slice(57, 57 + STEM_SIZE)),
  ];

  const partStart = STEMS_TOTAL; // 76
  const part = parsePartEntry(line.slice(partStart, partStart + PART_ENTRY_WIDTH));

  const tranStart = partStart + PART_ENTRY_WIDTH + 1; // 100
  const tran = parseTranslation(line.slice(tranStart, tranStart + TRAN_WIDTH));

  const meanStart = tranStart + TRAN_WIDTH + 1; // 110
  const mean = line.slice(meanStart).trimEnd();

  return { stems: stems as Stems, part, tran, mean };
}

export function parseDictFile(content: string): DictionaryEntry[] {
  const lines = content.split("\n");
  const entries: DictionaryEntry[] = [];
  for (const line of lines) {
    if (line.length < STEMS_TOTAL + POS_WIDTH) continue; // skip empty/short lines
    entries.push(parseDictLine(line));
  }
  return entries;
}
