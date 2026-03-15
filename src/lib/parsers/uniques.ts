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
  Variant,
  VerbKind,
  Voice,
  Which,
} from "../types/enums.js";
import type { QualityRecord } from "../types/inflections.js";
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

  // Default translation values — they're always the last 5 tokens
  const len = tokens.length;
  const age = (tokens[len - 5] ?? "X") as Age;
  const area = (tokens[len - 4] ?? "X") as Area;
  const geo = (tokens[len - 3] ?? "X") as Geo;
  const freq = (tokens[len - 2] ?? "X") as Frequency;
  const source = (tokens[len - 1] ?? "X") as Source;

  switch (pofs) {
    case "N": {
      // N which var CASE NUMBER GENDER kind  age area geo freq source
      const which = Number.parseInt(tokens[1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[2] ?? "0", 10) as Variant;
      const cs = (tokens[3] ?? "X") as Case;
      const number = (tokens[4] ?? "X") as GrammaticalNumber;
      const gender = (tokens[5] ?? "X") as Gender;
      const kind = (tokens[6] ?? "X") as NounKind;
      return {
        qual: {
          pofs: "N",
          noun: { decl: { which, var: v }, cs, number, gender },
        },
        part: { pofs: "N", n: { decl: { which, var: v }, gender, kind } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "PRON": {
      // PRON which var CASE NUMBER GENDER kind  age area geo freq source
      const which = Number.parseInt(tokens[1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[2] ?? "0", 10) as Variant;
      const cs = (tokens[3] ?? "X") as Case;
      const number = (tokens[4] ?? "X") as GrammaticalNumber;
      const gender = (tokens[5] ?? "X") as Gender;
      const kind = (tokens[6] ?? "X") as PronounKind;
      return {
        qual: {
          pofs: "PRON",
          pron: { decl: { which, var: v }, cs, number, gender },
        },
        part: { pofs: "PRON", pron: { decl: { which, var: v }, kind } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "PACK": {
      const which = Number.parseInt(tokens[1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[2] ?? "0", 10) as Variant;
      const cs = (tokens[3] ?? "X") as Case;
      const number = (tokens[4] ?? "X") as GrammaticalNumber;
      const gender = (tokens[5] ?? "X") as Gender;
      const kind = (tokens[6] ?? "X") as PronounKind;
      return {
        qual: {
          pofs: "PACK",
          pack: { decl: { which, var: v }, cs, number, gender },
        },
        part: { pofs: "PACK", pack: { decl: { which, var: v }, kind } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "ADJ": {
      // ADJ which var CASE NUMBER GENDER COMPARISON  age area geo freq source
      const which = Number.parseInt(tokens[1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[2] ?? "0", 10) as Variant;
      const cs = (tokens[3] ?? "X") as Case;
      const number = (tokens[4] ?? "X") as GrammaticalNumber;
      const gender = (tokens[5] ?? "X") as Gender;
      const comparison = (tokens[6] ?? "X") as Comparison;
      return {
        qual: {
          pofs: "ADJ",
          adj: { decl: { which, var: v }, cs, number, gender, comparison },
        },
        part: { pofs: "ADJ", adj: { decl: { which, var: v }, co: comparison } },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "NUM": {
      // NUM which var CASE NUMBER GENDER SORT value  age area geo freq source
      const which = Number.parseInt(tokens[1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[2] ?? "0", 10) as Variant;
      const cs = (tokens[3] ?? "X") as Case;
      const number = (tokens[4] ?? "X") as GrammaticalNumber;
      const gender = (tokens[5] ?? "X") as Gender;
      const sort = (tokens[6] ?? "X") as NumeralSort;
      const numValue = Number.parseInt(tokens[7] ?? "0", 10) as NumeralValue;
      return {
        qual: {
          pofs: "NUM",
          num: { decl: { which, var: v }, cs, number, gender, sort },
        },
        part: {
          pofs: "NUM",
          num: {
            decl: { which, var: v },
            sort,
            value: Number.isNaN(numValue) ? 0 : numValue,
          },
        },
        age,
        area,
        geo,
        freq,
        source,
      };
    }
    case "ADV": {
      // ADV COMPARISON  age area geo freq source
      const comparison = (tokens[1] ?? "X") as Comparison;
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
      // V which var TENSE VOICE MOOD PERSON NUMBER kind  age area geo freq source
      const which = Number.parseInt(tokens[1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[2] ?? "0", 10) as Variant;
      const tense = (tokens[3] ?? "X") as Tense;
      const voice = (tokens[4] ?? "X") as Voice;
      const mood = (tokens[5] ?? "X") as Mood;
      const person = Number.parseInt(tokens[6] ?? "0", 10) as Person;
      const number = (tokens[7] ?? "X") as GrammaticalNumber;
      const kind = (tokens[8] ?? "X") as VerbKind;
      return {
        qual: {
          pofs: "V",
          verb: {
            con: { which, var: v },
            tenseVoiceMood: { tense, voice, mood },
            person,
            number,
          },
        },
        part: { pofs: "V", v: { con: { which, var: v }, kind } },
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
