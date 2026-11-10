/**
 * The words and the counting behind TaskList, as plain functions: they hold no
 * state and call no hook, so a Server Component can use them too. Every number
 * that is written goes through the locale, so the server and the browser say
 * the same thing.
 */

/** Where one section stands. `cannot-start` is not a link: it waits for something else and says what. */
export type TaskStatus = "completed" | "in-progress" | "not-started" | "needs-attention" | "cannot-start";

/** One part of the job. */
export interface TaskSection {
  /** A stable identity from your own records. Unique within the list. */
  id: string;
  /** The name of the section: "Business details". */
  title: string;
  /** Where the work for this section is done. Without one the row is not a link, whatever its status. */
  href?: string;
  /** Where it stands. */
  status: TaskStatus;
  /** A line under the title: what is left, when it is due. For `cannot-start` it is the reason: "Finish your identity check first". */
  hint?: string;
}

/** The words the list says, for translation. `{done}`, `{total}` and `{count}` are filled in. */
export interface TaskListLabels {
  /** Names the list for a screen reader when there is no `heading`. Default "Sections". */
  list?: string;
  /** The status of a finished section. Default "Completed". */
  completed?: string;
  /** Default "In progress". */
  inProgress?: string;
  /** Default "Not started". */
  notStarted?: string;
  /** Default "Needs attention". */
  needsAttention?: string;
  /** Default "Cannot start yet". */
  cannotStart?: string;
  /** The summary above the list; `{done}` and `{total}`. Default "{done} of {total} sections complete". */
  summary?: string;
  /** Added to the summary when one section needs attention; `{count}`. Default "{count} needs attention". */
  attentionOne?: string;
  /** The same for several. Default "{count} need attention". */
  attentionMany?: string;
}

export const DEFAULT_LABELS = {
  list: "Sections",
  completed: "Completed",
  inProgress: "In progress",
  notStarted: "Not started",
  needsAttention: "Needs attention",
  cannotStart: "Cannot start yet",
  summary: "{done} of {total} sections complete",
  attentionOne: "{count} needs attention",
  attentionMany: "{count} need attention",
} satisfies Required<TaskListLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The status in words. */
export function statusWord(status: TaskStatus, text: Required<TaskListLabels>): string {
  switch (status) {
    case "completed":
      return text.completed;
    case "in-progress":
      return text.inProgress;
    case "not-started":
      return text.notStarted;
    case "needs-attention":
      return text.needsAttention;
    case "cannot-start":
      return text.cannotStart;
  }
}

/** How many sections are finished, how many there are and how many need attention. */
export function tally(sections: readonly TaskSection[]): { done: number; total: number; attention: number } {
  return {
    done: sections.filter((section) => section.status === "completed").length,
    total: sections.length,
    attention: sections.filter((section) => section.status === "needs-attention").length,
  };
}

/** The line above the list: "3 of 6 sections complete", and "1 needs attention" after it when there is such a section. */
export function summaryOf(sections: readonly TaskSection[], text: Required<TaskListLabels>, locale: string): string {
  const { done, total, attention } = tally(sections);
  const number = new Intl.NumberFormat(locale);
  const base = fill(text.summary, { done: number.format(done), total: number.format(total) });
  if (attention === 0) return base;
  return `${base}, ${fill(attention === 1 ? text.attentionOne : text.attentionMany, { count: number.format(attention) })}`;
}
