#!/usr/bin/env node

import { createInterface } from "node:readline";
import { dictionaryForm } from "../lib/formatter/dictionary-form.js";
import { createEngine } from "../node/index.js";

const engine = createEngine();

function processLatinLine(line: string): void {
  const cleaned = line.replace(/[^a-zA-Z]/g, " ");
  const words = cleaned.split(/\s+/).filter((w) => w.length > 0);

  for (const word of words) {
    const output = engine.formatWord(word);
    if (output.length > 0) {
      process.stdout.write(output);
      process.stdout.write("\n");
    }
  }
}

function processEnglishLine(word: string): void {
  const trimmed = word.trim();
  if (trimmed.length === 0) return;

  process.stdout.write("=>\n");
  const results = engine.searchEnglish(trimmed, 6);
  if (results.length === 0) {
    process.stdout.write(`No matches found for "${trimmed}"\n`);
  } else {
    for (const r of results) {
      const form = dictionaryForm(r.de);
      const flags = `[${r.de.tran.age}${r.de.tran.area}${r.de.tran.geo}${r.de.tran.freq}${r.de.tran.source}]`;
      process.stdout.write(`${form}   ${flags}  \n`);
      process.stdout.write(`${r.de.mean}\n`);
      process.stdout.write("\n");
    }
  }
  process.stdout.write("*\n");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let englishMode = false;

  if (args.length > 0) {
    const input = args.join(" ");
    if (input.startsWith("~E") || input.startsWith("~e")) {
      englishMode = true;
      const rest = input.slice(2).trim();
      if (rest.length > 0) processEnglishLine(rest);
    } else {
      processLatinLine(input);
    }
    return;
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: process.stdin.isTTY === true,
    prompt: process.stdin.isTTY ? "=> " : "",
  });

  if (process.stdin.isTTY) {
    process.stdout.write("Whitaker's Words (TypeScript)\n");
    process.stdout.write('Type a Latin word, "~E" for English mode, Ctrl+D to quit.\n\n');
    rl.prompt();
  }

  rl.on("line", (line: string) => {
    const trimmed = line.trim();
    if (trimmed === "~E" || trimmed === "~e") {
      englishMode = true;
      if (process.stdin.isTTY) process.stdout.write("English-to-Latin mode\n");
    } else if (trimmed === "~L" || trimmed === "~l") {
      englishMode = false;
      if (process.stdin.isTTY) process.stdout.write("Latin-to-English mode\n");
    } else if (trimmed.length > 0) {
      if (englishMode) processEnglishLine(trimmed);
      else processLatinLine(trimmed);
    }
    if (process.stdin.isTTY) rl.prompt();
  });

  rl.on("close", () => process.exit(0));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
