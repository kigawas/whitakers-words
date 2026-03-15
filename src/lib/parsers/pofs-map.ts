import { PARTS_OF_SPEECH, type PartOfSpeech } from "../types/enums.js";

const VALID_POFS: ReadonlySet<string> = new Set(PARTS_OF_SPEECH);

export function parsePofs(s: string): PartOfSpeech {
  const trimmed = s.trimEnd();
  return VALID_POFS.has(trimmed) ? (trimmed as PartOfSpeech) : "X";
}
