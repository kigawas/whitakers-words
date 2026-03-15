import type { DictionaryEntry, PartEntry } from "../types/dictionary.js";
import type {
  Age,
  Area,
  Case,
  Comparison,
  Frequency,
  Gender,
  Geo,
  GrammaticalNumber,
  Mood,
  NounKind,
  NumeralSort,
  NumeralValue,
  Person,
  PronounKind,
  Source,
  Tense,
  VerbKind,
  Voice,
} from "../types/enums.js";
import type { QualityRecord } from "../types/inflections.js";
import { TokenReader } from "./parse-utils.js";
import { parsePofs } from "./pofs-map.js";

// ---------------------------------------------------------------------------
// UNIQUES.LAT parser
//
// 3 lines per entry (no comments):
//   Line 1: Stem word
//   Line 2: Quality_Record + Kind_Entry + Translation(Age Area Geo Freq Source)
//   Line 3: Meaning
//
// The quality line is space-delimited, format varies by POS.
// ---------------------------------------------------------------------------

export interface UniqueEntry {
  readonly word: string;
  readonly qual: QualityRecord;
  readonly de: DictionaryEntry;
}

function tokenize(line: string): string[] {
  return line
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Parse the quality/kind/translation line of a unique entry.
 * Returns [QualityRecord, PartEntry, TranslationRecord fields, kindData].
 */
function parseQualityLine(line: string): {
  qual: QualityRecord;
  part: PartEntry;
  age: Age;
  area: Area;
  geo: Geo;
  freq: Frequency;
  source: Source;
} {
  const tokens = tokenize(line);
  const pofs = parsePofs(tokens[0] ?? "X");
  const r = new TokenReader(tokens, 1);

  // Translation values are always the last 5 tokens
  const len = tokens.length;
  const age = (tokens[len - 5] ?? "X") as Age;
  const area = (tokens[len - 4] ?? "X") as Area;
  const geo = (tokens[len - 3] ?? "X") as Geo;
  const freq = (tokens[len - 2] ?? "X") as Frequency;
  const source = (tokens[len - 1] ?? "X") as Source;

  switch (pofs) {
    case "N": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      const kind = r.str() as NounKind;
      return {
        qual: { pofs: "N", noun: { decl, cs, number, gender } },
        part: { pofs: "N", n: { decl, gender, kind } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "PRON": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      const kind = r.str() as PronounKind;
      return {
        qual: { pofs: "PRON", pron: { decl, cs, number, gender } },
        part: { pofs: "PRON", pron: { decl, kind } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "PACK": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      const kind = r.str() as PronounKind;
      return {
        qual: { pofs: "PACK", pack: { decl, cs, number, gender } },
        part: { pofs: "PACK", pack: { decl, kind } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "ADJ": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      const comparison = r.str() as Comparison;
      return {
        qual: { pofs: "ADJ", adj: { decl, cs, number, gender, comparison } },
        part: { pofs: "ADJ", adj: { decl, co: comparison } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "NUM": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      const sort = r.str() as NumeralSort;
      const numValue = r.int() as NumeralValue;
      return {
        qual: { pofs: "NUM", num: { decl, cs, number, gender, sort } },
        part: { pofs: "NUM", num: { decl, sort, value: Number.isNaN(numValue) ? 0 : numValue } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "ADV": {
      const comparison = r.str() as Comparison;
      return {
        qual: { pofs: "ADV", adv: { comparison } },
        part: { pofs: "ADV", adv: { co: comparison } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "V": {
      const con = r.decn();
      const tense = r.str() as Tense;
      const voice = r.str() as Voice;
      const mood = r.str() as Mood;
      const person = r.int() as Person;
      const number = r.str() as GrammaticalNumber;
      const kind = r.str() as VerbKind;
      return {
        qual: { pofs: "V", verb: { con, tenseVoiceMood: { tense, voice, mood }, person, number } },
        part: { pofs: "V", v: { con, kind } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    default:
      return {
        qual: { pofs: "X" },
        part: { pofs: "X" },
        age: "X",
        area: "X",
        geo: "X",
        freq: "X",
        source: "X",
      };
  }
}

export function parseUniquesFile(content: string): UniqueEntry[] {
  const lines = content.split("\n");
  const entries: UniqueEntry[] = [];

  let i = 0;
  while (i + 2 < lines.length) {
    const stemLine = (lines[i] ?? "").trim();
    const qualLine = (lines[i + 1] ?? "").trim();
    const meanLine = (lines[i + 2] ?? "").trim();
    i += 3;

    if (stemLine.length === 0 || qualLine.length === 0) continue;

    const { qual, part, age, area, geo, freq, source } = parseQualityLine(qualLine);

    const de: DictionaryEntry = {
      stems: [stemLine, "", "", ""],
      part,
      tran: { age, area, geo, freq, source },
      mean: meanLine,
    };

    entries.push({ word: stemLine, qual, de });
  }

  return entries;
}
