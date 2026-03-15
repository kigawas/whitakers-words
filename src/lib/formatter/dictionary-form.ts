import type { DictionaryEntry } from "../types/dictionary.js";

/**
 * Generate the citation/dictionary form for a dictionary entry.
 * E.g., "aqua, aquae  N (1st) F" for a 1st declension feminine noun.
 */
export function dictionaryForm(de: DictionaryEntry): string {
  const part = de.part;
  const s = de.stems;

  switch (part.pofs) {
    case "N":
      return formatNoun(s[0], s[1], part.n.decl.which, part.n.gender);
    case "V":
      return formatVerb(s[0], s[1], s[2], s[3], part.v.con.which);
    case "ADJ":
      return formatAdjective(s[0], part.adj.decl.which);
    case "ADV":
      return `${s[0]}  ADV`;
    case "PREP":
      return `${s[0]}  PREP ${part.prep.obj}`;
    case "CONJ":
      return `${s[0]}  CONJ`;
    case "INTERJ":
      return `${s[0]}  INTERJ`;
    case "PRON":
      return `${s[0]}  PRON`;
    case "PACK":
      return `${s[0]}  PACK`;
    case "NUM":
      return `${s[0]}  NUM`;
    default:
      return s[0];
  }
}

function ordinal(which: number): string {
  switch (which) {
    case 1:
      return "1st";
    case 2:
      return "2nd";
    case 3:
      return "3rd";
    case 4:
      return "4th";
    case 5:
      return "5th";
    default:
      return "";
  }
}

function formatNoun(stem1: string, stem2: string, which: number, gender: string): string {
  let nomEnd: string;
  let genEnd: string;

  switch (which) {
    case 1:
      nomEnd = "a";
      genEnd = "ae";
      break;
    case 2:
      if (gender === "N") {
        nomEnd = "um";
        genEnd = "i";
      } else {
        nomEnd = "us";
        genEnd = "i";
      }
      break;
    case 3:
      nomEnd = "";
      genEnd = "is";
      break;
    case 4:
      nomEnd = "us";
      genEnd = "us";
      break;
    case 5:
      nomEnd = "es";
      genEnd = "ei";
      break;
    default:
      nomEnd = "";
      genEnd = "";
      break;
  }

  const nom = stem1 + nomEnd;
  const gen = (stem2 || stem1) + genEnd;
  const ord = ordinal(which);
  const declStr = ord ? ` (${ord})` : "";
  return `${nom}, ${gen}  N${declStr} ${gender}`;
}

function formatVerb(
  stem1: string,
  stem2: string,
  stem3: string,
  stem4: string,
  which: number,
): string {
  let infEnd: string;

  switch (which) {
    case 1:
      infEnd = "are";
      break;
    case 2:
      infEnd = "ere";
      break;
    case 3:
      infEnd = "ere";
      break;
    case 4:
      infEnd = "ire";
      break;
    default:
      infEnd = "re";
      break;
  }

  const parts: string[] = [];
  parts.push(`${stem1}o`);
  parts.push((stem2 || stem1) + infEnd);
  if (stem3) parts.push(`${stem3}i`);
  if (stem4) parts.push(`${stem4}us`);

  const ord = ordinal(which);
  const conjStr = ord ? ` (${ord})` : "";
  return `${parts.join(", ")}  V${conjStr}`;
}

function formatAdjective(stem1: string, which: number): string {
  if (which === 3) {
    return `${stem1}is, ${stem1}e  ADJ`;
  }
  // Default 1st/2nd declension
  return `${stem1}us, ${stem1}a, ${stem1}um  ADJ`;
}
