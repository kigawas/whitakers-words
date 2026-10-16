#!/usr/bin/env node

/**
 * Ada compatibility check — compares our CLI output against the original
 * Ada Whitaker's Words expected output for Aeneid Book IV.
 *
 * The match rate compares unique lines across the whole text. The per-word
 * recall then lists words that lack some of their Ada lines, including lines
 * the match rate counts because another word prints them.
 *
 * Usage:
 *   node scripts/ada-compat-check.mjs              # run CLI and compare
 *   node scripts/ada-compat-check.mjs --verbose    # show samples per category
 */

import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const verbose = process.argv.includes("--verbose");

// ---------------------------------------------------------------------------
// 1. Generate our output by piping aeneid input through CLI
// ---------------------------------------------------------------------------

const adaExpectedPath = resolve(root, "tests/original/aeneid-expected.txt");
const aeneidInputPath = resolve(root, "tests/original/aeneid-input.txt");

const adaText = readFileSync(adaExpectedPath, "utf-8");
const aeneidInput = readFileSync(aeneidInputPath, "utf-8");

console.log("Running CLI on Aeneid input...");
const ourText = execSync(`node ${resolve(root, "dist/cli/main.js")}`, {
  input: aeneidInput,
  encoding: "utf-8",
  maxBuffer: 50 * 1024 * 1024,
});

// ---------------------------------------------------------------------------
// 2. Parse into unique line sets
// ---------------------------------------------------------------------------

function parseLines(text) {
  const lines = new Set();
  for (const line of text.split("\n")) {
    const s = line.trimEnd();
    if (s && s !== "*" && s !== "=>") lines.add(s);
  }
  return lines;
}

const adaLines = parseLines(adaText);
const ourLines = parseLines(ourText);

const common = new Set([...adaLines].filter((l) => ourLines.has(l)));
const missing = new Set([...adaLines].filter((l) => !ourLines.has(l)));
const extra = new Set([...ourLines].filter((l) => !adaLines.has(l)));

// ---------------------------------------------------------------------------
// 3. Categorize missing lines
// ---------------------------------------------------------------------------

function categorizeMissing(line) {
  if (/PPL\+/.test(line)) return "compound_perf_passive";
  if (/Two words|May be 2 words/.test(line)) return "two_words";
  if (/Syncope|Syncopated/.test(line)) return "syncope";
  if (/Word mod|Slur|^An initial/.test(line)) return "trick_annotation";
  if (/-ly; -ily;/.test(line)) return "adv_suffix";
  if (/ROMAN NUMERAL/.test(line)) return "roman_numeral";
  if (/^\s+\d+\s/.test(line)) return "numeral_value";
  if (/^\s+\[.{5}\]/.test(line)) return "bare_flags";
  if (/=>/.test(line)) return "prompt_marker";
  if (/VPAR/.test(line) && /^\S+\s+VPAR/.test(line)) return "vpar_format";
  if (/V\s+\(\d/.test(line) || /V\s+(TRANS|INTRANS|DEP|SEMIDEP|IMPERS|PERFDEF|TO_BE)/.test(line))
    return "verb_dict_form";
  if (/ADJ\s+\[/.test(line) || /\(gen\.\)/.test(line)) return "adj_dict_form";
  if (/N\s+(M|F|N|C)\s+\[/.test(line) || /N\s+\(\d/.test(line)) return "noun_dict_form";
  if (/^\S+\s+V\s+\d/.test(line)) return "verb_inflection";
  if (/^\S+\s+(N|PRON|PACK|NUM)\s+\d/.test(line)) return "nominal_inflection";
  if (/^\S+\s+ADJ\s+\d/.test(line)) return "adj_inflection";
  if (/^\(/.test(line) || (line[0]?.match(/[a-z]/) && /,/.test(line) && /V |ADJ|N /.test(line)))
    return "dict_form_other";
  if (line[0]?.match(/[a-z(]/)) return "meaning_text";
  return "other";
}

const NEW_FEATURES = new Set([
  "compound_perf_passive",
  "two_words",
  "syncope",
  "trick_annotation",
  "adv_suffix",
  "roman_numeral",
  "prompt_marker",
]);

// ---------------------------------------------------------------------------
// 4. Categorize extra lines
// ---------------------------------------------------------------------------

function categorizeExtra(line) {
  if (/^\S+\s+VPAR/.test(line)) return "extra_vpar";
  if (/^\S+\s+SUPINE/.test(line)) return "extra_supine";
  if (/^\S+\s+V\s+\d/.test(line)) return "extra_verb_inflection";
  if (/^\S+\s+N\s+\d/.test(line)) return "extra_noun_inflection";
  if (/^\S+\s+ADJ\s+\d/.test(line)) return "extra_adj_inflection";
  if (/^\S+\s+ADV/.test(line)) return "extra_adv";
  if (/^\S+\s+(PRON|PACK|NUM)/.test(line)) return "extra_pron_num";
  if (/V\s+\(/.test(line) || /V\s+(TRANS|INTRANS)/.test(line)) return "extra_verb_dict";
  if (/ADJ\s+\[/.test(line)) return "extra_adj_dict";
  if (/N\s+\(\d/.test(line) || /N\s+(M|F|N)\s+\[/.test(line)) return "extra_noun_dict";
  if (/\[/.test(line) && /\]/.test(line)) return "extra_dict_form";
  if (/;/.test(line) && line.length > 30) return "extra_meaning";
  return "extra_other";
}

// ---------------------------------------------------------------------------
// 5. Build category maps
// ---------------------------------------------------------------------------

const missCats = {};
for (const line of missing) {
  const cat = categorizeMissing(line);
  (missCats[cat] ??= []).push(line);
}

const extraCats = {};
for (const line of extra) {
  const cat = categorizeExtra(line);
  (extraCats[cat] ??= []).push(line);
}

// ---------------------------------------------------------------------------
// 6. Per-word recall
// ---------------------------------------------------------------------------

/**
 * Ada's output as one block per word. Ada ends each word with a blank or `*`
 * line, and prompts `=>` before each input line. When a line's first word is
 * unknown, its UNKNOWN line follows the prompt on the same line.
 */
function adaWordBlocks(text) {
  const blocks = [];
  let block = [];
  for (const raw of text.split("\n")) {
    let line = raw.trimEnd();
    if (line === "" || line === "*" || line.startsWith("=>")) {
      if (block.length > 0) blocks.push(block);
      block = [];
      line = line.replace(/^=>(Blank exits =>)?/, "");
      if (line === "" || line === "*") continue;
    }
    block.push(line);
  }
  if (block.length > 0) blocks.push(block);
  return blocks;
}

/**
 * Our output as one block per word, from the engine calls the CLI makes. Each
 * input line is cut at "--", as Ada's String_Before_Dash does
 * (words_engine-parse.adb), so the words pair with Ada's in order.
 */
async function ourWordBlocks(input) {
  const { createEngine, formatWordAnalysis } = await import(
    pathToFileURL(resolve(root, "dist/node/index.js")).href
  );
  const engine = createEngine();
  const blocks = [];
  for (const raw of input.split(/\r?\n/)) {
    const dash = raw.indexOf("--");
    const line = dash > 0 ? raw.slice(0, dash) : raw;
    for (const analysis of engine.parseLine(line)) {
      const lines = formatWordAnalysis(analysis).split("\n").map((l) => l.trimEnd());
      blocks.push({ word: analysis.word, lines: new Set(lines) });
    }
  }
  return blocks;
}

const UNKNOWN = /========\s+UNKNOWN$/;

const adaWords = adaWordBlocks(adaText);
const ourWords = await ourWordBlocks(aeneidInput);
const wordsPaired = adaWords.length === ourWords.length;

// Words that lack Ada lines, grouped by word and the lines they lack.
const wordGaps = new Map();
let adaUnknown = 0;
if (wordsPaired) {
  for (const [k, ada] of adaWords.entries()) {
    if (UNKNOWN.test(ada[0])) {
      adaUnknown++;
      continue;
    }
    const ours = ourWords[k];
    const lost = [...new Set(ada)].filter((l) => !ours.lines.has(l));
    if (lost.length === 0) continue;
    const key = `${ours.word}\n${lost.join("\n")}`;
    const gap = wordGaps.get(key) ?? { word: ours.word, lost, count: 0 };
    gap.count++;
    wordGaps.set(key, gap);
  }
}

// A gap is hidden when the match rate counts its lines: another word prints them.
const gaps = [...wordGaps.values()]
  .map((g) => ({ ...g, hidden: g.lost.filter((l) => ourLines.has(l)) }))
  .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));
const hiddenGaps = gaps.filter((g) => g.hidden.length > 0);
const countWords = (list) => list.reduce((n, g) => n + g.count, 0);

// ---------------------------------------------------------------------------
// 7. Print report
// ---------------------------------------------------------------------------

const HR = "=".repeat(80);

console.log();
console.log(HR);
console.log("AENEID COMPATIBILITY REPORT");
console.log(HR);
console.log(`Ada unique lines:  ${adaLines.size.toLocaleString()}`);
console.log(`Our unique lines:  ${ourLines.size.toLocaleString()}`);
console.log(`Common (matched):  ${common.size.toLocaleString()}`);
console.log(`Missing (Ada-only):${missing.size.toLocaleString()}`);
console.log(`Extra (ours-only): ${extra.size.toLocaleString()}`);
console.log(`Match rate:        ${((common.size / adaLines.size) * 100).toFixed(1)}%`);

// Missing breakdown
console.log();
console.log(HR);
console.log("MISSING (Ada has, we don't)");
console.log(HR);

const sortedMiss = Object.entries(missCats).sort((a, b) => b[1].length - a[1].length);
for (const [cat, lines] of sortedMiss) {
  const tag = NEW_FEATURES.has(cat) ? "NEW FEATURE" : "FORMAT/CONTENT";
  console.log(`\n  ${cat}: ${lines.length} lines [${tag}]`);
  const head = 10;
  if (verbose) {
    for (const l of lines.sort().slice(0, head)) console.log(`    ${l.slice(0, 75)}`);
    if (lines.length > head) console.log(`    ... +${lines.length - head} more`);
  }
}

// Extra breakdown
console.log();
console.log(HR);
console.log("EXTRA (we have, Ada doesn't — our improvements)");
console.log(HR);

const sortedExtra = Object.entries(extraCats).sort((a, b) => b[1].length - a[1].length);
for (const [cat, lines] of sortedExtra) {
  console.log(`\n  ${cat}: ${lines.length} lines`);
  const head = 3;
  if (verbose) {
    for (const l of lines.sort().slice(0, head)) console.log(`    ${l.slice(0, 75)}`);
    if (lines.length > head) console.log(`    ... +${lines.length - head} more`);
  }
}

// Per-word recall
console.log();
console.log(HR);
console.log("PER-WORD RECALL (each word's Ada lines, against our lines for that word)");
console.log(HR);
if (!wordsPaired) {
  console.log(
    `Skipped: Ada prints ${adaWords.length} words, we print ${ourWords.length}, so they don't pair in order.`,
  );
} else {
  console.log(`Words compared:     ${(adaWords.length - adaUnknown).toLocaleString()}`);
  console.log(`Ada UNKNOWN:        ${adaUnknown} (not compared)`);
  console.log(`Missing Ada lines:  ${countWords(gaps)} words (${gaps.length} distinct)`);
  console.log(`  hidden by the match rate: ${countWords(hiddenGaps)} words`);

  console.log("\n  Hidden: Ada lines we print only under other words");
  for (const g of hiddenGaps) {
    const more = g.hidden.length > 1 ? ` (+${g.hidden.length - 1})` : "";
    console.log(`    ${`${g.word} ×${g.count}`.padEnd(18)} ${g.hidden[0].slice(0, 55)}${more}`);
  }

  if (verbose) {
    console.log("\n  All words missing Ada lines (~ = we print it under another word)");
    for (const g of gaps) {
      console.log(`    ${g.word} ×${g.count}`);
      for (const l of g.lost) console.log(`      ${ourLines.has(l) ? "~" : " "} ${l.slice(0, 75)}`);
    }
  }
}

// Summary table
console.log();
console.log(HR);
console.log("SUMMARY");
console.log(HR);
console.log(`Match rate: ${((common.size / adaLines.size) * 100).toFixed(1)}%`);
console.log(
  `Missing:    ${missing.size} lines (${((missing.size / adaLines.size) * 100).toFixed(1)}% of Ada)`,
);
console.log(`Extra:      ${extra.size} lines (our improvements over Ada)`);
if (wordsPaired) {
  console.log(
    `Per word:   ${countWords(gaps)} words miss Ada lines, ${countWords(hiddenGaps)} of them hidden by the match rate`,
  );
}

console.log();
console.log("Missing by category:");
for (const [cat, lines] of sortedMiss) {
  const pct = ((lines.length / missing.size) * 100).toFixed(1);
  console.log(`  ${cat.padEnd(25)} ${String(lines.length).padStart(4)} (${pct.padStart(5)}%)`);
}

console.log();
console.log("Extra by category:");
for (const [cat, lines] of sortedExtra) {
  const pct = ((lines.length / extra.size) * 100).toFixed(1);
  console.log(`  ${cat.padEnd(25)} ${String(lines.length).padStart(4)} (${pct.padStart(5)}%)`);
}

// Exit with non-zero if match rate < 95%
const matchRate = (common.size / adaLines.size) * 100;
if (matchRate < 95) {
  console.log(`\n⚠ Match rate ${matchRate.toFixed(1)}% is below 95% threshold`);
  process.exit(1);
}
console.log(`\n✓ Match rate ${matchRate.toFixed(1)}% meets 95% threshold`);
