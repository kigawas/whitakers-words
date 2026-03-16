import type {
  Age,
  Case,
  Comparison,
  Frequency,
  Gender,
  GrammaticalNumber,
  Mood,
  NumeralSort,
  Person,
  StemKey,
  Tense,
  Voice,
} from "../types/enums.js";
import type {
  AdjectiveRecord,
  AdverbRecord,
  EndingRecord,
  InflectionRecord,
  NounRecord,
  NumeralRecord,
  PrepositionRecord,
  PronounRecord,
  PropackRecord,
  QualityRecord,
  SupineRecord,
  VerbRecord,
  VparRecord,
} from "../types/inflections.js";
import { TokenReader } from "./parse-utils.js";
import { parsePofs } from "./pofs-map.js";

// ---------------------------------------------------------------------------
// INFLECTS.LAT parser
//
// Lines are space-delimited with POS-specific fields. Comments start with --.
// ---------------------------------------------------------------------------

function isComment(line: string): boolean {
  const trimmed = line.trimStart();
  return trimmed.startsWith("--") || trimmed.length === 0;
}

function tokenize(line: string): string[] {
  const commentIdx = line.indexOf("--");
  const effective = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  return effective.split(/\s+/).filter((t) => t.length > 0);
}

/** Parse KEY + SIZE + optional ENDING from token stream. */
function parseEnding(r: TokenReader): { stemKey: StemKey; ending: EndingRecord } {
  const stemKey = r.int() as StemKey;
  const size = r.int();
  let suf = "";
  if (size > 0 && r.remaining > 0) {
    const candidate = r.peek();
    // Age/Freq tokens are single uppercase letters — endings are lowercase
    if (candidate.length > 1 || (candidate >= "a" && candidate <= "z")) {
      suf = r.str();
    }
  }
  return { stemKey, ending: { size, suf } };
}

function parseInflectionLine(tokens: string[]): InflectionRecord | null {
  if (tokens.length < 3) return null;

  const pofs = parsePofs(tokens[0] ?? "X");
  const r = new TokenReader(tokens, 1);
  let qual: QualityRecord;
  let stemKey: StemKey;
  let ending: EndingRecord;

  switch (pofs) {
    case "N": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "N", noun: { decl, cs, number, gender } satisfies NounRecord };
      break;
    }
    case "PRON": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "PRON", pron: { decl, cs, number, gender } satisfies PronounRecord };
      break;
    }
    case "PACK": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "PACK", pack: { decl, cs, number, gender } satisfies PropackRecord };
      break;
    }
    case "ADJ": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      const comparison = r.str() as Comparison;
      ({ stemKey, ending } = parseEnding(r));
      qual = {
        pofs: "ADJ",
        adj: { decl, cs, number, gender, comparison } satisfies AdjectiveRecord,
      };
      break;
    }
    case "NUM": {
      const decl = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      const sort = r.str() as NumeralSort;
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "NUM", num: { decl, cs, number, gender, sort } satisfies NumeralRecord };
      break;
    }
    case "ADV": {
      const comparison = r.str() as Comparison;
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "ADV", adv: { comparison } satisfies AdverbRecord };
      break;
    }
    case "V": {
      const con = r.decn();
      const tense = r.str() as Tense;
      const voice = r.str() as Voice;
      const mood = r.str() as Mood;
      const person = r.int() as Person;
      const number = r.str() as GrammaticalNumber;
      ({ stemKey, ending } = parseEnding(r));
      qual = {
        pofs: "V",
        verb: { con, tenseVoiceMood: { tense, voice, mood }, person, number } satisfies VerbRecord,
      };
      break;
    }
    case "VPAR": {
      const con = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      const tense = r.str() as Tense;
      const voice = r.str() as Voice;
      const mood = r.str() as Mood;
      ({ stemKey, ending } = parseEnding(r));
      qual = {
        pofs: "VPAR",
        vpar: {
          con,
          cs,
          number,
          gender,
          tenseVoiceMood: { tense, voice, mood },
        } satisfies VparRecord,
      };
      break;
    }
    case "SUPINE": {
      const con = r.decn();
      const cs = r.str() as Case;
      const number = r.str() as GrammaticalNumber;
      const gender = r.str() as Gender;
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "SUPINE", supine: { con, cs, number, gender } satisfies SupineRecord };
      break;
    }
    case "PREP": {
      const cs = r.str() as Case;
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "PREP", prep: { cs } satisfies PrepositionRecord };
      break;
    }
    case "CONJ": {
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "CONJ" };
      break;
    }
    case "INTERJ": {
      ({ stemKey, ending } = parseEnding(r));
      qual = { pofs: "INTERJ" };
      break;
    }
    default:
      return null;
  }

  const age = r.str() as Age;
  const freq = r.str() as Frequency;

  return { qual, key: stemKey, ending, age, freq };
}

export function parseInflectsFile(content: string): InflectionRecord[] {
  const lines = content.split("\n");
  const records: InflectionRecord[] = [];
  for (const line of lines) {
    if (isComment(line)) continue;
    const tokens = tokenize(line);
    if (tokens.length === 0) continue;
    const record = parseInflectionLine(tokens);
    if (record) {
      records.push(record);
    }
  }
  return records;
}
