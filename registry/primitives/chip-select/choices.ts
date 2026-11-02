import type { ReactNode } from "react";

/** One chip. */
export interface ChipOption {
  /** What the chip reports when it is chosen. */
  value: string;
  /** The words on the chip, and its accessible name. */
  label: string;
  /** A small glyph before the label, such as `<IconStar />`. A chosen chip swaps it for a check. */
  icon?: ReactNode;
  /** This chip cannot be chosen or removed. */
  disabled?: boolean;
}

/** What the line under the chips is built from. */
export interface ChipCounts {
  /** Whether one chip or several can be chosen. */
  mode: "single" | "multiple";
  /** How many chips are chosen. */
  count: number;
  /** The fewest that must be chosen, when there is a rule. */
  min?: number;
  /** The most that can be chosen, when there is a rule. */
  max?: number;
}

/** The words the group says, for another language or your own voice. */
export interface ChipSelectLabels {
  /** The line under the chips: the rule, then how many are chosen ("Pick up to 5, 3 chosen"). Return "" for no line. */
  hint: (counts: ChipCounts) => string;
  /** Said before the line when it has turned into an error, for a screen reader. Default "Error: ". */
  errorPrefix: string;
}

/** "Pick up to 5, 3 chosen", "Pick at least 3", "Pick 3 to 5", "Pick exactly 2": the rule first, then the count. One choice only needs a line while it is required and not yet made: "Pick one". */
export function defaultHint({ mode, count, min, max }: ChipCounts): string {
  if (mode === "single") return min && count === 0 ? "Pick one" : "";
  const rule =
    min !== undefined && max !== undefined
      ? min === max
        ? `Pick exactly ${min}`
        : `Pick ${min} to ${max}`
      : max !== undefined
        ? `Pick up to ${max}`
        : min !== undefined
          ? `Pick at least ${min}`
          : "";
  if (!rule) return "";
  return count > 0 ? `${rule}, ${count} chosen` : rule;
}

export const DEFAULT_LABELS: ChipSelectLabels = { hint: defaultHint, errorPrefix: "Error: " };

/** A value or a list of values as a list: `null` and `undefined` are no choice. */
export const asList = (value: string | readonly string[] | null | undefined): readonly string[] =>
  value === null || value === undefined ? [] : typeof value === "string" ? [value] : value;

/** The chosen values in the order of the chips, so the list a form reports never depends on the order of the clicks. */
export function inOrder(options: readonly ChipOption[], chosen: readonly string[]): string[] {
  return options.map((option) => option.value).filter((value) => chosen.includes(value));
}
