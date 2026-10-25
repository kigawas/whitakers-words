// ---------------------------------------------------------------------------
// Fix_Adverb — adjectives read as adverbs
//
// Ada's "gimick of adding an ADV if there is only ADJ VOC" (Handle_Adverb and
// Fix_Adverb, list_package.adb:687-873): when no reading of a word is an
// adverb, an ADJ 1 1 VOC S M POS reading also reads as the adverb in -e, and
// an ADJ VOC S M SUPER of any declension as the adverb in -me, each under its
// own "e" suffix line: perfid.e ADJ → perfid.e ADV, sanctissi.me ADJ →
// sanctissi.me ADV.
// ---------------------------------------------------------------------------

import type { SuffixItem } from "../types/addons.js";
import type { AddonResult } from "./addons-engine.js";
import type { SluryResult } from "./slury.js";
import type { TwoWordResult } from "./two-words.js";
import type { ParseResult } from "./word-analysis.js";

/** Ada's suffix lines for the conversion, not the -e of ADDONS.LAT. */
const toAdverb = (comparison: "POS" | "SUPER", mean: string): SuffixItem => ({
  fix: "e",
  connect: "",
  entr: { root: "ADJ", rootKey: 0, target: { pofs: "ADV", adv: { co: comparison } }, targetKey: 0 },
  mean,
});

const CONVERSIONS = {
  POS: { addon: toAdverb("POS", "-ly; -ily;  Converting ADJ to ADV"), suf: "e" },
  SUPER: {
    addon: toAdverb("SUPER", "-estly; -estily; most -ly, very -ly  Converting ADJ to ADV"),
    suf: "me",
  },
} as const;

/** A word's readings, as WordsEngine.parseWord gathers them. */
export interface WordReadings {
  readonly results: readonly ParseResult[];
  readonly trickResults: readonly ParseResult[];
  readonly addonResults: readonly AddonResult[];
  readonly twoWordResult: TwoWordResult | null;
  readonly sluryResult: SluryResult | null;
}

/** An addon's base readings, with those of the addons under it. */
function addonReadings(ar: AddonResult): ParseResult[] {
  if (ar.type !== "tackon") return [...ar.baseResults];
  return [...ar.baseResults, ...(ar.baseAddons ?? []).flatMap(addonReadings)];
}

/**
 * The adverb readings Ada adds to a word. Ada converts every reading in its
 * parse array, so a spelling trick's reading counts (perphide), and so do a
 * slur's (adcomode), a tackon's base (perfideque) and both halves of a
 * two-word split (magnebone).
 */
export function fixAdverb(word: WordReadings): AddonResult[] {
  const readings = [
    ...word.results,
    ...(word.sluryResult?.results ?? []),
    ...word.trickResults,
    ...word.addonResults.flatMap(addonReadings),
    ...(word.twoWordResult?.leftResults ?? []),
    ...(word.twoWordResult?.rightResults ?? []),
  ];
  const isAdverb = (r: ParseResult) => r.ir.qual.pofs === "ADV";
  if (readings.some(isAdverb)) return [];
  const out: AddonResult[] = [];
  // Ada builds the adverb from the first ADJ reading of a run, so the stem's
  // later entries repeat it: die gets one dius, not one per entry
  const seen = new Set<string>();
  for (const r of readings) {
    const q = r.ir.qual;
    if (q.pofs !== "ADJ") continue;
    const { decl, cs, number, gender, comparison } = q.adj;
    if (cs !== "VOC" || number !== "S" || gender !== "M") continue;
    const pos = comparison === "POS" && decl.which === 1 && decl.var === 1;
    if (!pos && comparison !== "SUPER") continue;
    const key = `${r.stem} ${comparison}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const { addon, suf } = CONVERSIONS[comparison];
    out.push({
      type: "suffix",
      addon,
      baseResults: [
        {
          stem: r.stem,
          ir: {
            qual: { pofs: "ADV", adv: { comparison } },
            key: 0,
            ending: { size: suf.length, suf },
            age: "X",
            freq: "B",
          },
          de: r.de,
          entryIndex: r.entryIndex,
        },
      ],
    });
  }
  return out;
}
