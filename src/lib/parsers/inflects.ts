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
  Variant,
  Voice,
  Which,
} from "../types/enums.js";
import type {
  AdjectiveRecord,
  AdverbRecord,
  DecnRecord,
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
import { parsePofs } from "./pofs-map.js";

// ---------------------------------------------------------------------------
// INFLECTS.LAT parser
//
// Lines are space-delimited with POS-specific fields. Comments start with --.
// Format varies by POS:
//   N     1 1 NOM S C  1 1 a         X A
//   V     1 1 PRES  ACTIVE  IND  1 S  1 1 o             X A
//   ADJ   1 1 NOM S M POS   1 2 us    X A
//   ADV    X 1 0         X A
//   PREP   ABL 1 0       X A
//   CONJ   1 0           X A
//   INTERJ 1 0           X A
//   VPAR 1 0 NOM S X PRES ACTIVE  PPL 1 3 ans          X A
//   SUPINE 0 0 ACC S N  4 2 um                          X A
//   NUM    1 1 NOM S M CARD     1 2 us                  X A
//   PRON  1 0 GEN S X   2 3 jus                         X A
// ---------------------------------------------------------------------------

function isComment(line: string): boolean {
  const trimmed = line.trimStart();
  return trimmed.startsWith("--") || trimmed.length === 0;
}

/** Split a line into tokens, stripping inline comments. */
function tokenize(line: string): string[] {
  const commentIdx = line.indexOf("--");
  const effective = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  return effective.split(/\s+/).filter((t) => t.length > 0);
}

function parseDecn(tokens: string[], offset: number): [DecnRecord, number] {
  const which = Number.parseInt(tokens[offset] ?? "0", 10) as Which;
  const v = Number.parseInt(tokens[offset + 1] ?? "0", 10) as Variant;
  return [{ which, var: v }, offset + 2];
}

function parseEnding(tokens: string[], offset: number): [EndingRecord, number] {
  const _key = Number.parseInt(tokens[offset] ?? "0", 10);
  const size = Number.parseInt(tokens[offset + 1] ?? "0", 10);
  let suf = "";
  let next = offset + 2;
  if (size > 0 && next < tokens.length) {
    // The ending string is the next token (unless it's the age/freq)
    const candidate = tokens[next] ?? "";
    // Age/Freq tokens are single uppercase letters — endings are lowercase
    if (candidate.length > 1 || (candidate >= "a" && candidate <= "z")) {
      suf = candidate;
      next++;
    }
  }
  return [{ size, suf }, next];
}

function parseAgeFreq(tokens: string[], offset: number): [Age, Frequency] {
  const age = (tokens[offset] ?? "X") as Age;
  const freq = (tokens[offset + 1] ?? "X") as Frequency;
  return [age, freq];
}

function parseInflectionLine(tokens: string[]): InflectionRecord | null {
  if (tokens.length < 3) return null;

  const pofs = parsePofs(tokens[0] ?? "X");
  let qual: QualityRecord;
  let stemKey: StemKey;
  let ending: EndingRecord;
  let age: Age;
  let freq: Frequency;

  switch (pofs) {
    case "N": {
      // N W V CASE NUM GENDER KEY SIZE ENDING AGE FREQ
      const [decl, i1] = parseDecn(tokens, 1);
      const cs = (tokens[i1] ?? "X") as Case;
      const number = (tokens[i1 + 1] ?? "X") as GrammaticalNumber;
      const gender = (tokens[i1 + 2] ?? "X") as Gender;
      stemKey = Number.parseInt(tokens[i1 + 3] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, i1 + 3);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "N", noun: { decl, cs, number, gender } satisfies NounRecord };
      break;
    }
    case "PRON": {
      // PRON W V CASE NUM GENDER KEY SIZE ENDING AGE FREQ
      const [decl, i1] = parseDecn(tokens, 1);
      const cs = (tokens[i1] ?? "X") as Case;
      const number = (tokens[i1 + 1] ?? "X") as GrammaticalNumber;
      const gender = (tokens[i1 + 2] ?? "X") as Gender;
      stemKey = Number.parseInt(tokens[i1 + 3] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, i1 + 3);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "PRON", pron: { decl, cs, number, gender } satisfies PronounRecord };
      break;
    }
    case "PACK": {
      const [decl, i1] = parseDecn(tokens, 1);
      const cs = (tokens[i1] ?? "X") as Case;
      const number = (tokens[i1 + 1] ?? "X") as GrammaticalNumber;
      const gender = (tokens[i1 + 2] ?? "X") as Gender;
      stemKey = Number.parseInt(tokens[i1 + 3] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, i1 + 3);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "PACK", pack: { decl, cs, number, gender } satisfies PropackRecord };
      break;
    }
    case "ADJ": {
      // ADJ W V CASE NUM GENDER COMPARISON KEY SIZE ENDING AGE FREQ
      const [decl, i1] = parseDecn(tokens, 1);
      const cs = (tokens[i1] ?? "X") as Case;
      const number = (tokens[i1 + 1] ?? "X") as GrammaticalNumber;
      const gender = (tokens[i1 + 2] ?? "X") as Gender;
      const comparison = (tokens[i1 + 3] ?? "X") as Comparison;
      stemKey = Number.parseInt(tokens[i1 + 4] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, i1 + 4);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = {
        pofs: "ADJ",
        adj: { decl, cs, number, gender, comparison } satisfies AdjectiveRecord,
      };
      break;
    }
    case "NUM": {
      // NUM W V CASE NUM GENDER SORT KEY SIZE ENDING AGE FREQ
      const [decl, i1] = parseDecn(tokens, 1);
      const cs = (tokens[i1] ?? "X") as Case;
      const number = (tokens[i1 + 1] ?? "X") as GrammaticalNumber;
      const gender = (tokens[i1 + 2] ?? "X") as Gender;
      const sort = (tokens[i1 + 3] ?? "X") as NumeralSort;
      stemKey = Number.parseInt(tokens[i1 + 4] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, i1 + 4);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "NUM", num: { decl, cs, number, gender, sort } satisfies NumeralRecord };
      break;
    }
    case "ADV": {
      // ADV COMPARISON KEY SIZE ENDING AGE FREQ
      const comparison = (tokens[1] ?? "X") as Comparison;
      stemKey = Number.parseInt(tokens[2] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, 2);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "ADV", adv: { comparison } satisfies AdverbRecord };
      break;
    }
    case "V": {
      // V W V TENSE VOICE MOOD PERSON NUM KEY SIZE ENDING AGE FREQ
      const [con, i1] = parseDecn(tokens, 1);
      const tense = (tokens[i1] ?? "X") as Tense;
      const voice = (tokens[i1 + 1] ?? "X") as Voice;
      const mood = (tokens[i1 + 2] ?? "X") as Mood;
      const person = Number.parseInt(tokens[i1 + 3] ?? "0", 10) as Person;
      const number = (tokens[i1 + 4] ?? "X") as GrammaticalNumber;
      stemKey = Number.parseInt(tokens[i1 + 5] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, i1 + 5);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = {
        pofs: "V",
        verb: { con, tenseVoiceMood: { tense, voice, mood }, person, number } satisfies VerbRecord,
      };
      break;
    }
    case "VPAR": {
      // VPAR W V CASE NUM GENDER TENSE VOICE MOOD KEY SIZE ENDING AGE FREQ
      const [con, i1] = parseDecn(tokens, 1);
      const cs = (tokens[i1] ?? "X") as Case;
      const number = (tokens[i1 + 1] ?? "X") as GrammaticalNumber;
      const gender = (tokens[i1 + 2] ?? "X") as Gender;
      const tense = (tokens[i1 + 3] ?? "X") as Tense;
      const voice = (tokens[i1 + 4] ?? "X") as Voice;
      const mood = (tokens[i1 + 5] ?? "X") as Mood;
      stemKey = Number.parseInt(tokens[i1 + 6] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, i1 + 6);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
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
      // SUPINE W V CASE NUM GENDER KEY SIZE ENDING AGE FREQ
      const [con, i1] = parseDecn(tokens, 1);
      const cs = (tokens[i1] ?? "X") as Case;
      const number = (tokens[i1 + 1] ?? "X") as GrammaticalNumber;
      const gender = (tokens[i1 + 2] ?? "X") as Gender;
      stemKey = Number.parseInt(tokens[i1 + 3] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, i1 + 3);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "SUPINE", supine: { con, cs, number, gender } satisfies SupineRecord };
      break;
    }
    case "PREP": {
      // PREP CASE KEY SIZE ENDING AGE FREQ
      const cs = (tokens[1] ?? "X") as Case;
      stemKey = Number.parseInt(tokens[2] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, 2);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "PREP", prep: { cs } satisfies PrepositionRecord };
      break;
    }
    case "CONJ": {
      // CONJ KEY SIZE ENDING AGE FREQ
      stemKey = Number.parseInt(tokens[1] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, 1);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "CONJ" };
      break;
    }
    case "INTERJ": {
      // INTERJ KEY SIZE ENDING AGE FREQ
      stemKey = Number.parseInt(tokens[1] ?? "0", 10) as StemKey;
      const [end, i2] = parseEnding(tokens, 1);
      ending = end;
      [age, freq] = parseAgeFreq(tokens, i2);
      qual = { pofs: "INTERJ" };
      break;
    }
    default:
      return null;
  }

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
