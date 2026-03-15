import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const CLI = resolve(import.meta.dirname, "../../src/cli/main.ts");
const TSX = resolve(import.meta.dirname, "../../node_modules/.bin/tsx");

// shell: true is needed on Windows where .bin/tsx is a .cmd file that
// execFile can't run directly without a shell.
const execOpts = { timeout: 15_000, shell: process.platform === "win32" };

function run(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((res) => {
    execFile(TSX, [CLI, ...args], execOpts, (err, stdout, stderr) => {
      res({
        stdout,
        stderr,
        code: err?.code === undefined ? 0 : (err as unknown as { code: number }).code,
      });
    });
  });
}

function runStdin(input: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((res) => {
    const child = execFile(TSX, [CLI], execOpts, (_err, stdout, stderr) => {
      res({ stdout, stderr });
    });
    child.stdin?.write(input);
    child.stdin?.end();
  });
}

// ---------------------------------------------------------------------------
// Argument mode: Latin → English
// ---------------------------------------------------------------------------
describe("CLI: Latin argument mode", () => {
  it("parses a common noun (aquam)", async () => {
    const { stdout } = await run(["aquam"]);
    expect(stdout).toContain("water");
    expect(stdout).toContain("N");
    expect(stdout).toContain("ACC");
  });

  it("parses a verb (amo)", async () => {
    const { stdout } = await run(["amo"]);
    expect(stdout).toContain("love");
    expect(stdout).toContain("V");
  });

  it("parses a multi-word line (visa est)", async () => {
    const { stdout } = await run(["visa", "est"]);
    expect(stdout).toContain("PPL+est");
    expect(stdout).toContain("PERF PASSIVE");
  });

  it("returns empty output for unknown word", async () => {
    const { stdout } = await run(["xyzzyplugh"]);
    expect(stdout.trim()).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Argument mode: English → Latin (~E)
// ---------------------------------------------------------------------------
describe("CLI: English argument mode (~E)", () => {
  it("searches English word", async () => {
    const { stdout } = await run(["~E", "water"]);
    expect(stdout).toContain("=>");
    expect(stdout).toContain("water");
    expect(stdout).toContain("*");
  });

  it("~e (lowercase) also works", async () => {
    const { stdout } = await run(["~e", "love"]);
    expect(stdout).toContain("=>");
    expect(stdout).toContain("*");
  });

  it("reports no matches for unknown English word", async () => {
    const { stdout } = await run(["~E", "xyzzyplugh"]);
    expect(stdout).toContain("No matches found");
  });

  it("~E with no word produces no output", async () => {
    const { stdout } = await run(["~E"]);
    expect(stdout.trim()).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Stdin (piped) mode
// ---------------------------------------------------------------------------
describe("CLI: stdin piped mode", () => {
  it("processes multiple Latin words", async () => {
    const { stdout } = await runStdin("aquam\namo\n");
    expect(stdout).toContain("water");
    expect(stdout).toContain("love");
  });

  it("switches to English mode with ~E and back with ~L", async () => {
    const { stdout } = await runStdin("~E\nwater\n~L\naqua\n");
    expect(stdout).toContain("=>");
    expect(stdout).toContain("*");
    // After ~L, should parse Latin again
    expect(stdout).toContain("N");
  });

  it("skips blank lines", async () => {
    const { stdout } = await runStdin("\n\naqua\n\n");
    expect(stdout).toContain("water");
  });
});
