# Changelog

## v0.1.2

Improved Ada compatibility, inflection frequency tags, and tackon ordering fix.

### Bug fixes

- **Tackon ordering** — tackons now run before tricks, matching Ada's cascade. Fixes "quidam" (qui + dam PACKON) being incorrectly parsed via medieval d→dd trick instead of tackon stripping.
- **ADV comparison from stem key** — adverbs with `co=X` now derive comparison from the matched stem key (key=1→POS, key=2→COMP, key=3→SUPER), matching Ada. Fixes "amare" ADV showing all three degrees instead of just POS.
- **PRON 4 2 idem filtering** — the `idem` entry (PRON 4 2 DEMONS) no longer appears in standalone results for "i", "is", "eius", etc. Only shows via the `-dem` tackon path.
- **Browser merge bug** — fixed `mergeByInflection` incorrectly merging entries with different grammar (e.g., Athena GEN S with Athens NOM P) by including grammar info in the merge key.

### New features

- **Inflection frequency tags** — inflection lines now show frequency warnings (uncommon, infreq, rare, veryrare) matching Ada's `Inflection_Frequency` table. E.g., "pelagum GEN P" shows "uncommon". Shown in both CLI and browser.
- **Browser inflection frequency badges** — styled terracotta badges for frequency tags alongside the existing gold age badges.

## v0.1.1

Lots of bug fixes, new features, test coverage improvements, and performance enhancements.

### New features

- **Compound perfect passive** — `parseLine()` detects PPL + sum/esse/fuisse across word boundaries (e.g., "amatus est" → `PERF PASSIVE IND 3 S`). New line-level API: `engine.parseLine(line)` and `engine.formatLine(line)`.
- **Roman numeral detection** — `i`, `di`, `xiv` etc. recognized alongside other results. Output matches Ada format (`NUM 2 0 X X X CARD`).
- **Syncopated perfect forms** — "amasti" → "amavisti", "noris" → "noveris", etc. Five expansion rules running alongside standard results.
- **Two-word splitting** — fallback for compound words like "mecum" when other strategies fail.
- **Trick annotations** — spelling trick results now include human-readable annotations describing which transformations were applied (e.g., "ae => e", "ph => f").
- **Supplementary proper names dictionary** — 171 additional proper names (historical figures, places, deities) in a new `DICTLINE.SUP` data file.
- **Browser dark theme** — the browser webapp now supports light/dark themes with a toggle button, smooth transitions, and `prefers-reduced-motion` support.

### Bug fixes

- **Noun dictionary forms** — all declension variants: Greek (Boreas/Boreae, Crete/Cretes, chlamys/chlamydos/is), 2nd decl var 3 (ager not agerus), var 4 -i(i) genitive, 4th decl neuter -u, decl 9 abbreviated/undeclined. Ordinal hidden for Greek variants.
- **Pronoun dictionary forms** — `hic, haec, hoc` / `ille, illa, illud` / `is, ea, id` / `ipse, ipsa, ipsum` / `idem, eadem, idem` instead of raw stems.
- **Adjective/verb dictionary forms** — full coverage of all comparison levels, declension variants, verb kinds (DEP/PERFDEF/IMPERS/SEMIDEP), and conjugation-specific infinitive endings.
- **Preposition filtering** — `ab` now shows only `PREP ABL`, not GEN/ACC/ABL.
- **Blank-ending imperative** — V 3,1 IMP restricted to stems ending in -c (dic/duc/fac). Fixes "illud" spuriously matching "illudo".
- **SEMIDEP/DEP verb filtering** — correct voice restrictions per Ada's list_sweep rules.
- **Neuter accusative** — fixed incorrect neuter accusative handling in word analysis.
- **Proper names display** — proper names now display correctly with appropriate formatting.
- **Roman numeral fixes** — improved Roman numeral parsing and display in both engine and browser UI.
- **Idem handling** — fixed `idem, eadem, idem` and related pronoun issues.
- **BDL cleanup** — removed BDL (blank dictionary line) runtime logic by baking blank-stem entries directly into the dictionary, simplifying the engine.

### Performance

- **Suffix trie** — reversed-character trie replaces O(stems x suffixes) loop with O(word_length) per stem.
- **Split listSweep** — decomposed into `deduplicate()`, `filterByPOS()`, `normalizeDisplay()`, `rank()`.
- **Pre-computed addon arrays** — combined tackon/prefix arrays built once, not re-spread per `parseWord()` call.

### API additions

```typescript
// Line-level parsing with compound verb detection
const analyses: WordAnalysis[] = engine.parseLine("amatus est");
const output: string = engine.formatLine("amatus est");

// Single-word parsing with optional lookahead
const analysis = engine.parseWord("amatus", "est");
analysis.compoundResults; // CompoundResult[]
```

## v0.1.0

Initial release — a complete TypeScript port of [Whitaker's Words](https://archives.nd.edu/whitaker/words.htm), the Latin morphological analyzer originally written in Ada.

### Highlights

- **39,000-entry Latin dictionary** with full morphological analysis — given any Latin word form, returns part of speech, declension/conjugation, case, number, gender, tense, voice, mood, and English meaning
- **English-to-Latin** reverse lookup
- **Spelling tricks** for medieval and variant orthography (ae/e, ph/f, u/v, i/j, and more)
- **Addon stripping** — enclitics (-que, -ne, -ve), prefixes, and suffixes
- **Platform-agnostic library** (`whitakers-words`) with a **Node convenience loader** (`whitakers-words/node`)
- **CLI** (`npx whitakers`) with interactive and pipe-friendly modes
- **Full TypeScript types** — discriminated unions, `as const` enum arrays, strict mode with `noUncheckedIndexedAccess`
- **Zero runtime dependencies**

### API

```typescript
// Node / Bun / Deno
import { createEngine, formatWordAnalysis } from "whitakers-words/node";
const engine = createEngine();
console.log(formatWordAnalysis(engine.parseWord("amare")));

// Browser
import { WordsEngine } from "whitakers-words";
const engine = WordsEngine.create({ dictline, inflects, addons, uniques });
```

### Links

- **Online demo**: https://whitakers-words.kigawas.me/
- **npm**: https://www.npmjs.com/package/whitakers-words
- **Original Ada source**: https://github.com/mk270/whitakers-words
