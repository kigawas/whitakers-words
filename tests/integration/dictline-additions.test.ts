import { describe, expect, it } from "vitest";
import { createEngine } from "../../src/node";

const engine = createEngine();

function outputLines(word: string): string[] {
  return engine
    .formatWord(word)
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);
}

// Entries the port adds to DICTLINE.GEN, where Ada's dictionary lacks them
// and so misreads the word (#39). Each keeps Ada's readings beside the new one.
describe("DICTLINE.GEN: entries Ada's dictionary lacks", () => {
  it("sectam: the noun secta, beside seco's participle", () => {
    const lines = outputLines("sectam");
    expect(lines).toContainEqual("sect.am              N      1 1 ACC S F");
    expect(lines).toContainEqual("secta, sectae  N (1st) F   [XXXCS]");
    expect(lines).toContainEqual("sect.am              VPAR   1 1 ACC S F PERF PASSIVE PPL");
  });

  it("lusus: the noun lusus, beside ludo's participle", () => {
    const lines = outputLines("lusus");
    expect(lines).toContainEqual("lus.us               N      4 1 NOM S M");
    expect(lines).toContainEqual("lusus, lusus  N (4th) M   [XXXCS]");
    expect(lines).toContainEqual("lus.us               VPAR   3 1 NOM S M PERF PASSIVE PPL");
  });

  it("exanclavi: exanclo, not ex + anclo 'serve (wine)'", () => {
    expect(outputLines("exanclavi")).toEqual([
      "exanclav.i           V      1 1 PERF ACTIVE  IND 1 S",
      "exanclo, exanclare, exanclavi, exanclatus  V (1st) TRANS   [BXXDS]    Early  lesser",
      "draw out, drain (liquid); shed (blood); endure to the end, suffer through;",
    ]);
  });

  it("nequissimae: the SUPER of nequam, not Two words (nequis + simae)", () => {
    const lines = outputLines("nequissimae");
    expect(lines).toContainEqual("nequissi.mae         ADJ    0 0 NOM P F SUPER");
    expect(lines).toContainEqual("nequissimus, nequissima, nequissimum  ADJ   [XXXCO]");
    expect(lines).not.toContainEqual("Two words");
  });

  it("nequiorem: the COMP of nequam, not nequeo + the -or SUFFIX", () => {
    expect(outputLines("nequiorem")).toEqual([
      "nequi.orem           ADJ    0 0 ACC S C COMP",
      "nequior, nequior, nequius  ADJ   [XXXCO]",
      "more wicked/licentious/depraved/vile; worse; more useless/worthless; (nequam);",
    ]);
  });

  it("nequius: the neuter COMP, which Ada doesn't know", () => {
    expect(outputLines("nequius")).toContainEqual("nequi.us             ADJ    0 0 NOM S N COMP");
  });

  it("nequior: the COMP beside Ada's undeclined line, with their one meaning once", () => {
    expect(outputLines("nequior")).toEqual([
      "nequi.or             ADJ    0 0 NOM S C COMP",
      "nequi.or             ADJ    0 0 VOC S C COMP",
      "nequior, nequior, nequius  ADJ   [XXXCO]",
      "nequior              ADJ    9 9 X   X X POS",
      "nequior, undeclined  ADJ   [XXXCO]",
      "more wicked/licentious/depraved/vile; worse; more useless/worthless; (nequam);",
    ]);
  });
});

// INFLECTS.LAT gives the N 2 7 genitive ending yos a length of 2, so no word
// read with it, in Ada or the port, and four -ys nouns kept a stem 2 in -y,
// against the stem its comment gives ("chelys chel").
describe("the Greek genitive in -yos", () => {
  it.each([
    ["chelyos", "chel.yos             N      2 7 GEN S F                   infreq"],
    ["amphibrachyos", "amphibrach.yos       N      2 7 GEN S M                   infreq"],
    ["botryos", "botr.yos             N      2 7 GEN S M                   infreq"],
    ["chrysophryos", "chrysophr.yos        N      2 7 GEN S F                   infreq"],
    ["dibrachyos", "dibrach.yos          N      2 7 GEN S F                   infreq"],
    ["tribrachyos", "tribrach.yos         N      2 7 GEN S M                   infreq"],
  ])("%s reads as the genitive", (word, line) => {
    expect(outputLines(word)).toContainEqual(line);
  });

  it("chelyos: only the genitive, no longer an ACC P of stem chely", () => {
    expect(outputLines("chelyos")).toEqual([
      "chel.yos             N      2 7 GEN S F                   infreq",
      "chelys, chelyos  N F   [XAXCO]",
      "tortoise; lyre/harp (made originally from a tortoise shell); constellation Lyra",
    ]);
  });

  it("chelyn: the accusative in -yn too, beside Ada's unique", () => {
    const lines = outputLines("chelyn");
    expect(lines).toContainEqual(
      "chel.yn              N      2 7 ACC S F                   infreq",
    );
    expect(lines).toContainEqual("chelyn               N      9 9 ACC S F");
  });

  it.each([
    ["chely", "chel.y               N      2 7 VOC S F                   infreq"],
    ["botry", "botr.y               N      2 7 VOC S M                   infreq"],
    ["amphibrachy", "amphibrach.y         N      2 7 VOC S M                   infreq"],
  ])("%s: the vocative is stem 2 + y, as the row's 'chelys L+S' gives it", (word, line) => {
    expect(outputLines(word)).toContainEqual(line);
  });

  it("chel, amphibrach: a bare stem 2 is no vocative", () => {
    expect(outputLines("chel")).toEqual([]);
    expect(outputLines("amphibrach")).toEqual([]);
  });

  it("echus: echo's genitive, a unique as Ada has chely and chelyn, since no 2 7 ending gives it", () => {
    expect(outputLines("echus")).toEqual([
      "echus                N      2 7 GEN S F",
      "echus  X   [XXXBO]",
      "echo; (nymph); repeating words/phrases; same phrase at start and end of speech;",
    ]);
  });
});
