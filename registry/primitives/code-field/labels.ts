/**
 * The words the field says, for another language or your own voice. Each can be
 * replaced. The messages that name a mistake in the JSON ("Unexpected token }
 * at line 4, column 3") come from the checker and are in English; show your
 * own from `onValidate` if you need them in another language.
 */
export interface CodeFieldLabels {
  /** The name of a JSON field for a screen reader when it has no label, id or aria-label of its own. */
  jsonName: string;
  /** The name of any other field for a screen reader when it has no label, id or aria-label of its own. */
  codeName: string;
  /** The label above the field's language, on the bar that holds the Format button. */
  languageJson: string;
  /** The button that pretty-prints valid JSON. */
  format: string;
  /** The verdict on valid JSON, in the status row. */
  valid: string;
  /** The verdict on JSON with a mistake. */
  invalid: string;
  /** The verdict on a text with nothing in it. */
  empty: string;
  /** The link in the message that puts the caret at the mistake. */
  goTo: (line: number) => string;
  /** Where the caret is, in the status row; `selected` is how many characters are selected. */
  position: (line: number, column: number, selected: number) => string;
  /** How long the text is. */
  characters: (count: number) => string;
  /** The hint under the field, after the Tab key: "indents." */
  hintIndents: string;
  /** The hint, between the Esc key and the Tab key: "then". */
  hintThen: string;
  /** The hint, after the second Tab key: "leaves the field." */
  hintLeaves: string;
  /** The hint while the next Tab is the browser's own. */
  hintEscaped: string;
  /** What a screen reader hears after Escape. */
  saidEscaped: string;
  /** What a screen reader hears after Format. */
  saidFormatted: string;
  /** What a screen reader hears after Format on text that is formatted already. */
  saidAlready: string;
}

export const DEFAULT_LABELS: CodeFieldLabels = {
  jsonName: "JSON",
  codeName: "Code",
  languageJson: "JSON",
  format: "Format",
  valid: "Valid JSON",
  invalid: "Invalid JSON",
  empty: "Empty",
  goTo: (line) => `Go to line ${line}`,
  position: (line, column, selected) => `Ln ${line}, Col ${column}${selected > 0 ? ` (${selected} selected)` : ""}`,
  characters: (count) => `${count} ${count === 1 ? "character" : "characters"}`,
  hintIndents: "indents.",
  hintThen: "then",
  hintLeaves: "leaves the field.",
  hintEscaped: "Tab now leaves the field.",
  saidEscaped: "Tab now moves the focus out of the field.",
  saidFormatted: "Formatted.",
  saidAlready: "Already formatted.",
};
