/**
 * The marking behind QuizOptions, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too (to mark an answer on
 * the server before it is shown, so the page never ships the right ones).
 */

/** One answer to choose from. */
export interface QuizOption {
  /** What the value holds when this option is chosen. */
  value: string;
  /** The words of the option. */
  label: string;
  /** One line that says why the option is right or wrong. It appears under the option once the question is checked, and is read out then. */
  reason?: string;
}

/** Where the question stands: still being answered, or locked in and marked. */
export type QuizStatus = "answering" | "checked";

/** What an option is marked with once the question is checked. */
export type QuizMark = "correct" | "incorrect" | "missed" | "answer";

/** The words the question says, for translation. */
export interface QuizOptionsLabels {
  /** The line by the button while one answer is wanted. Default "Choose one answer". */
  hintOne?: string;
  /** The same when several are. Default "Choose all that apply". */
  hintMany?: string;
  /** The button that locks the answer in. Default "Check answer". */
  check?: string;
  /** The button that starts the question again. Default "Try again". */
  tryAgain?: string;
  /** The mark of a right answer you chose. Default "Correct". */
  correct?: string;
  /** The mark of a wrong answer you chose. Default "Your answer, incorrect". */
  incorrect?: string;
  /** The mark of a right answer you left out, when several are right. Default "Missed". */
  missed?: string;
  /** The mark of the right answer you did not choose, when only one is right. Default "Correct answer". */
  answer?: string;
  /** The line that replaces the hint once the question is checked. Default "Answer locked in". */
  locked?: string;
  /** Said first when the question is checked, ahead of what each option says. Default "Answer checked". */
  checked?: string;
}

export const DEFAULT_LABELS = {
  hintOne: "Choose one answer",
  hintMany: "Choose all that apply",
  check: "Check answer",
  tryAgain: "Try again",
  correct: "Correct",
  incorrect: "Your answer, incorrect",
  missed: "Missed",
  answer: "Correct answer",
  locked: "Answer locked in",
  checked: "Answer checked",
} satisfies Required<QuizOptionsLabels>;

export type Words = Required<QuizOptionsLabels>;

/** The correct answers as a list, whether one value or several were given. */
export function answersOf(correct: string | readonly string[]): string[] {
  return typeof correct === "string" ? [correct] : [...correct];
}

/** Whether two lists hold the same values, whatever their order. */
export function sameSet(a: readonly string[], b: readonly string[]): boolean {
  const left = new Set(a);
  const right = new Set(b);
  return left.size === right.size && [...left].every((value) => right.has(value));
}

/**
 * What one option is marked with. A chosen option is correct or incorrect. An
 * option that is not chosen is marked only when it was one of the right
 * answers: "missed" when several answers are right, and "answer" when only one
 * is, where "missed" would read oddly. Every other option has no mark.
 */
export function markOf(value: string, chosen: readonly string[], answers: readonly string[], several: boolean): QuizMark | null {
  const picked = chosen.includes(value);
  const right = answers.includes(value);
  if (picked) return right ? "correct" : "incorrect";
  return right ? (several ? "missed" : "answer") : null;
}
