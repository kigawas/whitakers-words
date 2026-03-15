// ---------------------------------------------------------------------------
// Fixed-width field formatter — declarative column layouts matching Ada's Put.
//
// Ada uses fixed-width Ada.Text_IO.Put for each grammatical field. This module
// defines the column widths so formatting bugs (wrong padding) are prevented
// structurally rather than by manual .padEnd() calls.
// ---------------------------------------------------------------------------

export interface Field {
  readonly value: string;
  readonly width: number;
}

/** Format a sequence of fields into a single fixed-width string. */
export function formatFields(fields: readonly Field[]): string {
  let result = "";
  for (const f of fields) {
    result += f.value.padEnd(f.width);
  }
  return result;
}

/** Shorthand: create a Field. */
export function f(value: string | number, width: number): Field {
  return { value: String(value), width };
}

// ---------------------------------------------------------------------------
// Ada column widths (derived from Ada Default_Width constants)
// ---------------------------------------------------------------------------

/** POS name field: 7 chars ("N      ", "VPAR   ", "SUPINE ") */
export const POS_WIDTH = 7;

/** Declension which + var: "1 1 " = 2+2 = 4 chars */
export const DECL_WIDTH = 2;

/** Case field: variable, but typically 3-4 chars ("NOM ", "ACC ", "GEN ") */
export const CASE_WIDTH = 4;

/** Number field: 2 chars ("S ", "P ") */
export const NUMBER_WIDTH = 2;

/** Gender field: 2 chars ("M ", "F ", "N ", "X ") */
export const GENDER_WIDTH = 2;

/** Comparison field: no trailing space needed (last field for ADJ) */
export const COMPARISON_WIDTH = 0;

/** Tense field: 5 chars ("PRES ", "IMPF ", "FUT  ", "PERF ", "PLUP ", "FUTP ") */
export const TENSE_WIDTH = 5;

/** Voice field: 8 chars ("ACTIVE  ", "PASSIVE ") */
export const VOICE_WIDTH = 8;

/** Mood field for V: 4 chars ("IND ", "SUB ", "IMP ", "INF ") */
export const MOOD_WIDTH = 4;

/** Person field: 2 chars ("1 ", "2 ", "3 ", "0 ") */
export const PERSON_WIDTH = 2;

// ---------------------------------------------------------------------------
// Output layout constants (Ada's list_package formatting)
// ---------------------------------------------------------------------------

/** Stem.ending column: 21 chars — matches Ada's Put(Stem) + '.' + Put(Ending) field */
export const STEM_DOT_WIDTH = 21;

/** Column position where inflection age tag is appended */
export const AGE_TAG_COLUMN = 56;

/** Ada's Max_Meaning_Print_Size — meanings truncated to this width */
export const MAX_MEANING_SIZE = 79;

/** Terminal field width — no trailing padding (last field on a line) */
export const TERMINAL_WIDTH = 0;

/** Ada's null stem placeholder */
export const NULL_STEM = "zzz";
