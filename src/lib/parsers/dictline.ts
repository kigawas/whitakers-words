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
import { FixedReader } from "./parse-utils.js";
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

const STEM_WIDTH = 18;
const STEMS_TOTAL = 4 * (STEM_WIDTH + 1); // 76
const POS_WIDTH = 6;
const PART_ENTRY_WIDTH = 23;

function parsePartEntry(s: string): PartEntry {
  const pofs = parsePofs(s.slice(0, POS_WIDTH));
  const r = new FixedReader(s.slice(POS_WIDTH + 1));

  switch (pofs) {
    case "N": {
      const which = r.field(1);
      r.skip();
      const variant = r.field(1);
      r.skip();
      const gender = r.field(1) as Gender;
      r.skip();
      const kind = r.field(1) as NounKind;
      return {
        pofs: "N",
        n: {
          decl: { which: +which as Which, var: +variant as Variant },
          gender,
          kind,
        } satisfies NounEntry,
      };
    }
    case "PRON": {
      const which = r.field(1);
      r.skip();
      const variant = r.field(1);
      r.skip();
      const kind = r.rest() as PronounKind;
      return {
        pofs: "PRON",
        pron: {
          decl: { which: +which as Which, var: +variant as Variant },
          kind,
        } satisfies PronounEntry,
      };
    }
    case "PACK": {
      const which = r.field(1);
      r.skip();
      const variant = r.field(1);
      r.skip();
      const kind = r.rest() as PronounKind;
      return {
        pofs: "PACK",
        pack: {
          decl: { which: +which as Which, var: +variant as Variant },
          kind,
        } satisfies PropackEntry,
      };
    }
    case "ADJ": {
      const which = r.field(1);
      r.skip();
      const variant = r.field(1);
      r.skip();
      const co = r.rest() as Comparison;
      return {
        pofs: "ADJ",
        adj: {
          decl: { which: +which as Which, var: +variant as Variant },
          co,
        } satisfies AdjectiveEntry,
      };
    }
    case "ADV": {
      const co = r.rest() as Comparison;
      return { pofs: "ADV", adv: { co } satisfies AdverbEntry };
    }
    case "V": {
      const which = r.field(1);
      r.skip();
      const variant = r.field(1);
      r.skip();
      const kind = r.rest() as VerbKind;
      return {
        pofs: "V",
        v: { con: { which: +which as Which, var: +variant as Variant }, kind } satisfies VerbEntry,
      };
    }
    case "NUM": {
      const which = r.field(1);
      r.skip();
      const variant = r.field(1);
      r.skip();
      const sort = r.field(6) as NumeralSort;
      r.skip();
      const value = Number.parseInt(r.rest(), 10) as NumeralValue;
      return {
        pofs: "NUM",
        num: {
          decl: { which: +which as Which, var: +variant as Variant },
          sort,
          value: Number.isNaN(value) ? 0 : value,
        } satisfies NumeralEntry,
      };
    }
    case "PREP": {
      const obj = r.rest() as Case;
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

function parseTranslation(r: FixedReader): TranslationRecord {
  // "A A A A A" — 5 single-char fields separated by spaces = 9 chars
  const age = r.field(1) as Age;
  r.skip();
  const area = r.field(1) as Area;
  r.skip();
  const geo = r.field(1) as Geo;
  r.skip();
  const freq = r.field(1) as Frequency;
  r.skip();
  const source = r.field(1) as Source;
  return { age, area, geo, freq, source };
}

export function parseDictLine(line: string): DictionaryEntry {
  const r = new FixedReader(line);

  // 4 stems × (18 chars + 1 space separator)
  const s0 = r.field(STEM_WIDTH);
  r.skip();
  const s1 = r.field(STEM_WIDTH);
  r.skip();
  const s2 = r.field(STEM_WIDTH);
  r.skip();
  const s3 = r.field(STEM_WIDTH);
  r.skip();
  const stems: [string, string, string, string] = [s0, s1, s2, s3];

  const part = parsePartEntry(line.slice(r.offset, r.offset + PART_ENTRY_WIDTH));
  r.skip(PART_ENTRY_WIDTH + 1); // part + space

  const tran = parseTranslation(r);
  r.skip(); // space

  const mean = r.rest();

  return { stems: stems as Stems, part, tran, mean };
}

export function parseDictFile(content: string): DictionaryEntry[] {
  const lines = content.split("\n");
  const entries: DictionaryEntry[] = [];
  for (const line of lines) {
    if (line.length < STEMS_TOTAL + POS_WIDTH) continue;
    entries.push(parseDictLine(line));
  }
  return entries;
}
