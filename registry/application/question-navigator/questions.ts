/**
 * The words and the counting behind QuestionNavigator, as plain functions: they
 * hold no state and call no hook, so a Server Component can use them too. Every
 * number that is written goes through the locale.
 */

/** Whether a question has an answer. */
export type QuestionState = "unanswered" | "answered";

/** Which questions the grid lists. */
export type QuestionFilter = "all" | "unanswered" | "flagged";

/** One question of the quiz or survey. */
export interface NavigatorQuestion {
  /** A stable identity from your own records. `current` and `onSelect` use it. Unique within the list. */
  id: string;
  /** What the cell shows, usually the number: "7". */
  label: string;
  /** Whether it has an answer. */
  state: QuestionState;
  /** Marked for review. A question can be both answered and flagged. */
  flagged?: boolean;
}

/** The words the navigator says, for translation. `{answered}`, `{total}`, `{count}` and `{shown}` are filled in. */
export interface QuestionNavigatorLabels {
  /** Names the navigation landmark. Default "Questions". */
  navigation?: string;
  /** The word before a cell's number in its name: "Question 7, answered". Default "Question". */
  question?: string;
  /** In a cell's name when it has an answer. Default "answered". */
  answered?: string;
  /** In a cell's name when it has none. Default "unanswered". */
  unanswered?: string;
  /** In a cell's name when it is flagged. Default "flagged". */
  flagged?: string;
  /** In the name of the cell that is on screen. Default "current question". */
  current?: string;
  /** The summary; `{answered}` and `{total}`. Default "Answered {answered} of {total}". */
  summary?: string;
  /** Added to the summary when some are flagged; `{count}`. Default "{count} flagged". */
  flaggedCount?: string;
  /** The legend entry for an answered question. Default "Answered". */
  legendAnswered?: string;
  /** The legend entry for a question without an answer. Default "Unanswered". */
  legendUnanswered?: string;
  /** The legend entry for a flagged question. Default "Flagged for review". */
  legendFlagged?: string;
  /** The legend entry for the question on screen. Default "Current". */
  legendCurrent?: string;
  /** Names the group of filter buttons. Default "Show". */
  filter?: string;
  /** The filter that lists everything. Default "All". */
  filterAll?: string;
  /** The filter for questions without an answer. Default "Unanswered". */
  filterUnanswered?: string;
  /** The filter for flagged questions. Default "Flagged". */
  filterFlagged?: string;
  /** Shown in place of everything when there are no questions at all, for instance while they load. Default "There are no questions yet." */
  empty?: string;
  /** Shown in place of the grid when the unanswered filter lists nothing. Default "Every question has an answer." */
  noneUnanswered?: string;
  /** Shown when the flagged filter lists nothing. Default "No question is flagged." */
  noneFlagged?: string;
  /** Said to a screen reader after the summary when a filter is on; `{shown}` and `{total}`. Default "Showing {shown} of {total} questions." */
  showing?: string;
}

export const DEFAULT_LABELS = {
  navigation: "Questions",
  question: "Question",
  answered: "answered",
  unanswered: "unanswered",
  flagged: "flagged",
  current: "current question",
  summary: "Answered {answered} of {total}",
  flaggedCount: "{count} flagged",
  legendAnswered: "Answered",
  legendUnanswered: "Unanswered",
  legendFlagged: "Flagged for review",
  legendCurrent: "Current",
  filter: "Show",
  filterAll: "All",
  filterUnanswered: "Unanswered",
  filterFlagged: "Flagged",
  empty: "There are no questions yet.",
  noneUnanswered: "Every question has an answer.",
  noneFlagged: "No question is flagged.",
  showing: "Showing {shown} of {total} questions.",
} satisfies Required<QuestionNavigatorLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** How many questions each filter lists. */
export function counts(questions: readonly NavigatorQuestion[]): { all: number; answered: number; unanswered: number; flagged: number } {
  const answered = questions.filter((question) => question.state === "answered").length;
  return { all: questions.length, answered, unanswered: questions.length - answered, flagged: questions.filter((question) => question.flagged).length };
}

/** The questions a filter lists, in their order. */
export function visibleQuestions(questions: readonly NavigatorQuestion[], filter: QuestionFilter): readonly NavigatorQuestion[] {
  if (filter === "unanswered") return questions.filter((question) => question.state === "unanswered");
  if (filter === "flagged") return questions.filter((question) => question.flagged);
  return questions;
}

/** The name of a cell, in one phrase: "Question 7, answered, flagged, current question". */
export function nameOf(question: NavigatorQuestion, current: boolean, text: Required<QuestionNavigatorLabels>): string {
  return [`${text.question} ${question.label}`, question.state === "answered" ? text.answered : text.unanswered, ...(question.flagged ? [text.flagged] : []), ...(current ? [text.current] : [])].join(", ");
}

/** The summary line: "Answered 14 of 20, 2 flagged". */
export function summaryOf(questions: readonly NavigatorQuestion[], text: Required<QuestionNavigatorLabels>, locale: string): string {
  const { all, answered, flagged } = counts(questions);
  const number = new Intl.NumberFormat(locale);
  const base = fill(text.summary, { answered: number.format(answered), total: number.format(all) });
  return flagged > 0 ? `${base}, ${fill(text.flaggedCount, { count: number.format(flagged) })}` : base;
}

/** How many cells share the first row of the grid, which is how far an arrow key moves up or down. */
export function columnsOf(cells: readonly HTMLElement[]): number {
  const first = cells[0];
  if (!first) return 1;
  let across = 0;
  for (const cell of cells) {
    if (cell.offsetTop !== first.offsetTop) break;
    across += 1;
  }
  return Math.max(1, across);
}
