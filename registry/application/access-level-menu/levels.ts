/**
 * The words and the small decisions behind AccessLevelMenu, as plain types and
 * functions: they hold no state, so a Server Component can use them too.
 */

/** One level of access that can be given to a person or a link. */
export interface AccessLevel {
  /** A stable identity from your own data: "editor". It is what `value` and `onValueChange` carry. Unique in the list. */
  id: string;
  /** What people call it: "Editor". */
  label: string;
  /** One line on what it allows: "Can edit, comment and share". It sits under the label in the menu. */
  description?: string;
}

/** A level the person may not be given, with the reason. The reason is written under the level in the menu. */
export interface DisabledLevel {
  /** The `id` of the level. */
  id: string;
  /** Why it is not on offer: "Only the owner can hand over ownership". */
  reason: string;
}

/** The words the menu says, for translation. `{subject}` and `{level}` are filled in. */
export interface AccessLevelLabels {
  /** The title inside the menu. Default "Access level". */
  menu?: string;
  /** The button's accessible name when `subject` is set. Default "Access for {subject}: {level}". */
  buttonFor?: string;
  /** The button's accessible name without a subject. Default "Access level: {level}". */
  button?: string;
  /** The reason written under a locked level when `lockedReason` is not given. Default "This access cannot be changed." */
  lockedReason?: string;
  /** The menu entry that takes access away. Default "Remove access". */
  remove?: string;
  /** The title of the confirmation step. Default "Remove access?" */
  confirmTitle?: string;
  /** The sentence under it. Default "{subject} will lose access right away." */
  confirmBody?: string;
  /** What stands for the person in that sentence when there is no `subject`. Default "This person". */
  someone?: string;
  /** The destructive answer. Default "Yes, remove access". */
  confirmAction?: string;
  /** The safe answer, which has focus first. Default "Keep access". */
  keep?: string;
  /** Said when a change went through, with a `subject`. Default "{subject}: access is now {level}." */
  changedFor?: string;
  /** The same without a subject. Default "Access is now {level}." */
  changed?: string;
  /** Said when access was removed, with a `subject`. Default "Access removed for {subject}." */
  removedFor?: string;
  /** The same without a subject. Default "Access removed." */
  removed?: string;
  /** Shown and said when a change was refused. `{level}` is the level it went back to. Default "Could not change access. It is still {level}." */
  failed?: string;
  /** Shown and said when removing failed. Default "Could not remove access. Nothing was changed." */
  removeFailed?: string;
  /** Said while a change is being saved. Default "Saving". */
  saving?: string;
  /** Said while access is being removed. Default "Removing access". */
  removing?: string;
}

export const DEFAULT_LABELS = {
  menu: "Access level",
  buttonFor: "Access for {subject}: {level}",
  button: "Access level: {level}",
  lockedReason: "This access cannot be changed.",
  remove: "Remove access",
  confirmTitle: "Remove access?",
  confirmBody: "{subject} will lose access right away.",
  someone: "This person",
  confirmAction: "Yes, remove access",
  keep: "Keep access",
  changedFor: "{subject}: access is now {level}.",
  changed: "Access is now {level}.",
  removedFor: "Access removed for {subject}.",
  removed: "Access removed.",
  failed: "Could not change access. It is still {level}.",
  removeFailed: "Could not remove access. Nothing was changed.",
  saving: "Saving",
  removing: "Removing access",
} satisfies Required<AccessLevelLabels>;

/** Puts values into a template: `fill("Access is now {level}.", { level: "Editor" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** Whether a handler returned a promise, so a quick answer does not flash a busy state. */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

/** The message a refused change carries, when it carries one worth showing: an `Error` with text. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message.trim() : "";
}
