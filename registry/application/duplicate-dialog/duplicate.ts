/**
 * The decisions behind the duplicate dialog, as plain functions with no state and no hook: the name a copy starts with,
 * whether a name is taken, and the sentence that says what will be copied.
 */

/** One thing that can come along with the copy: the tasks of a project, the files of a board. */
export interface DuplicateOption {
  /** A stable identity: `onDuplicate` receives the ids of the ones that are ticked. */
  id: string;
  /** What it is, as the row names it: "Tasks". */
  label: string;
  /** How much there is of it: 48. Shown on the row, and counted in the sentence at the foot. */
  count?: number;
  /** What one and several of it are called in that sentence: `{ one: "task", other: "tasks" }`. Without it the lower-cased label is used. */
  unit?: { one: string; other: string };
  /** Ticked when the dialog opens. */
  defaultChecked?: boolean;
  /** Cannot be changed: it stays as `defaultChecked` says. Give a `reason`. */
  disabled?: boolean;
  /** Why it cannot be changed, said on the row: "Needs the Business plan". */
  reason?: string;
}

/** The words the dialog says, for translation. Use `{kind}`, `{name}`, `{list}` and `{count}` where the defaults do. */
export interface DuplicateLabels {
  /** The title. Default "Duplicate {kind}". */
  title?: string;
  /** The line under it. Default "Make a copy of {name} that you can change without touching the original." */
  description?: string;
  /** The label of the name field. Default "Name". */
  name?: string;
  /** The word a suggested name ends with: "Halcyon launch (copy)". Default "copy". */
  copy?: string;
  /** What is said when the name is already used. Default "A {kind} called {name} already exists." */
  taken?: string;
  /** The button that takes the free name. Default "Use {name}". */
  useName?: string;
  /** What is said when the name field is empty and Duplicate is pressed. Default "Enter a name for the copy." */
  empty?: string;
  /** The heading over the options. Default "What to copy". */
  include?: string;
  /** The sentence at the foot. `{list}` is "48 tasks and 12 files". Default "Copies {list}". */
  copies?: string;
  /** The sentence when nothing is ticked. Default "Creates an empty {kind}". */
  copiesNothing?: string;
  /** The button that starts the copy. Default "Duplicate". */
  duplicate?: string;
  /** The button after a failure. Default "Try again". */
  retry?: string;
  /** The button that leaves. Default "Cancel". */
  cancel?: string;
  /** Said while the copy is made. Default "Duplicating". */
  duplicating?: string;
  /** The heading of the message after a failure. Default "Could not create the copy". */
  failed?: string;
  /** The message when the failure carries none. Default "Nothing was copied, and what you chose is still here." */
  failedBody?: string;
  /** The title once it is done. Default "Copy created". */
  done?: string;
  /** The line under it. `{name}` is the new name. Default "{name} is ready." */
  doneBody?: string;
  /** The link to the copy. Default "Open {kind}". */
  open?: string;
  /** The button that closes the dialog afterwards. Default "Done". */
  close?: string;
  /** The name of the corner button. Default "Close". */
  closeIcon?: string;
}

export const DEFAULT_LABELS = {
  title: "Duplicate {kind}",
  description: "Make a copy of {name} that you can change without touching the original.",
  name: "Name",
  copy: "copy",
  taken: "A {kind} called {name} already exists.",
  useName: "Use {name}",
  empty: "Enter a name for the copy.",
  include: "What to copy",
  copies: "Copies {list}",
  copiesNothing: "Creates an empty {kind}",
  duplicate: "Duplicate",
  retry: "Try again",
  cancel: "Cancel",
  duplicating: "Duplicating",
  failed: "Could not create the copy",
  failedBody: "Nothing was copied, and what you chose is still here.",
  done: "Copy created",
  doneBody: "{name} is ready.",
  open: "Open {kind}",
  close: "Done",
  closeIcon: "Close",
} satisfies Required<DuplicateLabels>;

/** Puts values into a template: `fill("Use {name}", { name: "Halcyon (copy 2)" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Whether a name is already used, ignoring case and the spaces around it. */
export function isTaken(name: string, existing: readonly string[]): boolean {
  return name.trim() !== "" && existing.some((other) => same(other, name));
}

/**
 * The name a copy starts with: "Halcyon launch (copy)", and when that is taken "Halcyon launch (copy 2)", then 3, and so on, so
 * the first thing a person sees is a name that can be used as it is.
 */
export function suggestName(source: string, existing: readonly string[], copy: string): string {
  const first = `${source} (${copy})`;
  if (!isTaken(first, existing)) return first;
  for (let number = 2; number < 1000; number += 1) {
    const next = `${source} (${copy} ${number})`;
    if (!isTaken(next, existing)) return next;
  }
  return `${source} (${copy} ${Date.now()})`;
}

const escapePattern = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The nearest name that is free, for the button that steers around a clash. A name that ends in "(copy)" or "(copy 2)" counts
 * the copies up, "Halcyon launch (copy 3)"; any other name gets a number, "Roadmap (2)".
 */
export function freeName(name: string, existing: readonly string[], copy: string): string {
  const base = name.trim();
  if (!isTaken(base, existing)) return base;
  const tail = new RegExp(`^(.*\\S)\\s+\\(${escapePattern(copy)}(?:\\s+(\\d+))?\\)$`, "i").exec(base);
  const start = tail ? (tail[2] ? Number(tail[2]) + 1 : 2) : 2;
  for (let number = start; number < 1000; number += 1) {
    const next = tail ? `${tail[1]} (${copy} ${number})` : `${base} (${number})`;
    if (!isTaken(next, existing)) return next;
  }
  return `${base} (${Date.now()})`;
}

/** The words of whatever was thrown: a string, or the message of an error or of any object that has one. */
export function messageOf(thrown: unknown): string | null {
  const text = typeof thrown === "string" ? thrown : (thrown as { message?: unknown } | null | undefined)?.message;
  return typeof text === "string" && text.trim() ? text : null;
}

/**
 * What the footer says will happen: "Copies 48 tasks and 12 files". Each ticked option is its count and its unit, or just its
 * name when it has no count, and the list is joined the way the locale joins lists.
 */
export function copySummary(options: readonly DuplicateOption[], checked: ReadonlySet<string>, locale: string, labels: Required<DuplicateLabels>, kind: string): string {
  const parts = options
    .filter((option) => checked.has(option.id))
    .map((option) => {
      const name = option.label.toLowerCase();
      if (option.count === undefined) return name;
      let one = false;
      try {
        one = new Intl.PluralRules(locale).select(option.count) === "one";
      } catch {
        one = option.count === 1;
      }
      const noun = option.unit ? (one ? option.unit.one : option.unit.other) : name;
      let figure = String(option.count);
      try {
        figure = new Intl.NumberFormat(locale).format(option.count);
      } catch {
        // an unknown locale: the plain digits are fine
      }
      return `${figure} ${noun}`;
    });
  if (!parts.length) return fill(labels.copiesNothing, { kind });
  let list = parts.join(", ");
  try {
    list = new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(parts);
  } catch {
    // an unknown locale: commas are fine
  }
  return fill(labels.copies, { list });
}
