import { WordsEngine, dictionaryForm, groupAndMerge } from "whitakers-words";

// ---------------------------------------------------------------------------
// DOM references
// ---------------------------------------------------------------------------

const input = document.getElementById("word-input");
const btn = document.getElementById("parse-btn");
const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

// ---------------------------------------------------------------------------
// Engine loading
// ---------------------------------------------------------------------------

let engine = null;

const CACHE_NAME = "whitakers-words-data-v1";

async function loadFile(path, cache) {
  const cached = await cache?.match(path);
  if (cached) return cached.text();

  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  await cache?.put(path, res.clone());
  return res.text();
}

async function init() {
  statusEl.classList.add("loading");
  const t0 = performance.now();

  const cache = await caches.open(CACHE_NAME).catch(() => null);

  // Load small files first, then the large dictionary
  const [inflects, addons, uniques] = await Promise.all([
    loadFile("/data/INFLECTS.LAT", cache),
    loadFile("/data/ADDONS.LAT", cache),
    loadFile("/data/UNIQUES.LAT", cache),
  ]);
  statusEl.textContent = "Loading dictionary\u2026";
  const [dictGen, dictSup] = await Promise.all([
    loadFile("/data/DICTLINE.GEN", cache),
    loadFile("/data/DICTLINE.SUP", cache),
  ]);
  const dictline = `${dictGen}\n${dictSup}`;

  statusEl.textContent = "Building index\u2026";
  // Yield to paint the status update before the blocking create()
  await new Promise((r) => requestAnimationFrame(r));

  engine = WordsEngine.create({ dictline, inflects, addons, uniques });
  const elapsed = (performance.now() - t0).toFixed(0);

  statusEl.classList.remove("loading");
  statusEl.classList.add("ready");
  statusEl.textContent = `${engine.dictionarySize.toLocaleString()} entries loaded in ${elapsed} ms`;

  input.disabled = false;
  btn.disabled = false;
  input.focus();
}

// ---------------------------------------------------------------------------
// Parsing & rendering
// ---------------------------------------------------------------------------

/** POS label map */
const POS_LABELS = {
  N: "noun", V: "verb", ADJ: "adj", ADV: "adv", PREP: "prep",
  CONJ: "conj", INTERJ: "interj", PRON: "pron", PACK: "pron",
  NUM: "num", VPAR: "vpar", SUPINE: "supine",
};

/** POS full descriptions for tooltips */
const POS_TIPS = {
  N: "Noun", V: "Verb", ADJ: "Adjective", ADV: "Adverb", PREP: "Preposition",
  CONJ: "Conjunction", INTERJ: "Interjection", PRON: "Pronoun", PACK: "Pronoun (PACK)",
  NUM: "Numeral", VPAR: "Verbal Participle", SUPINE: "Supine",
};

/** CSS class for a POS badge */
function posClass(pofs) {
  return `pos-${pofs.toLowerCase()}`;
}

/** Render a POS badge with tooltip */
function posBadge(pofs) {
  const label = POS_LABELS[pofs] || pofs.toLowerCase();
  const full = POS_TIPS[pofs] || label;
  return `<span class="pos-badge ${posClass(pofs)}" tabindex="0">${label}<span class="pos-tooltip">${esc(full)}</span></span>`;
}

/** Abbreviation → full label for grammar tooltips */
const GRAM_TIPS = {
  // Case
  NOM: "Nominative", GEN: "Genitive", DAT: "Dative", ACC: "Accusative",
  ABL: "Ablative", VOC: "Vocative", LOC: "Locative", X: "",
  // Number
  S: "Singular", P: "Plural",
  // Gender
  M: "Masculine", F: "Feminine", N: "Neuter", C: "Common",
  // Tense
  PRES: "Present", IMPF: "Imperfect", PERF: "Perfect", PLUP: "Pluperfect",
  FUT: "Future", FUTP: "Future Perfect",
  // Voice
  ACTIVE: "Active voice", PASSIVE: "Passive voice",
  // Mood
  IND: "Indicative", SUB: "Subjunctive", INF: "Infinitive", IMP: "Imperative",
  // Person
  1: "1st person", 2: "2nd person", 3: "3rd person", 0: "",
  // Comparison
  POS: "Positive", COMP: "Comparative", SUPER: "Superlative",
  // Numeral sort
  CARD: "Cardinal", ORD: "Ordinal", DIST: "Distributive", ADVERB: "Numeral adverb",
  // Other
  PPL: "Participle",
};

/** Wrap a grammar abbreviation in a tooltip span (same style as flags tooltip) */
function tip(abbr) {
  const s = String(abbr);
  if (!s || s === "X" || s === "0") return "";
  const full = GRAM_TIPS[s];
  if (!full) return esc(s);
  return `<span class="gram-tip">${esc(s)}<span class="gram-tooltip">${esc(full)}</span></span>`;
}

/** Format grammatical details from a quality record as HTML with tooltips */
function grammarHTML(qual) {
  switch (qual.pofs) {
    case "N":
      return [tip(qual.noun.cs), tip(qual.noun.number), tip(qual.noun.gender)].filter(Boolean).join(" ");
    case "PRON":
      return [tip(qual.pron.cs), tip(qual.pron.number), tip(qual.pron.gender)].filter(Boolean).join(" ");
    case "PACK":
      return [tip(qual.pack.cs), tip(qual.pack.number), tip(qual.pack.gender)].filter(Boolean).join(" ");
    case "ADJ":
      return [tip(qual.adj.cs), tip(qual.adj.number), tip(qual.adj.gender), tip(qual.adj.comparison)].filter(Boolean).join(" ");
    case "NUM":
      return [tip(qual.num.cs), tip(qual.num.number), tip(qual.num.gender), tip(qual.num.sort)].filter(Boolean).join(" ");
    case "ADV":
      return tip(qual.adv.comparison);
    case "V": {
      const tvm = qual.verb.tenseVoiceMood;
      return [tip(tvm.tense), tip(tvm.voice), tip(tvm.mood), tip(qual.verb.person), tip(qual.verb.number)].filter(Boolean).join(" ");
    }
    case "VPAR": {
      const tvm = qual.vpar.tenseVoiceMood;
      return [tip(qual.vpar.cs), tip(qual.vpar.number), tip(qual.vpar.gender), tip(tvm.tense), tip(tvm.voice), tip("PPL")].filter(Boolean).join(" ");
    }
    case "SUPINE":
      return [tip(qual.supine.cs), tip(qual.supine.number), tip(qual.supine.gender)].filter(Boolean).join(" ");
    case "PREP":
      return tip(qual.prep.cs);
    case "CONJ":
    case "INTERJ":
      return "";
    default:
      return "";
  }
}

/** Build stem·ending HTML */
function stemEndingHTML(stem, ending) {
  if (!ending) return `<span class="stem">${esc(stem)}</span>`;
  return `<span class="stem">${esc(stem)}</span><span class="dot">&middot;</span><span class="ending">${esc(ending)}</span>`;
}

// groupAndMerge imported from library — groups by entryIndex and merges | continuations

/**
 * Merge groups with identical inflection patterns (same stem+ending+grammar)
 * into a single group with combined meanings — mirrors the text formatter's mergeByMeaning.
 */
function mergeByInflection(groups) {
  const keyFn = (g) =>
    g.results.map((r) => `${r.stem}|${r.ir.ending.suf}|${r.ir.qual.pofs}`).join("\n");

  const map = new Map();
  const order = [];
  for (const g of groups) {
    const k = keyFn(g);
    if (map.has(k)) {
      const existing = map.get(k);
      // Append meaning if different
      if (!existing.meanings.includes(g.meaning)) {
        existing.meanings.push(g.meaning);
      }
    } else {
      const entry = { results: g.results, meanings: [g.meaning] };
      map.set(k, entry);
      order.push(k);
    }
  }
  return order.map((k) => {
    const e = map.get(k);
    return { results: e.results, meaning: e.meanings.join("\n") };
  });
}

/** Escape HTML */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const AGE_LABELS = {
  X: "All ages", A: "Archaic", B: "Early", C: "Classical", D: "Late",
  E: "Later (6\u201310C)", F: "Medieval", G: "Scholar (16\u201318C)", H: "Modern",
};
const AREA_LABELS = {
  X: "General", A: "Agriculture", B: "Biological/Medical", D: "Drama/Arts",
  E: "Ecclesiastic", G: "Grammar/Rhetoric", L: "Legal/Political",
  P: "Poetic", S: "Science/Philosophy", T: "Technical", W: "Military", Y: "Mythology",
};
const GEO_LABELS = {
  X: "All/none", A: "Africa", B: "Britain", C: "China", D: "Scandinavia",
  E: "Egypt", F: "France/Gaul", G: "Germany", H: "Greece", I: "Italy/Rome",
  J: "India", K: "Balkans", N: "Netherlands", P: "Persia", Q: "Near East",
  R: "Russia", S: "Spain/Iberia", U: "Eastern Europe",
};
const FREQ_LABELS = {
  X: "Unknown", A: "Very frequent", B: "Frequent", C: "Common",
  D: "Lesser", E: "Uncommon", F: "Very rare",
  I: "Inscription", M: "Graffiti", N: "Pliny only",
};
const SOURCE_LABELS = {
  X: "General", B: "Beeson", C: "Cassell\u2019s", D: "Adams", E: "Stelten",
  F: "Deferrari", G: "Gildersleeve+Lodge", H: "Collatinus", K: "Calepinus",
  L: "Lewis Elem.", M: "Latham", O: "Oxford (OLD)", P: "Souter",
  S: "Lewis & Short", U: "Du Cange", V: "Vademecum", W: "Whitaker", Z: "User",
};

const FLAG_DEFS = [
  { key: "age", label: "Age", map: AGE_LABELS },
  { key: "area", label: "Area", map: AREA_LABELS },
  { key: "geo", label: "Geo", map: GEO_LABELS },
  { key: "freq", label: "Freq", map: FREQ_LABELS },
  { key: "source", label: "Source", map: SOURCE_LABELS },
];

/** Build flags HTML with hover tooltip explaining each code */
function flags(de) {
  const t = de.tran;
  const codes = [t.age, t.area, t.geo, t.freq, t.source];
  const codeStr = codes.join("");

  const rows = FLAG_DEFS.map((def, i) => {
    const code = codes[i];
    const meaning = def.map[code] || code;
    return `<tr><td class="ft-label">${esc(def.label)}</td><td class="ft-code">${esc(code)}</td><td class="ft-meaning">${esc(meaning)}</td></tr>`;
  }).join("");

  return `<span class="flags-wrap" tabindex="0">[${esc(codeStr)}]<span class="flags-tooltip"><table>${rows}</table></span></span>`;
}

/** Inflection age labels (non-default ages shown as tags on inflection lines) */
const INFL_AGE_LABELS = {
  A: "Archaic", B: "Early", D: "Late", E: "Later",
  F: "Medieval", G: "Scholar", H: "Modern",
};

/** Render an inflection age tag if the age is non-default */
function inflAgeTag(age) {
  const label = INFL_AGE_LABELS[age];
  if (!label) return "";
  return `<span class="infl-age">${esc(label)}</span>`;
}

/** Render a merged entry group ({ results, meaning }) */
function renderEntryGroup(group, extraClass = "", compound = null) {
  const first = group.results[0];
  const inflLines = group.results
    .map((r) => {
      return `
      <div class="inflection-line">
        <span class="stem-ending">${stemEndingHTML(r.stem, r.ir.ending.suf)}</span>
        ${posBadge(r.ir.qual.pofs)}
        <span class="grammar">${grammarHTML(r.ir.qual)}</span>
        ${inflAgeTag(r.ir.age)}
      </div>`;
    })
    .join("");

  let compoundLine = "";
  if (compound) {
    const tvm = [tip(compound.tense), tip(compound.voice), tip(compound.mood), tip(compound.person), tip(compound.number)].filter(Boolean).join(" ");
    compoundLine = `
      <div class="compound-line">
        <span class="stem-ending"><span class="stem">${esc(compound.stem)}</span></span>
        ${posBadge("V")}
        <span class="grammar">${tvm}</span>
      </div>
      <div class="compound-gloss">${esc(compound.gloss)}</div>`;
  }

  const form = dictionaryForm(first.de);

  return `
    <div class="entry-group ${extraClass}">
      ${inflLines}
      ${compoundLine}
      <div class="dict-form">${esc(form)} <span class="dict-flags">${flags(first.de)}</span></div>
      ${group.meaning.split("\n").map((m) => `<div class="meaning">${esc(m)}</div>`).join("")}
    </div>`;
}

/** Render unique entries */
function renderUnique(u) {
  const pofs = u.qual.pofs;
  const form = dictionaryForm(u.de);

  return `
    <div class="entry-group unique">
      <div class="unique-tag">unique form</div>
      <div class="inflection-line">
        <span class="stem-ending"><span class="stem">${esc(u.word)}</span></span>
        ${posBadge(pofs)}
        <span class="grammar">${grammarHTML(u.qual)}</span>
      </div>
      <div class="dict-form">${esc(form)} <span class="dict-flags">${flags(u.de)}</span></div>
      <div class="meaning">${esc(u.de.mean)}</div>
    </div>`;
}

/** Render a full word analysis */
function renderWord(word, analysis) {
  const parts = [];

  // Unique results
  for (const u of analysis.uniqueResults) {
    parts.push(renderUnique(u));
  }

  // Build compound lookup by entryIndex
  const compoundMap = new Map();
  if (analysis.compoundResults) {
    for (const cr of analysis.compoundResults) {
      compoundMap.set(cr.entryIndex, cr);
    }
  }

  // Standard results grouped by entry, then merged by inflection pattern
  const groups = mergeByInflection(groupAndMerge(analysis.results));
  for (const group of groups) {
    const cr = compoundMap.get(group.results[0].entryIndex);
    parts.push(renderEntryGroup(group, "", cr));
  }

  // Slury (prefix assimilation) results
  if (analysis.sluryResult) {
    parts.push(`<div class="slury-note"><span class="slury-label">${esc(analysis.sluryResult.label)}</span> &mdash; <span class="slury-explanation">${esc(analysis.sluryResult.explanation)}</span></div>`);
    if (analysis.sluryResult.results.length > 0) {
      const sluryGroups = mergeByInflection(groupAndMerge(analysis.sluryResult.results));
      for (const group of sluryGroups) {
        parts.push(renderEntryGroup(group, "slury"));
      }
    }
  }

  // Syncope results
  if (analysis.syncopeResult) {
    const sr = analysis.syncopeResult;
    parts.push(`<div class="syncope-note"><span class="syncope-label">${esc(sr.label)}</span><span class="syncope-explanation">${esc(sr.explanation)}</span></div>`);
    const syncopeGroups = mergeByInflection(groupAndMerge(sr.results));
    for (const group of syncopeGroups) {
      parts.push(renderEntryGroup(group, "syncope"));
    }
  }

  // Trick results
  if (analysis.trickAnnotations?.length > 0) {
    parts.push(`<div class="trick-note">${analysis.trickAnnotations.map(esc).join(" &mdash; ")}</div>`);
  }
  if (analysis.trickResults?.length > 0) {
    const trickGroups = mergeByInflection(groupAndMerge(analysis.trickResults));
    for (const group of trickGroups) {
      parts.push(renderEntryGroup(group, "trick"));
    }
  }

  // Two-word split results
  if (analysis.twoWordResult) {
    const tw = analysis.twoWordResult;
    parts.push(`<div class="two-word-note"><span class="two-word-label">${esc(tw.label)}</span> &mdash; <span class="two-word-explanation">${esc(tw.explanation)}</span></div>`);
    if (tw.leftResults?.length > 0) {
      const leftGroups = mergeByInflection(groupAndMerge(tw.leftResults));
      for (const group of leftGroups) {
        parts.push(renderEntryGroup(group, "two-word"));
      }
    }
    const rightGroups = mergeByInflection(groupAndMerge(tw.rightResults));
    for (const group of rightGroups) {
      parts.push(renderEntryGroup(group, "two-word"));
    }
  }

  // Addon results
  if (analysis.addonResults?.length > 0) {
    for (const ar of analysis.addonResults) {
      const addonName = ar.type === "tackon" ? ar.addon.word : ar.addon.fix;
      parts.push(`<div class="addon-note"><span class="addon-type">${esc(ar.type.toUpperCase())}</span> <span class="addon-name">${esc(addonName)}</span> &mdash; ${esc(ar.addon.mean)}</div>`);
      const baseGroups = mergeByInflection(groupAndMerge(ar.baseResults));
      for (const group of baseGroups) {
        parts.push(renderEntryGroup(group, "addon"));
      }
    }
  }

  // Roman numeral
  if (analysis.romanNumeralResult) {
    const val = analysis.romanNumeralResult.value;
    parts.push(`
      <div class="entry-group roman-numeral">
        <div class="inflection-line">
          <span class="stem-ending"><span class="stem">${esc(word)}</span></span>
          ${posBadge("NUM")}
          <span class="grammar">${tip("CARD")}</span>
        </div>
        <div class="meaning">${esc(String(val))}  as a ROMAN NUMERAL</div>
      </div>`);
  }

  if (parts.length === 0) {
    parts.push(`<div class="no-results">No results found.</div>`);
  }

  return `<div class="word-card"><h3 class="word-title">${esc(word)}</h3>${parts.join("")}</div>`;
}

function parseInput() {
  if (!engine) return;
  const text = input.value.trim();
  if (!text) return;

  const t0 = performance.now();
  const analyses = engine.parseLine(text);
  const html = analyses.map((a) => renderWord(a.word, a));
  const elapsed = performance.now() - t0;

  const n = analyses.length;
  const timeStr = elapsed < 1 ? `${(elapsed * 1000).toFixed(0)} \u00b5s` : elapsed < 1000 ? `${elapsed.toFixed(1)} ms` : `${(elapsed / 1000).toFixed(2)} s`;
  html.push(`<div class="query-time">Parsed ${n} word${n !== 1 ? "s" : ""} in ${timeStr}</div>`);

  resultsEl.innerHTML = html.join("");
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") parseInput();
});
btn.addEventListener("click", parseInput);

// ---------------------------------------------------------------------------
// Theme toggle
// ---------------------------------------------------------------------------

const themeToggle = document.getElementById("theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}

// Init from saved preference or system preference
const saved = localStorage.getItem("theme");
if (saved) {
  applyTheme(saved);
} else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
  applyTheme("dark");
}

themeToggle.addEventListener("click", () => {
  document.body.classList.add("theme-transitioning");
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
  setTimeout(() => document.body.classList.remove("theme-transitioning"), 450);
});

init().catch((err) => {
  statusEl.classList.remove("loading");
  statusEl.textContent = `Error: ${err.message}`;
  console.error(err);
});
