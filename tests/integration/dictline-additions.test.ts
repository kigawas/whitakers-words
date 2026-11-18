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
