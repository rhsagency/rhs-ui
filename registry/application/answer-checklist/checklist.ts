/** One statement to answer. */
export interface ChecklistItem {
  /** The key of the answer in the value. */
  id: string;
  /** The statement: "Fire exits are clear and signposted". */
  label: string;
  /** What to look for, under the statement. It is read with the statement, so write it for both. */
  hint?: string;
  /** What the note field asks for when this one needs a note. Default "What did you find?". */
  notePlaceholder?: string;
}

/** One answer the people checking can give. */
export interface ChecklistOption {
  /** What the value holds when this answer is chosen. */
  value: string;
  /** The word on the button and in the row's status. */
  label: string;
  /** The shape of the mark beside the statement: a check for `pass`, a cross for `fail`, a ring with a dash for `skip`. Without one the row is marked with a check, as answered. */
  tone?: "pass" | "fail" | "skip";
}

/** The answer to one statement and the note that goes with it. */
export interface ChecklistAnswer {
  /** The `value` of the chosen option, or null while it is open. */
  answer: string | null;
  /** What was written. It is kept when the answer changes to one that needs no note. */
  note?: string;
}

/** Every answer, by statement id. A statement that is missing is open. */
export type ChecklistValue = Record<string, ChecklistAnswer>;

/** The words the checklist says, for translation. A `{name}` mark in a sentence is filled in. */
export interface AnswerChecklistLabels {
  /** The count while something is left; `{answered}` and `{total}`. Default "{answered} of {total} answered". */
  summary?: string;
  /** The count when everything is answered and no note is missing; `{total}`. Default "All {total} answered". */
  summaryDone?: string;
  /** Added to the count for one note. Default "1 note missing". */
  noteOne?: string;
  /** Added to the count for several; `{count}`. Default "{count} notes missing". */
  noteMany?: string;
  /** The button that moves to the first open row. Default "Jump to next unanswered". */
  jump?: string;
  /** The status of a row with no answer. Default "Not answered". */
  unanswered?: string;
  /** The status of a row whose answer needs a note that is still empty. Default "Note required". */
  noteRequired?: string;
  /** The label of a note field. Default "Note". */
  note?: string;
  /** Beside the label of a note field that must be filled. Default "required". */
  required?: string;
  /** The placeholder of a note field when the item gives none. Default "What did you find?". */
  notePlaceholder?: string;
  /** Names the thin bar that counts the answers. Default "Answered". */
  progress?: string;
}

export const DEFAULT_LABELS = {
  summary: "{answered} of {total} answered",
  summaryDone: "All {total} answered",
  noteOne: "1 note missing",
  noteMany: "{count} notes missing",
  jump: "Jump to next unanswered",
  unanswered: "Not answered",
  noteRequired: "Note required",
  note: "Note",
  required: "required",
  notePlaceholder: "What did you find?",
  progress: "Answered",
} satisfies Required<AnswerChecklistLabels>;

export type Words = Required<AnswerChecklistLabels>;

/** Pass, fail or not applicable: the usual three answers of an inspection. */
export const DEFAULT_OPTIONS: readonly ChecklistOption[] = [
  { value: "pass", label: "Pass", tone: "pass" },
  { value: "fail", label: "Fail", tone: "fail" },
  { value: "na", label: "Not applicable", tone: "skip" },
];

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** How far each arrow key moves along the answers of a row: forward for right and down, back for left and up. */
export const ARROW_STEPS: Readonly<Record<string, 1 | -1>> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };

/** Where a row stands: still open, answered but waiting for its note, or done. */
export type RowState = "open" | "needs-note" | "answered";

export function stateOf(answer: ChecklistAnswer | undefined, noteOn: readonly string[]): RowState {
  if (!answer || answer.answer === null || answer.answer === "") return "open";
  return noteOn.includes(answer.answer) && !(answer.note ?? "").trim() ? "needs-note" : "answered";
}
