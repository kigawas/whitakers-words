import type {
  AddonsData,
  PrefixEntry,
  PrefixItem,
  SuffixEntry,
  SuffixItem,
  TackonItem,
  TargetEntry,
} from "../types/addons.js";
import type {
  AdjectiveEntry,
  AdverbEntry,
  NounEntry,
  NumeralEntry,
  PartEntry,
  PrepositionEntry,
  PronounEntry,
  PropackEntry,
  VerbEntry,
} from "../types/dictionary.js";
import type {
  Case,
  Comparison,
  Gender,
  NounKind,
  NumeralSort,
  NumeralValue,
  PronounKind,
  StemKey,
  Variant,
  VerbKind,
  Which,
} from "../types/enums.js";
import { parsePofs } from "./pofs-map.js";

// ---------------------------------------------------------------------------
// ADDONS.LAT parser
//
// Format: blocks of 3 lines per entry, interspersed with -- comments.
//   Line 1: TYPE <text> [<connect>]     (TYPE = PREFIX | SUFFIX | TACKON)
//   Line 2: POS-specific entry data
//   Line 3: Meaning
//
// Comments start with --.
// ---------------------------------------------------------------------------

function isComment(line: string): boolean {
  const trimmed = line.trimStart();
  return trimmed.startsWith("--") || trimmed.length === 0;
}

/** Read non-comment lines from an array, advancing the cursor. */
function nextNonCommentLine(lines: string[], cursor: number): [string, number] | null {
  let i = cursor;
  while (i < lines.length) {
    if (!isComment(lines[i] ?? "")) {
      return [lines[i] ?? "", i + 1];
    }
    i++;
  }
  return null;
}

/** Extract fix text and optional connect character from "PREFIX fix [c]" remainder. */
function extractFix(s: string): [string, string] {
  const trimmed = s.trim();
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx < 0) {
    return [trimmed, ""];
  }
  const fix = trimmed.slice(0, spaceIdx);
  const rest = trimmed.slice(spaceIdx).trim();
  return [fix, rest.charAt(0)];
}

/** Tokenize a space-separated line. */
function tokenize(line: string): string[] {
  return line
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

/**
 * Parse a Target_Entry from tokens.
 * A Target_Entry is a POS-discriminated record, same as PartEntry.
 * Returns [TargetEntry, nextOffset].
 */
function parseTargetEntry(tokens: string[], offset: number): TargetEntry {
  const pofs = parsePofs(tokens[offset] ?? "X");

  switch (pofs) {
    case "N": {
      const which = Number.parseInt(tokens[offset + 1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[offset + 2] ?? "0", 10) as Variant;
      const gender = (tokens[offset + 3] ?? "X") as Gender;
      const kind = (tokens[offset + 4] ?? "X") as NounKind;
      return {
        pofs: "N",
        n: {
          decl: { which, var: v },
          gender,
          kind,
        } satisfies NounEntry,
      };
    }
    case "PRON": {
      const which = Number.parseInt(tokens[offset + 1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[offset + 2] ?? "0", 10) as Variant;
      const kind = (tokens[offset + 3] ?? "X") as PronounKind;
      return {
        pofs: "PRON",
        pron: {
          decl: { which, var: v },
          kind,
        } satisfies PronounEntry,
      };
    }
    case "PACK": {
      const which = Number.parseInt(tokens[offset + 1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[offset + 2] ?? "0", 10) as Variant;
      const kind = (tokens[offset + 3] ?? "X") as PronounKind;
      return {
        pofs: "PACK",
        pack: {
          decl: { which, var: v },
          kind,
        } satisfies PropackEntry,
      };
    }
    case "ADJ": {
      const which = Number.parseInt(tokens[offset + 1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[offset + 2] ?? "0", 10) as Variant;
      const co = (tokens[offset + 3] ?? "X") as Comparison;
      return {
        pofs: "ADJ",
        adj: {
          decl: { which, var: v },
          co,
        } satisfies AdjectiveEntry,
      };
    }
    case "NUM": {
      const which = Number.parseInt(tokens[offset + 1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[offset + 2] ?? "0", 10) as Variant;
      const sort = (tokens[offset + 3] ?? "X") as NumeralSort;
      const value = Number.parseInt(tokens[offset + 4] ?? "0", 10) as NumeralValue;
      return {
        pofs: "NUM",
        num: {
          decl: { which, var: v },
          sort,
          value: Number.isNaN(value) ? 0 : value,
        } satisfies NumeralEntry,
      };
    }
    case "ADV": {
      const co = (tokens[offset + 1] ?? "X") as Comparison;
      return {
        pofs: "ADV",
        adv: { co } satisfies AdverbEntry,
      };
    }
    case "V": {
      const which = Number.parseInt(tokens[offset + 1] ?? "0", 10) as Which;
      const v = Number.parseInt(tokens[offset + 2] ?? "0", 10) as Variant;
      const kind = (tokens[offset + 3] ?? "X") as VerbKind;
      return {
        pofs: "V",
        v: {
          con: { which, var: v },
          kind,
        } satisfies VerbEntry,
      };
    }
    case "PREP": {
      const obj = (tokens[offset + 1] ?? "X") as Case;
      return {
        pofs: "PREP",
        prep: { obj } satisfies PrepositionEntry,
      };
    }
    default:
      return { pofs: "X" } satisfies PartEntry;
  }
}

/**
 * Parse a Suffix_Entry from a line.
 * Format: ROOT_POS ROOT_KEY TARGET_ENTRY TARGET_KEY
 * e.g.: "N 2 ADJ 1 1 POS 0"
 */
function parseSuffixEntry(line: string): SuffixEntry {
  const tokens = tokenize(line);
  const root = parsePofs(tokens[0] ?? "X");
  const rootKey = Number.parseInt(tokens[1] ?? "0", 10) as StemKey;

  // Target entry starts at offset 2
  const target = parseTargetEntry(tokens, 2);

  // Target key is the last token
  const targetKey = Number.parseInt(tokens[tokens.length - 1] ?? "0", 10) as StemKey;

  return { root, rootKey, target, targetKey };
}

/**
 * Parse a Prefix_Entry from a line.
 * Format: ROOT_POS TARGET_POS
 * e.g.: "V V", "X X", "PACK PACK"
 */
function parsePrefixEntry(line: string): PrefixEntry {
  const tokens = tokenize(line);
  const root = parsePofs(tokens[0] ?? "X");
  const target = parsePofs(tokens[1] ?? "X");
  return { root, target };
}

export function parseAddonsFile(content: string): AddonsData {
  const lines = content.split("\n");
  const tackons: TackonItem[] = [];
  const packons: TackonItem[] = [];
  const tickons: PrefixItem[] = [];
  const prefixes: PrefixItem[] = [];
  const suffixes: SuffixItem[] = [];

  let cursor = 0;

  while (cursor < lines.length) {
    const result = nextNonCommentLine(lines, cursor);
    if (!result) break;
    const [line1, nextCursor] = result;
    cursor = nextCursor;

    const trimmed = line1.trim();
    let entryType: "TACKON" | "PREFIX" | "SUFFIX";
    let remainder: string;

    if (trimmed.startsWith("TACKON")) {
      entryType = "TACKON";
      remainder = trimmed.slice(6).trim();
    } else if (trimmed.startsWith("PREFIX")) {
      entryType = "PREFIX";
      remainder = trimmed.slice(6).trim();
    } else if (trimmed.startsWith("SUFFIX")) {
      entryType = "SUFFIX";
      remainder = trimmed.slice(6).trim();
    } else {
      continue;
    }

    // Read line 2 (entry data) — may be a comment-skipping read
    const result2 = nextNonCommentLine(lines, cursor);
    if (!result2) break;
    const [line2, nextCursor2] = result2;
    cursor = nextCursor2;

    // Read line 3 (meaning)
    const result3 = nextNonCommentLine(lines, cursor);
    if (!result3) break;
    const [line3, nextCursor3] = result3;
    cursor = nextCursor3;

    const mean = line3.trim();

    switch (entryType) {
      case "TACKON": {
        const word = remainder;
        const base = parseTargetEntry(tokenize(line2), 0);
        const item: TackonItem = { word, base, mean };

        // Classify as PACKON if base is PACK with decl.which 1 or 2
        // and meaning starts with "PACKON w/"
        if (
          base.pofs === "PACK" &&
          "pack" in base &&
          (base.pack.decl.which === 1 || base.pack.decl.which === 2) &&
          mean.startsWith("PACKON w/")
        ) {
          packons.push(item);
        } else {
          tackons.push(item);
        }
        break;
      }
      case "PREFIX": {
        const [fix, connect] = extractFix(remainder);
        const entr = parsePrefixEntry(line2);
        const item: PrefixItem = { fix, connect, entr, mean };

        // Classify as TICKON if root POS is PACK
        if (entr.root === "PACK") {
          tickons.push(item);
        } else {
          prefixes.push(item);
        }
        break;
      }
      case "SUFFIX": {
        const [fix, connect] = extractFix(remainder);
        const entr = parseSuffixEntry(line2);
        suffixes.push({ fix, connect, entr, mean });
        break;
      }
    }
  }

  return { tackons, packons, tickons, prefixes, suffixes };
}
