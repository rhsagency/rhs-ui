/**
 * The words of WizardFooter and the little pieces of logic around them, as
 * plain functions: they hold no state and call no hook, so a Server Component
 * can use them too.
 */

/** The words the footer says, for translation. `{step}` and `{count}` are filled in. */
export interface WizardFooterLabels {
  /** The step context beside the buttons. Default "Step {step} of {count}". */
  stepOf?: string;
  /** The Back button. Default "Back". */
  back?: string;
  /** The Skip button. Default "Skip". */
  skip?: string;
  /** The Continue button before the last step. Default "Next". */
  next?: string;
  /** The Continue button on the last step. Default "Finish". */
  finish?: string;
  /** Said when Continue or Skip failed without a message of its own. Default "Something went wrong. Try again." */
  failed?: string;
}

export const DEFAULT_LABELS = {
  stepOf: "Step {step} of {count}",
  back: "Back",
  skip: "Skip",
  next: "Next",
  finish: "Finish",
  failed: "Something went wrong. Try again.",
} satisfies Required<WizardFooterLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The step to show: a whole number from 1 up to the number of steps, whatever came in. */
export function clampStep(step: number, count: number): number {
  const last = Math.max(1, Math.floor(Number.isFinite(count) ? count : 1));
  const wanted = Math.round(Number.isFinite(step) ? step : 1);
  return Math.min(last, Math.max(1, wanted));
}

/** What to tell a person when an action threw: the message of an Error, or the fallback for anything else. */
export function messageOf(error: unknown, fallback: string): string {
  return error instanceof Error && error.message.trim() ? error.message.trim() : fallback;
}
