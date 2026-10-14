import type {
  DictionaryEntry,
  NounEntry,
  NumeralEntry,
  PartEntry,
  Stems,
  TranslationRecord,
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
  VerbKind,
} from "../types/enums.js";
import { FixedReader, TokenReader } from "./parse-utils.js";
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
  // Ada's Get skips blanks before each field, so extra ones shift nothing:
  // diptot "N       2 2 N T", verend "N      2 2  N T".
  const t = new TokenReader(s.slice(POS_WIDTH).trim().split(/\s+/));

  switch (pofs) {
    case "N": {
      const decl = t.decn();
      const gender = t.str() as Gender;
      const kind = t.str() as NounKind;
      return { pofs: "N", n: { decl, gender, kind } satisfies NounEntry };
    }
    case "PRON":
      return { pofs: "PRON", pron: { decl: t.decn(), kind: t.str() as PronounKind } };
    case "PACK":
      return { pofs: "PACK", pack: { decl: t.decn(), kind: t.str() as PronounKind } };
    case "ADJ":
      return { pofs: "ADJ", adj: { decl: t.decn(), co: t.str() as Comparison } };
    case "ADV":
      return { pofs: "ADV", adv: { co: t.str() as Comparison } };
    case "V":
      return { pofs: "V", v: { con: t.decn(), kind: t.str() as VerbKind } };
    case "NUM": {
      const decl = t.decn();
      const sort = t.str() as NumeralSort;
      const value = t.int() as NumeralValue;
      return { pofs: "NUM", num: { decl, sort, value } satisfies NumeralEntry };
    }
    case "PREP":
      return { pofs: "PREP", prep: { obj: t.str() as Case } };
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
