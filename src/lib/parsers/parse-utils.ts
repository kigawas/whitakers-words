import type { Variant, Which } from "../types/enums.js";
import type { DecnRecord } from "../types/inflections.js";

// ---------------------------------------------------------------------------
// Parser utilities — small combinator functions for structured field extraction.
// ---------------------------------------------------------------------------

/**
 * Fixed-width field reader for DICTLINE.GEN format.
 * Reads fields sequentially by column position.
 */
export class FixedReader {
  private pos = 0;
  constructor(private readonly line: string) {}

  /** Read a fixed-width field, trimming trailing spaces. */
  field(width: number): string {
    const v = this.line.slice(this.pos, this.pos + width).trimEnd();
    this.pos += width;
    return v;
  }

  /** Skip N characters. */
  skip(n = 1): this {
    this.pos += n;
    return this;
  }

  /** Read remaining characters, trimmed. */
  rest(): string {
    return this.line.slice(this.pos).trimEnd();
  }

  /** Current position. */
  get offset(): number {
    return this.pos;
  }
}

/**
 * Token-based reader for space-delimited formats (INFLECTS.LAT, ADDONS.LAT, UNIQUES.LAT).
 * Reads tokens sequentially with type-safe accessors.
 */
export class TokenReader {
  private pos: number;
  constructor(
    private readonly tokens: readonly string[],
    start = 0,
  ) {
    this.pos = start;
  }

  /** Read next token as string, defaulting to "X" if past end. */
  str(): string {
    return this.tokens[this.pos++] ?? "X";
  }

  /** Read next token as integer, defaulting to 0 if past end or NaN. */
  int(): number {
    const n = Number.parseInt(this.str(), 10);
    return Number.isNaN(n) ? 0 : n;
  }

  /** Read a declension/conjugation record (which, var) from the next 2 tokens. */
  decn(): DecnRecord {
    return { which: this.int() as Which, var: this.int() as Variant };
  }

  /** Peek at the next token without advancing. */
  peek(): string {
    return this.tokens[this.pos] ?? "";
  }

  /** Number of remaining tokens. */
  get remaining(): number {
    return this.tokens.length - this.pos;
  }

  /** Current position in the token array. */
  get offset(): number {
    return this.pos;
  }
}
