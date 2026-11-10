/** One statement of the grid. */
export interface MatrixStatement {
  /** The key of the answer in the value. */
  id: string;
  /** The statement people rate: "I know what is expected of me". */
  text: string;
}

/** One point of the shared scale. */
export interface MatrixOption {
  /** What the value holds when this point is chosen. */
  value: string;
  /** The visible label of the column. */
  label: string;
}

/** The chosen point of each statement, by statement id: the `value` of an option. A statement with no entry is unanswered. */
export type MatrixValue = Record<string, string>;

/** The words the grid says, for translation. A `{name}` mark in a sentence is filled in. */
export interface LikertMatrixLabels {
  /** The heading of the statements column. Default "Statement". */
  statement?: string;
  /** The count in the header; `{answered}` and `{total}`. Default "{answered} of {total} answered". */
  answered?: string;
  /** Beside a statement that has no answer after a failed submit. Default "Choose one". */
  chooseOne?: string;
  /** The error for one statement. Default "1 statement still needs an answer". */
  missingOne?: string;
  /** The error for several; `{count}`. Default "{count} statements still need an answer". */
  missingMany?: string;
  /** What a form says when it refuses to submit. Default "Answer every statement". */
  gate?: string;
}

export const DEFAULT_LABELS = {
  statement: "Statement",
  answered: "{answered} of {total} answered",
  chooseOne: "Choose one",
  missingOne: "1 statement still needs an answer",
  missingMany: "{count} statements still need an answer",
  gate: "Answer every statement",
} satisfies Required<LikertMatrixLabels>;

export type Words = Required<LikertMatrixLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The scale as options: a plain word is its own label and value. */
export function normaliseOptions(options: readonly (string | MatrixOption)[]): MatrixOption[] {
  return options.map((option) => (typeof option === "string" ? { value: option, label: option } : option));
}

/** The keys that move between the points of a row, like the arrow keys of a radio group. */
export const ROW_KEYS = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"] as const;
