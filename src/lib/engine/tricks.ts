// ---------------------------------------------------------------------------
// Tricks — spelling transformations for words that fail normal parsing
// ---------------------------------------------------------------------------

export type TrickOp = "flip" | "flip_flop" | "internal" | "double_consonant";

export interface Trick {
  old: string;
  new: string;
  op: TrickOp;
}

// ---------------------------------------------------------------------------
// ANY_TRICKS — internal substitutions applied to all words
// ---------------------------------------------------------------------------

const ANY_TRICKS: readonly Trick[] = [
  { old: "ae", new: "e", op: "internal" },
  { old: "bul", new: "bol", op: "internal" },
  { old: "bol", new: "bul", op: "internal" },
  { old: "cl", new: "cul", op: "internal" },
  { old: "cu", new: "quu", op: "internal" },
  { old: "f", new: "ph", op: "internal" },
  { old: "ph", new: "f", op: "internal" },
  { old: "h", new: "", op: "internal" },
  { old: "oe", new: "e", op: "internal" },
  { old: "vul", new: "vol", op: "internal" },
  { old: "vol", new: "vul", op: "internal" },
  { old: "uol", new: "vul", op: "internal" },
];

// ---------------------------------------------------------------------------
// Character-specific tricks — based on first letter of the word
// ---------------------------------------------------------------------------

const CHAR_TRICKS: Readonly<Record<string, readonly Trick[]>> = {
  a: [
    { old: "adgn", new: "agn", op: "flip_flop" },
    { old: "adsc", new: "asc", op: "flip_flop" },
    { old: "adsp", new: "asp", op: "flip_flop" },
    { old: "arqui", new: "arci", op: "flip_flop" },
    { old: "arqu", new: "arcu", op: "flip_flop" },
    { old: "ae", new: "e", op: "flip" },
    { old: "al", new: "hal", op: "flip" },
    { old: "am", new: "ham", op: "flip" },
    { old: "ar", new: "har", op: "flip" },
    { old: "aur", new: "or", op: "flip" },
  ],
  d: [
    { old: "dampn", new: "damn", op: "flip" },
    { old: "dij", new: "disj", op: "flip_flop" },
    { old: "dir", new: "disr", op: "flip_flop" },
    { old: "dir", new: "der", op: "flip_flop" },
    { old: "del", new: "dil", op: "flip_flop" },
  ],
  e: [
    { old: "ecf", new: "eff", op: "flip_flop" },
    { old: "ecs", new: "exs", op: "flip_flop" },
    { old: "es", new: "ess", op: "flip_flop" },
    { old: "ex", new: "exs", op: "flip_flop" },
    { old: "eid", new: "id", op: "flip" },
    { old: "el", new: "hel", op: "flip" },
    { old: "e", new: "ae", op: "flip" },
  ],
  f: [
    { old: "faen", new: "fen", op: "flip_flop" },
    { old: "faen", new: "foen", op: "flip_flop" },
    { old: "fed", new: "foed", op: "flip_flop" },
    { old: "fet", new: "foet", op: "flip_flop" },
    { old: "f", new: "ph", op: "flip" },
  ],
  g: [{ old: "gna", new: "na", op: "flip" }],
  h: [
    { old: "har", new: "ar", op: "flip" },
    { old: "hal", new: "al", op: "flip" },
    { old: "ham", new: "am", op: "flip" },
    { old: "hel", new: "el", op: "flip" },
    { old: "hol", new: "ol", op: "flip" },
    { old: "hum", new: "um", op: "flip" },
  ],
  k: [{ old: "k", new: "c", op: "flip_flop" }],
  l: [{ old: "lub", new: "lib", op: "flip_flop" }],
  m: [{ old: "mani", new: "manu", op: "flip_flop" }],
  n: [
    { old: "na", new: "gna", op: "flip" },
    { old: "nihil", new: "nil", op: "flip_flop" },
  ],
  o: [
    { old: "obt", new: "opt", op: "flip_flop" },
    { old: "obs", new: "ops", op: "flip_flop" },
    { old: "ol", new: "hol", op: "flip" },
    { old: "opp", new: "op", op: "flip" },
    { old: "or", new: "aur", op: "flip" },
  ],
  p: [
    { old: "ph", new: "f", op: "flip" },
    { old: "pre", new: "prae", op: "flip_flop" },
  ],
  s: [
    { old: "subsc", new: "susc", op: "flip_flop" },
    { old: "subsp", new: "susp", op: "flip_flop" },
    { old: "subc", new: "susc", op: "flip_flop" },
    { old: "succ", new: "susc", op: "flip_flop" },
    { old: "subt", new: "supt", op: "flip_flop" },
    { old: "subt", new: "sust", op: "flip_flop" },
  ],
  t: [{ old: "transv", new: "trav", op: "flip_flop" }],
  u: [
    { old: "ul", new: "hul", op: "flip" },
    { old: "uol", new: "vul", op: "flip" },
  ],
  y: [{ old: "y", new: "i", op: "flip" }],
  z: [{ old: "z", new: "di", op: "flip" }],
};

// ---------------------------------------------------------------------------
// MEDIEVAL_TRICKS — optional internal substitutions
// ---------------------------------------------------------------------------

const MEDIEVAL_TRICKS: readonly Trick[] = [
  { old: "col", new: "caul", op: "internal" },
  { old: "e", new: "ae", op: "internal" },
  { old: "o", new: "u", op: "internal" },
  { old: "i", new: "y", op: "internal" },
  { old: "ism", new: "sm", op: "internal" },
  { old: "isp", new: "sp", op: "internal" },
  { old: "ist", new: "st", op: "internal" },
  { old: "iz", new: "z", op: "internal" },
  { old: "esm", new: "sm", op: "internal" },
  { old: "esp", new: "sp", op: "internal" },
  { old: "est", new: "st", op: "internal" },
  { old: "ez", new: "z", op: "internal" },
  { old: "di", new: "z", op: "internal" },
  { old: "f", new: "ph", op: "internal" },
  { old: "is", new: "ix", op: "internal" },
  { old: "b", new: "p", op: "internal" },
  { old: "d", new: "t", op: "internal" },
  { old: "v", new: "b", op: "internal" },
  { old: "v", new: "f", op: "internal" },
  { old: "s", new: "x", op: "internal" },
  { old: "ci", new: "ti", op: "internal" },
  { old: "nt", new: "nct", op: "internal" },
  { old: "s", new: "ns", op: "internal" },
  { old: "ch", new: "c", op: "internal" },
  { old: "c", new: "ch", op: "internal" },
  { old: "th", new: "t", op: "internal" },
  { old: "t", new: "th", op: "internal" },
];

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Apply a single trick to a word and return all possible transformed strings.
 *
 * - "flip": replace `old` at the START with `new`.
 * - "flip_flop": try old->new AND new->old at the START.
 * - "internal": replace `old` ANYWHERE in the word (each occurrence individually).
 */
export function applyTrick(word: string, trick: Trick): string[] {
  const results: string[] = [];

  switch (trick.op) {
    case "flip": {
      if (word.startsWith(trick.old)) {
        results.push(trick.new + word.slice(trick.old.length));
      }
      break;
    }
    case "flip_flop": {
      if (word.startsWith(trick.old)) {
        results.push(trick.new + word.slice(trick.old.length));
      }
      if (word.startsWith(trick.new)) {
        results.push(trick.old + word.slice(trick.new.length));
      }
      break;
    }
    case "internal": {
      let idx = 0;
      while (idx < word.length) {
        const pos = word.indexOf(trick.old, idx);
        if (pos === -1) break;
        results.push(word.slice(0, pos) + trick.new + word.slice(pos + trick.old.length));
        idx = pos + 1;
      }
      break;
    }
  }

  return results;
}

/**
 * Return the applicable tricks for a word based on its first letter
 * combined with ANY_TRICKS.
 */
export function getTricksForWord(word: string): Trick[] {
  if (word.length === 0) return [];

  const first = word[0];
  if (first === undefined) return [];
  const charTricks = CHAR_TRICKS[first];
  const specific: readonly Trick[] = charTricks ?? [];
  return [...specific, ...ANY_TRICKS];
}

/**
 * Return all medieval trick rules.
 */
export function getMedievalTricks(): Trick[] {
  return [...MEDIEVAL_TRICKS];
}

export interface TrickResult {
  readonly word: string;
  readonly trick: Trick;
}

const VOWELS = new Set(["a", "e", "i", "o", "u"]);

/**
 * Medieval double-consonant trick: find a single consonant between two vowels
 * and try doubling it. E.g., "iritata" → "irritata".
 * Ada's Double_Consonants procedure in Try_Tricks.
 */
function doubleConsonants(word: string): TrickResult[] {
  const results: TrickResult[] = [];
  for (let i = 1; i < word.length - 1; i++) {
    const c = word[i];
    const prev = word[i - 1];
    const next = word[i + 1];
    if (c && prev && next && !VOWELS.has(c) && VOWELS.has(prev) && VOWELS.has(next)) {
      const doubled = word.slice(0, i + 1) + c + word.slice(i + 1);
      results.push({
        word: doubled,
        trick: { old: c, new: c + c, op: "double_consonant" },
      });
    }
  }
  return results;
}

/**
 * Apply all applicable tricks to a word and return transformed words with
 * the trick that produced them. This is the high-level entry point used by the engine.
 */
export function applyTricks(word: string): TrickResult[] {
  const tricks = getTricksForWord(word);
  const seen = new Set<string>();
  const results: TrickResult[] = [];

  for (const trick of tricks) {
    for (const transformed of applyTrick(word, trick)) {
      if (transformed !== word && !seen.has(transformed)) {
        seen.add(transformed);
        results.push({ word: transformed, trick });
      }
    }
  }

  // Medieval: try doubling single consonants between vowels
  for (const tr of doubleConsonants(word)) {
    if (!seen.has(tr.word)) {
      seen.add(tr.word);
      results.push(tr);
    }
  }

  return results;
}

/**
 * Generate Ada-style annotation lines for a trick that was applied.
 * Returns two lines: a short "Word mod" / "Slur" line and a long explanation.
 */
export function trickAnnotation(trick: Trick): string[] {
  if (trick.op === "double_consonant") {
    return [
      `Word mod ${trick.old} -> ${trick.new}`,
      "A doubled consonant may be rendered by just the single  MEDIEVAL",
    ];
  }
  if (trick.op === "internal") {
    return [
      `Word mod ${trick.old}/${trick.new}`,
      `An internal '${trick.old}' might be rendered by '${trick.new}'`,
    ];
  }
  // flip / flip_flop — initial letter tricks
  if (trick.op === "flip_flop") {
    return [
      `Slur ${trick.old}/${trick.new}~`,
      `An initial '${trick.old}' may be rendered by ${trick.new}~`,
    ];
  }
  // flip
  return [
    `Word mod ${trick.old}/${trick.new}`,
    `An initial '${trick.old}' may have replaced usual '${trick.new}'`,
  ];
}
