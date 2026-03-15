# whitakers-words

[![License](https://img.shields.io/github/license/kigawas/whitakers-words.svg)](https://github.com/kigawas/whitakers-words)
[![NPM Package](https://img.shields.io/npm/v/whitakers-words.svg)](https://www.npmjs.com/package/whitakers-words)
[![NPM Downloads](https://img.shields.io/npm/dm/whitakers-words)](https://npm-stat.link/whitakers-words)
[![Bundle size](https://badgen.net/bundlephobia/minzip/whitakers-words)](https://bundlephobia.com/package/whitakers-words@latest)
[![CI](https://img.shields.io/github/actions/workflow/status/kigawas/whitakers-words/ci.yml)](https://github.com/kigawas/whitakers-words/actions)
[![Codecov](https://img.shields.io/codecov/c/github/kigawas/whitakers-words.svg)](https://codecov.io/gh/kigawas/whitakers-words)

A modern TypeScript port of [Whitaker's Words](https://archives.nd.edu/whitaker/words.htm), a comprehensive Latin dictionary and morphological analyzer originally written in Ada by William Whitaker.

**[Try the online demo](https://whitakers-words.kigawas.me/)**

Given any Latin word form, the engine strips inflectional endings, matches stems against a 39,000-entry dictionary, and returns every possible parse: part of speech, declension/conjugation, case, number, gender, tense, voice, mood, and English meaning. It also supports English-to-Latin reverse lookup, enclitic/prefix/suffix stripping, spelling tricks for medieval and variant orthography, and unique irregular forms.

## Installation

```bash
npm install whitakers-words
```

## Quick Start

### Node / Bun / Deno

The `whitakers-words/node` entry point loads the bundled data files from disk automatically:

```typescript
import { createEngine, formatWordAnalysis } from "whitakers-words/node";

const engine = createEngine();

// Parse a Latin word
const analysis = engine.parseWord("amare");
console.log(formatWordAnalysis(analysis));
// am.are               V      1 1 PRES ACTIVE  INF 0 X
// amo, amare, amavi, amatus  V (1st)   [XXXAO]
// love, like; fall in love with; be fond of; have a tendency to;
// ...

// English-to-Latin reverse lookup
const results = engine.searchEnglish("water");
// => [{ de: { stems: ["aqu", ...], mean: "water; sea, lake; ..." }, rank: 6 }, ...]
```

### Browser

The main `whitakers-words` entry point is platform-agnostic (no `fs` or `path` imports). You provide the data file contents yourself: typically via `fetch`:

```typescript
import { WordsEngine, formatWordAnalysis } from "whitakers-words";

const load = (url: string) => fetch(url).then((r) => r.text());

const [dictline, inflects, addons, uniques] = await Promise.all([
  load("/data/DICTLINE.GEN"),
  load("/data/INFLECTS.LAT"),
  load("/data/ADDONS.LAT"),
  load("/data/UNIQUES.LAT"),
]);

const engine = WordsEngine.create({ dictline, inflects, addons, uniques });
console.log(engine.formatWord("aquam"));
```

The four data files are included in the npm package under `data/`. How you serve them is up to your setup (static assets, CDN, bundler plugin, etc.).

## CLI

The package includes a `whitakers` command:

```bash
# Parse Latin words directly
npx whitakers "rem acu tetigisti"

# Interactive mode
npx whitakers
=> aquam
aqu.am               N      1 1 ACC S C
aqua, aquae  N (1st) F   [XXXAO]
water; sea, lake; river, stream; rain, rainfall (pl.), rainwater; spa; urine;

# English-to-Latin mode
=> ~E
=> water
aqua, aquae  N (1st) F   [XXXAO]
water; sea, lake; river, stream; ...

# Switch back to Latin mode
=> ~L
```

Pipe-friendly: reads from stdin when not a TTY:

```bash
echo "saucia cura" | npx whitakers
```

## API Reference

### `WordsEngine`

The main class. Created via `WordsEngine.create(data)` or the convenience `createEngine()` from `whitakers-words/node`.

| Method / Property                                                         | Description                                       |
| ------------------------------------------------------------------------- | ------------------------------------------------- |
| `static create(data: WordsEngineData)`                                    | Create an engine from raw data file contents      |
| `parseWord(word: string): WordAnalysis`                                   | Analyze a Latin word: returns all possible parses |
| `searchEnglish(word: string, maxResults?: number): EnglishSearchResult[]` | English-to-Latin reverse lookup                   |
| `formatWord(word: string): string`                                        | Parse and format as human-readable text           |
| `dictionarySize: number`                                                  | Number of dictionary entries (expect ~39,000)     |
| `inflectionCount: number`                                                 | Number of inflection rules (expect ~1,800)        |
| `uniqueCount: number`                                                     | Number of unique/irregular entries (expect ~76)   |
| `addons: AddonsData`                                                      | The parsed addons (prefixes, suffixes, tackons)   |

### `WordAnalysis`

Returned by `parseWord()`. Contains all possible interpretations of a word:

```typescript
interface WordAnalysis {
  word: string;                          // the input word
  results: readonly ParseResult[];       // standard dictionary + inflection matches
  uniqueResults: readonly UniqueEntry[]; // matches from the uniques table
  addonResults: readonly AddonResult[];  // matches after stripping prefixes/suffixes/enclitics
  trickResults: readonly ParseResult[];  // matches after spelling transformations
}
```

The engine tries these in order: uniques, then standard analysis, then spelling tricks, then addon stripping. Only the first strategy that produces results is populated.

### `ParseResult`

A single interpretation of a word form:

```typescript
interface ParseResult {
  stem: string;           // the matched stem portion
  ir: InflectionRecord;   // the inflection rule (ending, POS, case, tense, etc.)
  de: DictionaryEntry;    // the dictionary entry (stems, part of speech, meaning)
  entryIndex: number;     // index into the dictionary for grouping
}
```

Access grammatical details through the discriminated union on `ir.qual.pofs`:

```typescript
const analysis = engine.parseWord("aquam");
for (const r of analysis.results) {
  if (r.ir.qual.pofs === "N") {
    console.log(r.ir.qual.noun.cs);     // "ACC"
    console.log(r.ir.qual.noun.number); // "S"
    console.log(r.ir.qual.noun.gender); // "C" (common)
  }
}
```

### Formatting Helpers

| Function                       | Description                                                               |
| ------------------------------ | ------------------------------------------------------------------------- |
| `formatWordAnalysis(analysis)` | Format a full `WordAnalysis` as human-readable text                       |
| `groupAndMerge(results)`       | Group `ParseResult[]` by dictionary entry and merge continuation meanings |
| `dictionaryForm(entry)`        | Generate a citation form, e.g. `"aqua, aquae  N (1st) F"`                 |

### Type System

All grammatical categories are typed as string literal unions derived from `as const` arrays:

```typescript
import {
  PARTS_OF_SPEECH, type PartOfSpeech,  // "N" | "V" | "ADJ" | ...
  CASES, type Case,                     // "NOM" | "VOC" | "GEN" | "DAT" | "ABL" | "ACC" | ...
  GENDERS, type Gender,                 // "M" | "F" | "N" | "C" | "X"
  TENSES, type Tense,                   // "PRES" | "IMPF" | "FUT" | "PERF" | "PLUP" | "FUTP"
  VOICES, type Voice,                   // "ACTIVE" | "PASSIVE"
  MOODS, type Mood,                     // "IND" | "SUB" | "IMP" | "INF" | "PPL"
  // ... and more
} from "whitakers-words";
```

Quality records (`ir.qual`) and part entries (`de.part`) are discriminated unions on the `pofs` field, giving full type narrowing in TypeScript.

### Matching Functions

The library exports matching functions that implement the Ada "contained in" semantics, where `X` (or `0`) is a wildcard:

```typescript
import { matchesGender, matchesCase, matchesDecn } from "whitakers-words";

matchesGender("M", "C");  // true — common gender matches masculine
matchesCase("ACC", "X");  // true — X matches everything
matchesDecn(
  { which: 1, var: 1 },
  { which: 0, var: 0 },
); // true — (0,0) matches all except which=9
```

## How It Works

The analysis pipeline mirrors Whitaker's original Ada implementation:

1. **Split** the word into every possible stem + ending pair (endings from 0 to 7 characters)
2. **Look up** each ending in the inflection index (keyed by ending length and last character)
3. **Look up** each stem in the dictionary index (keyed by first 2 characters, with u/v and i/j normalization)
4. **Verify** part-of-speech compatibility, declension/conjugation match, and stem key match
5. **Deduplicate** and rank by dictionary frequency
6. If no matches, try **spelling tricks** (ae/e interchange, ph/f, medieval Latin variants, etc.)
7. If still no matches, try **addon stripping** (enclitics like *-que*, *-ne*, *-ve*; prefixes; suffixes)

Dictionary stems and inflection endings use indexed lookup structures for fast retrieval. Latin u/v and i/j equivalence is handled throughout.

## Data Files

The package bundles four data files derived from the original Whitaker's Words distribution:

| File           | Contents                                           | Entries |
| -------------- | -------------------------------------------------- | ------- |
| `DICTLINE.GEN` | Dictionary entries (stems, POS, meaning)           | ~39,000 |
| `INFLECTS.LAT` | Inflection rules (endings, grammatical properties) | ~1,800  |
| `ADDONS.LAT`   | Prefixes, suffixes, and enclitics                  | ~180    |
| `UNIQUES.LAT`  | Irregular forms with special handling              | 76      |

## Examples

The [`examples/`](examples/) directory contains ready-to-run demos:

- **`examples/runtime/`**: Node.js script that parses several Latin words and prints formatted output. Run with `node examples/runtime/index.js` (or Bun or Deno if you'd like to).
- **`examples/browser/`**: Vite-powered browser app with a scholarly UI for looking up Latin words. Run with `cd examples/browser && pnpm dev`. It's online at [https://whitakers-words.kigawas.me/](https://whitakers-words.kigawas.me/).

## Background

[Whitaker's Words](https://archives.nd.edu/whitaker/words.htm) was written by Colonel William Whitaker (USAF, retired) in Ada, starting in the early 1990s. It became one of the most widely used Latin analysis tools, processing over 39,000 dictionary entries covering classical, medieval, and post-classical Latin.

The original Ada source is maintained at [mk270/whitakers-words](https://github.com/mk270/whitakers-words). This TypeScript port follows the same algorithms and data formats, making the tool available as a JavaScript library for web applications, Node.js servers, and command-line use.

## License

[MIT](LICENSE)
