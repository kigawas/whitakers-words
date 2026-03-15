import { createEngine, formatWordAnalysis } from "whitakers-words/node";

console.time("Engine init");
const engine = createEngine();
console.timeEnd("Engine init");

console.log(
  `Loaded: ${engine.dictionarySize} dict entries, ${engine.inflectionCount} inflections, ${engine.uniqueCount} uniques`,
);
console.log(
  `Addons: ${engine.addons.prefixes.length} prefixes, ${engine.addons.suffixes.length} suffixes, ${engine.addons.tackons.length} tackons`,
);
console.log();

const testWords = [
  "aquam", "amo", "bonus", "rex", "regis", "in", "et",
  "puella", "amat", "amavit", "laudare", "bellum",
  "magnus", "vir", "hominem", "memento",
];

for (const word of testWords) {
  const analysis = engine.parseWord(word);
  console.log(formatWordAnalysis(analysis));
  console.log();
}
