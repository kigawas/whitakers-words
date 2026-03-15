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

async function loadFile(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
  return res.text();
}

async function init() {
  statusEl.classList.add("loading");
  const t0 = performance.now();

  const [dictline, inflects, addons, uniques] = await Promise.all([
    loadFile("/data/DICTLINE.GEN"),
    loadFile("/data/INFLECTS.LAT"),
    loadFile("/data/ADDONS.LAT"),
    loadFile("/data/UNIQUES.LAT"),
  ]);

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

/** CSS class for a POS badge */
function posClass(pofs) {
  return `pos-${pofs.toLowerCase()}`;
}

/** Format grammatical details from a quality record */
function grammarText(qual) {
  switch (qual.pofs) {
    case "N":
      return `${qual.noun.cs} ${qual.noun.number} ${qual.noun.gender}`;
    case "PRON":
      return `${qual.pron.cs} ${qual.pron.number} ${qual.pron.gender}`;
    case "PACK":
      return `${qual.pack.cs} ${qual.pack.number} ${qual.pack.gender}`;
    case "ADJ":
      return `${qual.adj.cs} ${qual.adj.number} ${qual.adj.gender} ${qual.adj.comparison}`;
    case "NUM":
      return `${qual.num.cs} ${qual.num.number} ${qual.num.gender} ${qual.num.sort}`;
    case "ADV":
      return qual.adv.comparison;
    case "V":
      return `${qual.verb.tenseVoiceMood.tense} ${qual.verb.tenseVoiceMood.voice} ${qual.verb.tenseVoiceMood.mood} ${qual.verb.person} ${qual.verb.number}`;
    case "VPAR":
      return `${qual.vpar.cs} ${qual.vpar.number} ${qual.vpar.gender} ${qual.vpar.tenseVoiceMood.tense} ${qual.vpar.tenseVoiceMood.voice} PPL`;
    case "SUPINE":
      return `${qual.supine.cs} ${qual.supine.number} ${qual.supine.gender}`;
    case "PREP":
      return qual.prep.cs;
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

/** Escape HTML */
function esc(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Flags string */
function flags(de) {
  const t = de.tran;
  return `[${t.age}${t.area}${t.geo}${t.freq}${t.source}]`;
}

/** Render a merged entry group ({ results, meaning }) */
function renderEntryGroup(group, extraClass = "") {
  const first = group.results[0];
  const inflLines = group.results
    .map((r) => {
      const pofs = r.ir.qual.pofs;
      const label = POS_LABELS[pofs] || pofs.toLowerCase();
      return `
      <div class="inflection-line">
        <span class="stem-ending">${stemEndingHTML(r.stem, r.ir.ending.suf)}</span>
        <span class="pos-badge ${posClass(pofs)}">${label}</span>
        <span class="grammar">${esc(grammarText(r.ir.qual))}</span>
      </div>`;
    })
    .join("");

  const form = dictionaryForm(first.de);

  return `
    <div class="entry-group ${extraClass}">
      ${inflLines}
      <div class="dict-form">${esc(form)}<span class="dict-flags">${flags(first.de)}</span></div>
      <div class="meaning">${esc(group.meaning)}</div>
    </div>`;
}

/** Render unique entries */
function renderUnique(u) {
  const pofs = u.qual.pofs;
  const label = POS_LABELS[pofs] || pofs.toLowerCase();
  const form = dictionaryForm(u.de);

  return `
    <div class="entry-group unique">
      <div class="unique-tag">unique form</div>
      <div class="inflection-line">
        <span class="stem-ending"><span class="stem">${esc(u.word)}</span></span>
        <span class="pos-badge ${posClass(pofs)}">${label}</span>
        <span class="grammar">${esc(grammarText(u.qual))}</span>
      </div>
      <div class="dict-form">${esc(form)}<span class="dict-flags">${flags(u.de)}</span></div>
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

  // Standard results grouped by entry
  const groups = groupAndMerge(analysis.results);
  for (const group of groups) {
    parts.push(renderEntryGroup(group));
  }

  // Trick results
  if (analysis.trickResults?.length > 0) {
    const trickGroups = groupAndMerge(analysis.trickResults);
    for (const group of trickGroups) {
      parts.push(renderEntryGroup(group));
    }
  }

  // Addon results
  if (analysis.addonResults?.length > 0) {
    for (const ar of analysis.addonResults) {
      const baseGroups = groupAndMerge(ar.baseResults);
      for (const group of baseGroups) {
        parts.push(renderEntryGroup(group));
      }
    }
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

  const words = text.replace(/[^a-zA-Z]/g, " ").split(/\s+/).filter(Boolean);
  const html = [];

  for (const word of words) {
    const analysis = engine.parseWord(word);
    html.push(renderWord(word, analysis));
  }

  resultsEl.innerHTML = html.join("");
}

// ---------------------------------------------------------------------------
// Event wiring
// ---------------------------------------------------------------------------

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") parseInput();
});
btn.addEventListener("click", parseInput);

init().catch((err) => {
  statusEl.classList.remove("loading");
  statusEl.textContent = `Error: ${err.message}`;
  console.error(err);
});
