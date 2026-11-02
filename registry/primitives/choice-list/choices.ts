import type { ReactNode } from "react";

export interface ChoiceOption {
  /** What the row submits and what the list reports. Unique in the list. */
  value: string;
  /** The row's name. A screen reader reads it as the name of the choice. */
  label: ReactNode;
  /** A line under the label. For a disabled row, say why it cannot be chosen. */
  description?: ReactNode;
  /** Something before the text: an icon (drawn at 20px) or an avatar. */
  media?: ReactNode;
  /** Something at the end of the row, such as a price or a count. It is read after the description. */
  trailing?: ReactNode;
  /** The row cannot be chosen. It stays in the list, dimmed, and its description can say why. */
  disabled?: boolean;
  /** In a list that allows several, choosing this clears the others and choosing any other clears this: "None of these". */
  exclusive?: boolean;
}

/** A value that may be a single choice, a list or nothing, as a list. */
export function asList(value: string | readonly string[] | null | undefined): readonly string[] {
  if (value === null || value === undefined || value === "") return [];
  return typeof value === "string" ? [value] : value;
}

/**
 * The choices after one row is switched on or off. An exclusive row clears every other when it is chosen,
 * and any other row clears the exclusive ones. The result keeps the order of the options, not the order
 * the person clicked in, so the same picks always report the same list.
 */
export function toggleChoice(current: readonly string[], options: readonly ChoiceOption[], value: string, on: boolean): string[] {
  const chosen = new Set(current);
  const option = options.find((candidate) => candidate.value === value);
  if (!on) chosen.delete(value);
  else if (option?.exclusive) {
    chosen.clear();
    chosen.add(value);
  } else {
    for (const candidate of options) if (candidate.exclusive) chosen.delete(candidate.value);
    chosen.add(value);
  }
  return options.filter((candidate) => chosen.has(candidate.value)).map((candidate) => candidate.value);
}

/** What a screen reader is told after a change in a list that allows several. */
export function countText(count: number): string {
  return count === 0 ? "None selected" : `${count} selected`;
}
