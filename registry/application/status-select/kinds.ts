import type { ReactNode } from "react";

/**
 * The shape of a status. The six shapes differ in drawing as well as weight,
 * so they tell the states apart without colour: a dashed ring, a ring, a
 * half-filled ring, a ring filled three quarters, a solid disc with a check
 * and a ring with a cross.
 */
export type StatusKind = "backlog" | "todo" | "progress" | "review" | "done" | "cancelled";

/** The six kinds, from not started to finished, for a legend or a test. */
export const STATUS_KINDS: readonly StatusKind[] = ["backlog", "todo", "progress", "review", "done", "cancelled"];

export interface StatusOption {
  /** What the select reports when this one is chosen. */
  value: string;
  /** The word beside the marker. */
  label: string;
  /** Which marker is drawn. Leave it out when you pass a `marker` of your own. */
  kind?: StatusKind;
  /** The quiet heading the option sits under, such as "Open" or "Closed". Options with the same group are listed together, in the order the groups first appear. */
  group?: string;
  /** A marker of your own, drawn instead of the one for `kind`: priority bars, a stage number. It should be 16px, decorative and drawn in `currentColor`. */
  marker?: ReactNode;
}

export interface StatusGroup {
  /** The heading, or undefined for options that have no group. */
  name: string | undefined;
  options: { option: StatusOption; shortcut: number }[];
}

/** The options gathered under their groups, each with the number key that picks it: 1 for the first in the list, 2 for the next. */
export function groupStatuses(statuses: readonly StatusOption[]): StatusGroup[] {
  const groups: StatusGroup[] = [];
  for (const option of statuses) {
    let group = groups.find((candidate) => candidate.name === option.group);
    if (!group) {
      group = { name: option.group, options: [] };
      groups.push(group);
    }
    group.options.push({ option, shortcut: 0 });
  }
  let number = 0;
  for (const group of groups) for (const entry of group.options) entry.shortcut = ++number;
  return groups;
}
