import type { ReactNode } from "react";

/**
 * The types, the words and the small rules behind AccordionSteps, as plain
 * functions: they hold no state and call no hook, so a Server Component can use
 * them too.
 */

/** Whether a step is done. The component never changes it: you hold it, because you hold the form. */
export type StepState = "complete" | "incomplete";

/** One step of the flow. */
export interface AccordionStep {
  /** A stable identity from your own records. `current`, `onStepChange` and `onContinue` use it. Unique within the list. */
  id: string;
  /** The name of the step, its heading: "Delivery address". */
  title: string;
  /** What a completed step shows under its title: "Mara Visser, Halden Street 14, Utrecht". It wraps to a second line and is cut with an ellipsis after that. */
  summary?: ReactNode;
  /** The step's form or choices. It is on the page only while the step is open, so keep what people type in your own state or a form library rather than in uncontrolled fields. */
  content: ReactNode;
  /** Whether it is done. Default "incomplete". A step that is complete can be opened again to edit and the steps after it stay as they are. */
  state?: StepState;
  /** The text of this step's button. Default "Continue", and "Finish" on the last step. */
  continueLabel?: string;
}

/** The words the list says, for translation. `{step}`, `{count}` and `{title}` are filled in. */
export interface AccordionStepsLabels {
  /** Names the list for a screen reader. Default "Steps". */
  list?: string;
  /** Said before a step's title: "Step 2 of 4". Default "Step {step} of {count}". */
  stepOf?: string;
  /** The word on a completed step you can open again. Default "Edit". */
  edit?: string;
  /** Said to a screen reader after the title of a completed step. Default "completed". */
  completed?: string;
  /** Said to a screen reader after the title of the step that is open and not done: the one being filled in. Default "current step". */
  current?: string;
  /** Said to a screen reader after the title of a step that is not done and not open. Default "not started". */
  notStarted?: string;
  /** Under the title of a step that cannot be opened yet; `{title}` is the step that comes first. Default "Complete {title} first". */
  lockedReason?: string;
  /** The button of a step. Default "Continue". */
  continue?: string;
  /** The button of the last step. Default "Finish". */
  finish?: string;
  /** What the button says while it checks. Default "Checking". */
  checking?: string;
  /** Said when `onContinue` failed without a message of its own. Default "This step could not be saved. Try again." */
  failed?: string;
}

export const DEFAULT_LABELS = {
  list: "Steps",
  stepOf: "Step {step} of {count}",
  edit: "Edit",
  completed: "completed",
  current: "current step",
  notStarted: "not started",
  lockedReason: "Complete {title} first",
  continue: "Continue",
  finish: "Finish",
  checking: "Checking",
  failed: "This step could not be saved. Try again.",
} satisfies Required<AccordionStepsLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The index of the first step that is not done, or -1 when every step is. Steps after it that are not done are locked until it is. */
export function frontierOf(steps: readonly AccordionStep[]): number {
  return steps.findIndex((step) => step.state !== "complete");
}

/** Where to go after the step at `index` was continued: the next step that is not done, then the first one before it that is not done, and nowhere (null) when everything is. Counted as if the step at `index` is done now. */
export function nextAfter(steps: readonly AccordionStep[], index: number): string | null {
  const after = steps.findIndex((step, at) => at > index && step.state !== "complete");
  const target = after !== -1 ? after : steps.findIndex((step, at) => at < index && step.state !== "complete");
  return target === -1 ? null : (steps[target]?.id ?? null);
}

/** What to tell a person when an action threw: the message of an Error, or the fallback for anything else. */
export function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
}
