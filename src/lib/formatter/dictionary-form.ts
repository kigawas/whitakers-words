import type { DictionaryEntry } from "../types/dictionary.js";
import { NULL_STEM } from "./field-layout.js";

/** Check if a stem is present (not empty and not the null stem placeholder). */
function hasStem(s: string): boolean {
  return s.length > 0 && s !== NULL_STEM;
}

/**
 * Generate the citation/dictionary form for a dictionary entry.
 * E.g., "aqua, aquae  N (1st) F" for a 1st declension feminine noun.
 */
export function dictionaryForm(de: DictionaryEntry): string {
  const part = de.part;
  const s = de.stems;

  switch (part.pofs) {
    case "N":
      return formatNoun(s[0], s[1], part.n.decl.which, part.n.decl.var, part.n.gender);
    case "V":
      return formatVerb(s[0], s[1], s[2], s[3], part.v.con.which, part.v.con.var, part.v.kind);
    case "ADJ":
      return formatAdjective(s, part.adj.decl.which, part.adj.decl.var, part.adj.co);
    case "ADV": {
      if (part.adv.co === "X" && (s[1] || s[2])) {
        const parts = [s[0]];
        if (s[1]) parts.push(s[1]);
        if (s[2]) parts.push(s[2]);
        return `${parts.join(", ")}  ADV`;
      }
      return `${s[0]}  ADV`;
    }
    case "PREP":
      return `${s[0]}  PREP  ${part.prep.obj}`;
    case "CONJ":
      return `${s[0]}  CONJ`;
    case "INTERJ":
      return `${s[0]}  INTERJ`;
    case "PRON":
      return formatPronoun(s[0], s[1], part.pron.decl.which, part.pron.decl.var);
    case "PACK":
      return `${s[0]}  PACK`;
    case "NUM":
      return `${s[0]}  NUM`;
    default:
      return s[0];
  }
}

const ORDINALS: Record<number, string> = { 1: "1st", 2: "2nd", 3: "3rd", 4: "4th", 5: "5th" };
function ordinal(which: number): string {
  return ORDINALS[which] ?? "";
}

function formatNoun(
  stem1: string,
  stem2: string,
  which: number,
  variant: number,
  gender: string,
): string {
  let nom: string;
  let gen: string;

  switch (which) {
    case 1:
      switch (variant) {
        case 6:
          nom = `${stem1}e`;
          gen = `${stem2 || stem1}es`;
          break;
        case 7:
          nom = `${stem1}es`;
          gen = `${stem2 || stem1}ae`;
          break;
        case 8:
          nom = `${stem1}as`;
          gen = `${stem2 || stem1}ae`;
          break;
        default:
          nom = `${stem1}a`;
          gen = `${stem2 || stem1}ae`;
          break;
      }
      break;
    case 2:
      switch (variant) {
        case 2:
          nom = `${stem1}um`;
          gen = `${stem2 || stem1}i`;
          break;
        case 3:
          nom = stem1; // stem1 IS the nominative (ager, puer, vir)
          gen = `${stem2 || stem1}i`;
          break;
        case 4:
          nom = stem1 + (gender === "N" ? "um" : "us");
          gen = `${stem2 || stem1}(i)`;
          break;
        case 5:
          nom = `${stem1}us`;
          gen = stem2 || stem1;
          break;
        case 6:
        case 7:
          nom = `${stem1}os`;
          gen = `${stem2 || stem1}i`;
          break;
        case 8:
          nom = `${stem1}on`;
          gen = `${stem2 || stem1}i`;
          break;
        case 9:
          nom = `${stem1}us`;
          gen = `${stem2 || stem1}i`;
          break;
        default:
          nom = `${stem1}us`;
          gen = `${stem2 || stem1}i`;
          break;
      }
      break;
    case 3:
      nom = stem1; // stem1 IS the nominative for 3rd decl
      if (variant === 7 || variant === 9) {
        gen = `${stem2 || stem1}os/is`;
      } else {
        gen = `${stem2 || stem1}is`;
      }
      break;
    case 4:
      switch (variant) {
        case 2:
          nom = `${stem1}u`;
          gen = `${stem2 || stem1}us`;
          break;
        case 3:
          nom = `${stem1}us`;
          gen = `${stem2 || stem1}u`;
          break;
        default:
          nom = `${stem1}us`;
          gen = `${stem2 || stem1}us`;
          break;
      }
      break;
    case 5:
      nom = `${stem1}es`;
      gen = `${stem2 || stem1}ei`;
      break;
    case 9:
      if (variant === 8) {
        nom = `${stem1}.`;
        gen = "abb.";
      } else {
        // var 9 = undeclined
        nom = stem1;
        gen = "undeclined";
      }
      break;
    default:
      nom = stem1;
      gen = `${stem2 || stem1}is`;
      break;
  }

  if (!hasStem(stem1)) nom = "-";

  // Ada shows ordinal only when which 1-5 AND var 1-5
  const showOrdinal = which >= 1 && which <= 5 && variant >= 1 && variant <= 5;
  const declStr = showOrdinal ? ` (${ordinal(which)})` : "";
  return `${nom}, ${gen}  N${declStr} ${gender}`;
}

/**
 * Format pronoun dictionary form following Ada's DICTIONARY_FORM PRON logic.
 * Pronouns display 3 nominative forms (M, F, N) for declensions 3, 4, 6.
 * Declension 9 handles abbreviated and undeclined forms.
 * Other declensions fall back to stem1.
 */
function formatPronoun(stem1: string, stem2: string, which: number, variant: number): string {
  let ox1: string | null = null;
  let ox2: string | null = null;
  let ox3: string | null = null;

  switch (which) {
    case 3:
      // Proximal demonstrative (hic, haec, hoc)
      ox1 = `${stem1}ic`;
      ox2 = `${stem1}aec`;
      ox3 = variant === 1 ? `${stem1}oc` : `${stem1}uc`;
      break;
    case 4:
      if (variant === 1) {
        // is, ea, id
        ox1 = `${stem1}s`;
        ox2 = `${stem2 || stem1}a`;
        ox3 = `${stem1}d`;
      } else if (variant === 2) {
        // idem, eadem, idem
        ox1 = `${stem1}dem`;
        ox2 = `${stem2 || stem1}adem`;
        ox3 = `${stem1}dem`;
      }
      break;
    case 6:
      // Distal/medial demonstrative (ille/iste/olle and ipse)
      ox1 = `${stem1}e`;
      ox2 = `${stem1}a`;
      ox3 = variant === 1 ? `${stem1}ud` : `${stem1}um`;
      break;
    case 9:
      if (variant === 8) {
        return `${stem1}., abb.  PRON`;
      }
      if (variant === 9) {
        return `${stem1}, undeclined  PRON`;
      }
      break;
  }

  if (ox1 && ox2 && ox3) {
    return `${ox1}, ${ox2}, ${ox3}  PRON`;
  }

  // Fallback for declensions without specific form logic (1, 2, 5, etc.)
  return `${stem1}  PRON`;
}

function formatVerb(
  stem1: string,
  stem2: string,
  stem3: string,
  stem4: string,
  which: number,
  variant: number,
  kind: string,
): string {
  const parts: string[] = [];

  // --- Deponent verbs: passive forms (table-driven) ---
  if (kind === "DEP") {
    const DEP_OX1: Record<number, string> = { 1: "or", 2: "eor", 3: "or" };
    const DEP_INF: Record<string, string> = { "1": "ari", "2": "eri", "3": "i", "3.4": "iri" };
    parts.push(`${stem1}${DEP_OX1[which] ?? "or"}`);
    parts.push(
      `${stem2 || stem1}${DEP_INF[`${which}.${variant}`] ?? DEP_INF[String(which)] ?? "i"}`,
    );
    parts.push(hasStem(stem4) ? `${stem4}us sum` : "-");
    return formatVerbResult(parts, which, variant, kind);
  }

  // --- Perfect definite ---
  if (kind === "PERFDEF") {
    if (hasStem(stem3)) {
      parts.push(`${stem3}i`);
      parts.push(`${stem3}isse`);
    }
    if (hasStem(stem4)) parts.push(`${stem4}us`);
    return formatVerbResult(parts, which, variant, kind);
  }

  // --- OX1: Present 1sg (table-driven) ---
  if (kind === "IMPERS") {
    const IMPERS_OX1: Record<number, string> = { 1: "at", 2: "et", 3: "it" };
    if (which === 5 && variant === 1) parts.push(`${stem1}est`);
    else parts.push(`${stem1}${IMPERS_OX1[which] ?? "t"}`);
  } else {
    const OX1: Record<string, string> = { "2": "eo", "5": "um", "7.2": "am" };
    parts.push(`${stem1}${OX1[`${which}.${variant}`] ?? OX1[String(which)] ?? "o"}`);
  }

  // --- V 7,1 and 7,2 (defective aio/inquam): only OX1, rest are "-" ---
  if (which === 7 && (variant === 1 || variant === 2)) {
    parts.push("-", "-");
    return formatVerbResult(parts, which, variant, kind);
  }

  // --- OX2: Infinitive (table-driven for common conjugations) ---
  const infStem = stem2 || stem1;
  const INF_ENDINGS: Record<string, string> = {
    "1": "are",
    "2": "ere",
    "3": "ere",
    "3.2": "re",
    "3.4": "ire",
    "5.2": "",
    "6.1": "re",
    "6.2": "le",
    "7.3": "se",
    "8.1": "are",
    "8.4": "ire",
    "8": "ere",
  };
  const infKey = `${which}.${variant}`;
  if (which === 5 && variant === 1) {
    parts.push(`${stem2}esse`);
  } else if (which === 5 && variant === 2) {
    parts.push(`${stem1}e`);
  } else {
    const ending = INF_ENDINGS[infKey] ?? INF_ENDINGS[String(which)] ?? "re";
    parts.push(`${infStem}${ending}`);
  }

  // --- OX3 & OX4: Perfect and supine ---
  if (kind === "IMPERS") {
    if (hasStem(stem3)) parts.push(`${stem3}it`);
    else if (hasStem(stem4)) parts.push("-");
    if (hasStem(stem4)) parts.push(`${stem4}us est`);
    else if (hasStem(stem3)) parts.push("-");
  } else if (kind === "SEMIDEP") {
    // Ada: only Ox(4) is set for SEMIDEP — stem3 (active perfect) is skipped
    if (hasStem(stem4)) parts.push(`${stem4}us sum`);
  } else if (which === 5 && variant === 1) {
    // sum, esse: fui, futurus
    if (hasStem(stem3)) parts.push(`${stem3}i`);
    if (hasStem(stem4)) parts.push(`${stem4}urus`);
  } else {
    if (hasStem(stem3)) parts.push(`${stem3}i`);
    else parts.push("-");
    if (hasStem(stem4)) parts.push(`${stem4}us`);
    else parts.push("-");
  }

  // Ada finalization: con (6,1) verbs (eo/ire class) append "(ii)" to perfect stem
  if (which === 6 && variant === 1 && parts.length >= 3) {
    const perf = parts[2];
    if (perf && perf !== "-") {
      parts[2] = `${perf}(ii)`;
    }
  }

  return formatVerbResult(parts, which, variant, kind);
}

function formatVerbResult(parts: string[], which: number, variant: number, kind: string): string {
  // Latin tradition: (3,4) = 4th conjugation (io-verbs)
  const displayWhich = which === 3 && variant === 4 ? 4 : which;
  const ord = ordinal(displayWhich);
  const conjStr = ord ? ` (${ord})` : "";
  const kindStr = kind && kind !== "X" ? ` ${kind}` : "";
  return `${parts.join(", ")}  V${conjStr}${kindStr}`;
}

function formatAdjective(
  stems: readonly [string, string, string, string],
  which: number,
  variant: number,
  co: string,
): string {
  const [s1, s2, s3, s4] = stems;

  // Comparative only
  if (co === "COMP") return `${s1}or, ${s1}or, ${s1}us  ADJ`;
  // Superlative only
  if (co === "SUPER") return `${s1}mus, ${s1}ma, ${s1}mum  ADJ`;

  // co = X (all forms): stem1+pos, stem2+shorthand, stem3+comp, stem4+super
  if (co === "X" && (hasStem(s3) || hasStem(s4))) {
    let ox1: string;
    let ox2: string;
    if (which === 1) {
      ox1 = variant === 2 || variant === 4 ? `${s1}` : `${s1}us`;
      ox2 = `${s2 || s1}a -um`;
    } else if (which === 3) {
      if (variant === 1) {
        ox1 = s1;
        ox2 = `${s2 || s1}is (gen.)`;
      } else if (variant === 2) {
        ox1 = `${s1}is`;
        ox2 = `${s2 || s1}e`;
      } else {
        ox1 = s1;
        ox2 = `${s2 || s1}is -e`;
      }
    } else {
      ox1 = `${s1}us`;
      ox2 = `${s2 || s1}a -um`;
    }
    const parts = [ox1, ox2];
    parts.push(hasStem(s3) ? `${s3}or -or -us` : "-");
    parts.push(hasStem(s4) ? `${s4}mus -a -um` : "-");
    return `${parts.join(", ")}  ADJ`;
  }

  // co = POS (positive only)
  if (which === 3) {
    if (variant === 1) return `${s1}, (gen.), ${s2 || s1}is  ADJ`;
    if (variant === 2) return `${s1}is, ${s2 || s1}is, ${s2 || s1}e  ADJ`;
    if (variant === 3) return `${s1}, ${s2 || s1}is, ${s2 || s1}e  ADJ`;
    if (variant === 6) return `${s1}, (gen.), ${s2 || s1}os  ADJ`;
  }
  // 1st/2nd declension positive
  if (variant === 2 || variant === 4) return `${s1}, ${s2 || s1}a, ${s2 || s1}um  ADJ`;
  if (variant === 3) return `${s1}us, ${s2 || s1}a, ${s2 || s1}um (gen -ius)  ADJ`;
  return `${s1}us, ${s2 || s1}a, ${s2 || s1}um  ADJ`;
}
