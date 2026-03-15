# Changelog

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
