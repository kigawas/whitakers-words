import type {
  AdjectiveEntry,
  DictionaryEntry,
  NounEntry,
  NumeralEntry,
  PartEntry,
  VerbEntry,
} from "../types/dictionary.js";
import type { DecnRecord } from "../types/inflections.js";
import { NULL_STEM } from "./field-layout.js";

/**
 * The citation form of a dictionary entry, as Ada's Dictionary_Form builds it
 * (support_utils-dictionary_form.adb): e.g. "aqua, aquae  N (1st) F". Unlike
 * Ada, a part is never cut short at 24 characters, and the pronouns Ada gives
 * no form get a headword ("qui, quae, quod  PRON").
 */
export function dictionaryForm(de: DictionaryEntry): string {
  const part = de.part;
  const s1 = de.stems[0];
  if (part.pofs === "PREP") return `${s1}  PREP  ${part.prep.obj}`;
  if (isBareStem(de)) return `${s1}  ${part.pofs}`;
  const parts = principalParts(de);
  if (!parts) return part.pofs === "PRON" ? pronounHeadword(s1, part.pron.kind, de.mean) : "";
  return `${joinParts(parts)}  ${part.pofs}${formSuffix(part)}`.trim();
}

/**
 * Headwords for the pronouns Ada has no form rule for: the qu- and aliqu-
 * pronouns (PRON 1) and the personal and reflexive ones (PRON 5). Some qu-
 * kinds hold two words, told apart by meaning; the first match wins.
 */
const PRONOUN_HEADWORDS: readonly {
  stem: string;
  kind: string;
  mean?: string;
  form: string;
}[] = [
  { stem: "qu", kind: "REL", form: "qui, quae, quod" },
  { stem: "qu", kind: "INTERR", form: "quis, quid" },
  { stem: "qu", kind: "INDEF", mean: "who/whatever", form: "qui, quae, quod" },
  { stem: "qu", kind: "INDEF", form: "quis, qua, quid" },
  { stem: "qu", kind: "ADJECT", mean: "who?", form: "qui, quae, quod" },
  { stem: "qu", kind: "ADJECT", form: "qui, qua, quod" },
  { stem: "aliqu", kind: "INDEF", form: "aliquis, aliqua, aliquid" },
  { stem: "aliqu", kind: "ADJECT", form: "aliqui, aliqua, aliquod" },
  { stem: "ego", kind: "PERS", form: "ego" },
  { stem: "tu", kind: "PERS", form: "tu" },
  { stem: "n", kind: "PERS", form: "nos" },
  { stem: "v", kind: "PERS", form: "vos" },
  // sui has no nominative, so no stem 1
  { stem: NULL_STEM, kind: "REFLEX", form: "sui" },
];

function pronounHeadword(stem: string, kind: string, mean: string): string {
  const headword = PRONOUN_HEADWORDS.find(
    (h) => h.stem === stem && h.kind === kind && (!h.mean || mean.startsWith(h.mean)),
  );
  return headword ? `${headword.form}  PRON` : "";
}

/** An entry's principal parts, Ada's Ox (1 .. 4); undefined leaves one out. */
type Parts = readonly (string | undefined)[];

/**
 * Ada prints an entry with only stem 1 as that stem (uniques, CONJ, INTERJ,
 * one-stem numerals), except the kinds that decline from it: undeclined and
 * abbreviated nouns, adjectives and verbs, and COMP- or SUPER-only adjectives.
 */
function isBareStem(de: DictionaryEntry): boolean {
  const [, s2, s3, s4] = de.stems;
  if (s2 || s3 || s4) return false;
  const part = de.part;
  switch (part.pofs) {
    case "N":
      return part.n.decl.which !== 9;
    case "ADJ":
      return part.adj.decl.which !== 9 && part.adj.co !== "COMP" && part.adj.co !== "SUPER";
    case "V":
      return part.v.con.which !== 9 || (part.v.con.var !== 8 && part.v.con.var !== 9);
    default:
      return true;
  }
}

/** The parts by part of speech; undefined where Ada has no rule (its Not_Found). */
function principalParts(de: DictionaryEntry): Parts | undefined {
  const part = de.part;
  const s = de.stems;
  switch (part.pofs) {
    case "N":
      return nounParts(s, part.n);
    case "PRON":
      return pronounParts(s, part.pron.decl);
    case "ADJ":
      return adjectiveParts(s, part.adj);
    case "ADV":
      return part.adv.co === "X" ? [s[0], s[1], s[2]] : [s[0]];
    case "V":
      return verbParts(s, part.v);
    case "NUM":
      return numeralParts(s, part.num);
    default:
      return [s[0]];
  }
}

/**
 * Ada's clean-up of the parts: one built on a zzz stem prints as "-", an
 * unset or empty one not at all. Each part after the first brings its comma.
 */
function joinParts(parts: Parts): string {
  return parts
    .map((p, i) => {
      if (!p) return "";
      const text = p.startsWith(NULL_STEM) ? "-" : p;
      return i === 0 ? text : `, ${text}`;
    })
    .join("");
}

/** What follows the part of speech: a noun's declension and gender, a verb's conjugation and kind. */
function formSuffix(part: PartEntry): string {
  if (part.pofs === "V") return verbSuffix(part.v);
  if (part.pofs !== "N") return "";
  const { which, var: variant } = part.n.decl;
  const decl = which >= 1 && which <= 5 && variant >= 1 && variant <= 5;
  return `${decl ? ` (${ORDINALS[which]})` : ""} ${part.n.gender}`;
}

/** Ada's Fst, for a declension or conjugation known to be 1 to 5. */
const ORDINALS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };

function nounParts([s1, s2]: DictionaryEntry["stems"], n: NounEntry): Parts | undefined {
  const { which, var: variant } = n.decl;
  switch (which) {
    case 1:
    case 2:
    case 4: {
      if (which === 2 && variant === 4) {
        return [`${s1}${n.gender === "N" ? "um" : "us"}`, `${s2}(i)`];
      }
      const endings = NOUN_ENDINGS[`${which} ${variant}`];
      return endings ? [`${s1}${endings[0]}`, `${s2}${endings[1]}`] : [];
    }
    case 3:
      // stem 1 is the nominative
      return [s1, `${s2}${variant === 7 || variant === 9 ? "os/is" : "is"}`];
    case 5:
      return [`${s1}es`, `${s2}ei`];
    case 9:
      if (variant === 8) return [`${s1}.`, "abb."];
      return variant === 9 ? [s1, "undeclined"] : [];
    default:
      return undefined;
  }
}

/** Nominative and genitive endings of declensions 1, 2 and 4, by variant. */
const NOUN_ENDINGS: Record<string, readonly [string, string]> = {
  "1 1": ["a", "ae"],
  "1 6": ["e", "es"],
  "1 7": ["es", "ae"],
  "1 8": ["as", "ae"],
  "2 1": ["us", "i"],
  "2 2": ["um", "i"],
  "2 3": ["", "i"],
  "2 5": ["us", ""],
  "2 6": ["os", "i"],
  "2 7": ["os", "i"],
  "2 8": ["on", "i"],
  "2 9": ["us", "i"],
  "4 1": ["us", "us"],
  "4 2": ["u", "us"],
  "4 3": ["us", "u"],
};

/** The three nominatives of the demonstratives; Ada has no rule for the others. */
function pronounParts(
  [s1, s2]: DictionaryEntry["stems"],
  { which, var: variant }: DecnRecord,
): Parts | undefined {
  switch (which) {
    case 3:
      // hic, haec, hoc
      return [
        `${s1}ic`,
        `${s1}aec`,
        variant === 1 ? `${s1}oc` : variant === 2 ? `${s1}uc` : undefined,
      ];
    case 4:
      // is, ea, id; idem, eadem, idem
      if (variant === 1) return [`${s1}s`, `${s2}a`, `${s1}d`];
      return variant === 2 ? [`${s1}dem`, `${s2}adem`, `${s1}dem`] : [];
    case 6:
      // ille, illa, illud; ipse, ipsa, ipsum
      return [
        `${s1}e`,
        `${s1}a`,
        variant === 1 ? `${s1}ud` : variant === 2 ? `${s1}um` : undefined,
      ];
    case 9:
      if (variant === 8) return [`${s1}.`, "abb."];
      return variant === 9 ? [s1, "undeclined"] : [];
    default:
      return undefined;
  }
}

function adjectiveParts(
  [s1, s2, s3, s4]: DictionaryEntry["stems"],
  adj: AdjectiveEntry,
): Parts | undefined {
  const { which, var: variant } = adj.decl;
  switch (adj.co) {
    case "COMP":
      return [`${s1}or`, `${s1}or`, `${s1}us`];
    case "SUPER":
      return [`${s1}mus`, `${s1}ma`, `${s1}mum`];
    case "POS":
      return positiveParts(s1, s2, which, variant);
    case "X": {
      const comp = `${s3}or -or -us`;
      const sup = `${s4}mus -a -um`;
      switch (`${which} ${variant}`) {
        case "1 1":
          return [`${s1}us`, `${s2}a -um`, comp, sup];
        case "1 2":
          return [s1, `${s2}a -um`, comp, sup];
        case "3 1":
          return [s1, `${s2}is (gen.)`, comp, sup];
        case "3 2":
          return [`${s1}is`, `${s2}e`, comp, sup];
        case "3 3":
          return [s1, `${s2}is -e`, comp, sup];
      }
      if (which === 9) return [s1, "undeclined", comp, sup];
      return which === 1 || which === 3 ? [] : undefined;
    }
  }
}

/** ADJ POS, by declension; 2 x are the Greek adjectives. */
function positiveParts(s1: string, s2: string, which: number, variant: number): Parts | undefined {
  switch (`${which} ${variant}`) {
    case "1 1":
      return [`${s1}us`, `${s2}a`, `${s2}um`];
    case "1 2":
    case "1 4":
      return [s1, `${s2}a`, `${s2}um`];
    case "1 3":
      return [`${s1}us`, `${s2}a`, `${s2}um (gen -ius)`];
    case "1 5":
      return [`${s1}us`, `${s2}a`, `${s2}ud`];
    case "2 1":
      return ["-", `${s1}e`, "-"];
    case "2 2":
      return ["-", "a", "-"];
    case "2 3":
      return [`${s1}es`, `${s1}es`, `${s1}es`];
    case "2 6":
      return [`${s1}os`, `${s1}os`, "-"];
    case "2 7":
      return [`${s1}os`, "-", "-"];
    case "2 8":
      return ["-", "-", `${s2}on`];
    case "3 1":
      return [s1, "(gen.)", `${s2}is`];
    case "3 2":
      return [`${s1}is`, `${s2}is`, `${s2}e`];
    case "3 3":
      return [s1, `${s2}is`, `${s2}e`];
    case "3 6":
      return [s1, "(gen.)", `${s2}os`];
    case "9 8":
      return [`${s1}.`, "abb."];
    case "9 9":
      return [s1, "undeclined"];
  }
  return which === 2 || which === 3 ? [] : undefined;
}

function verbParts(
  [s1, s2, s3, s4]: DictionaryEntry["stems"],
  { con: { which, var: variant }, kind }: VerbEntry,
): Parts | undefined {
  let parts: (string | undefined)[];
  if (kind === "DEP") {
    // No active perfect: the perfect is the participle with sum
    const present = DEPONENT_PRESENT[which];
    if (!present) return undefined;
    const infinitive = which === 3 && variant === 4 ? "iri" : present[1];
    parts = [`${s1}${present[0]}`, `${s2}${infinitive}`, undefined, `${s4}us sum`];
  } else if (kind === "PERFDEF") {
    parts = [`${s3}i`, `${s3}isse`, `${s4}us`];
  } else if (kind === "IMPERS" && s1.startsWith(NULL_STEM) && s2.startsWith(NULL_STEM)) {
    // An impersonal verb found only in the perfect
    parts = [`${s3}it`, `${s3}isse`, `${s4}us est`];
  } else {
    parts = [
      presentPart(s1, which, variant, kind),
      infinitivePart(s1, s2, which, variant),
      ...perfectParts(s3, s4, which, variant, kind),
    ];
  }
  // eo, ire: ivi(ii)
  if (which === 6 && variant === 1) parts[2] = `${parts[2] ?? ""}(ii)`;
  return parts;
}

const DEPONENT_PRESENT: Record<number, readonly [string, string]> = {
  1: ["or", "ari"],
  2: ["eor", "eri"],
  3: ["or", "i"],
};

/** The first part: 1st singular present, or 3rd singular for IMPERS. */
function presentPart(s1: string, which: number, variant: number, kind: string): string | undefined {
  if (which === 9 && variant === 8) return `${s1}.`;
  if (which === 9 && variant === 9) return s1;
  if (kind === "IMPERS") {
    switch (which) {
      case 1:
        return `${s1}at`;
      case 2:
        return `${s1}et`;
      case 3:
        return variant === 2 || s1.endsWith("i") ? `${s1}t` : `${s1}it`;
      case 5:
        return variant === 1 ? `${s1}est` : undefined;
      case 7:
        return variant === 1 || variant === 2 ? `${s1}t` : undefined;
      default:
        return undefined;
    }
  }
  if (which === 2) return `${s1}eo`;
  if (which === 5) return `${s1}um`;
  if (which === 7 && variant === 2) return `${s1}am`;
  return `${s1}o`;
}

function infinitivePart(
  s1: string,
  s2: string,
  which: number,
  variant: number,
): string | undefined {
  switch (which) {
    case 1:
      return `${s2}are`;
    case 2:
      return `${s2}ere`;
    case 3:
      if (variant === 2) return `${s2}re`;
      if (variant === 3) return s2 === "f" ? `${s2}ieri` : `${s2}eri`;
      if (variant === 4) return `${s2}ire`;
      return `${s2}ere`;
    case 5:
      if (variant === 1) return `${s2}esse`;
      return variant === 2 ? `${s1}e` : undefined;
    case 6:
      if (variant === 1) return `${s2}re`;
      return variant === 2 ? `${s2}le` : undefined;
    case 7:
      return variant === 3 ? `${s2}se` : undefined;
    case 8:
      return `${s2}${variant === 1 ? "are" : variant === 4 ? "ire" : "ere"}`;
    case 9:
      if (variant === 8) return "abb.";
      return variant === 9 ? "undeclined" : undefined;
    default:
      return undefined;
  }
}

/** The last two parts: perfect and supine, with Ada's special cases. */
function perfectParts(s3: string, s4: string, which: number, variant: number, kind: string): Parts {
  if (kind === "IMPERS") return [`${s3}it`, `${s4}us est`];
  if (kind === "SEMIDEP") return [undefined, `${s4}us sum`];
  if (which === 5 && variant === 1) return [`${s3}i`, `${s4}urus`];
  if (which === 8) return ["additional", "forms"];
  if (which === 9) return [];
  return [`${s3}i`, `${s4}us`];
}

/** Kinds Ada names after the form, GEN through PERFDEF. */
const SHOWN_VERB_KINDS: ReadonlySet<string> = new Set([
  "GEN",
  "DAT",
  "ABL",
  "TRANS",
  "INTRANS",
  "IMPERS",
  "DEP",
  "SEMIDEP",
  "PERFDEF",
]);

/** " (2nd) IMPERS": the conjugation for var 1 (3 4 is the 4th), then the kind. */
function verbSuffix({ con: { which, var: variant }, kind }: VerbEntry): string {
  let suffix = "";
  if (which >= 1 && which <= 3 && variant === 1) suffix = ` (${ORDINALS[which]})`;
  else if (which === 3 && variant === 4) suffix = ` (${ORDINALS[4]})`;
  return SHOWN_VERB_KINDS.has(kind) ? `${suffix} ${kind}` : suffix;
}

/**
 * A NUM X entry lists the cardinal, ordinal, distributive and adverb; a
 * CARD, ORD or DIST entry declines its one stem.
 */
function numeralParts([s1, s2, s3, s4]: DictionaryEntry["stems"], num: NumeralEntry): Parts {
  const { which, var: variant } = num.decl;
  switch (num.sort) {
    case "X": {
      const rest = [`${s2}us -a -um`, `${s3}i -ae -a`];
      if (which === 2) return [s1, ...rest, `${s4}ie (n)s`];
      if (which !== 1) return [];
      switch (variant) {
        case 1:
          return [`${s1}us -a -um`, ...rest, s4];
        case 2:
          return [`${s1}o -ae o`, ...rest, s4];
        case 3:
          return [`${s1}es -es -ia`, ...rest, s4];
        case 4:
          return [`${s1}i -ae -a`, ...rest, `${s4}ie (n)s`];
      }
      return [];
    }
    case "CARD": {
      if (which === 2) return [s1];
      if (which !== 1) return [];
      const endings = CARDINAL_ENDINGS[variant] ?? [];
      return endings.map((e) => `${s1}${e}`);
    }
    case "ORD":
      return [`${s1}us`, `${s1}a`, `${s1}um`];
    case "DIST":
      return [`${s1}i`, `${s1}ae`, `${s1}a`];
    default:
      return [s1];
  }
}

const CARDINAL_ENDINGS: Record<number, readonly string[]> = {
  1: ["us", "a", "um"],
  2: ["o", "ae", "o"],
  3: ["es", "es", "ia"],
  4: ["i", "ae", "a"],
};
