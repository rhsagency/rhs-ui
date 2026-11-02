import type { ReactNode } from "react";

export interface ListboxOption {
  /** What the option reports when it is chosen. Unique in the list. */
  value: string;
  /** The words of the option, and its accessible name. Search and typeahead read them. */
  label: string;
  /** A second line under the label. Search reads it too. */
  description?: string;
  /** A glyph before the label, such as `<IconGlobe />`. */
  icon?: ReactNode;
  /** The option cannot be chosen. Arrow keys and typeahead skip it. */
  disabled?: boolean;
  /** The heading of the group the option belongs to. Options with the same group are shown together, under one sticky heading. */
  group?: string;
}

export interface ListboxGroup {
  /** The heading, or null for options that have no group. */
  label: string | null;
  options: readonly ListboxOption[];
}

/** Lower case, without accents: "Zürich" is found by "zurich". */
const fold = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** The options that match a search: every word typed must be in the label or the description. */
export function filterOptions(options: readonly ListboxOption[], query: string): readonly ListboxOption[] {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return options;
  return options.filter((option) => {
    const text = fold(`${option.label} ${option.description ?? ""}`);
    return words.every((word) => text.includes(word));
  });
}

/** The options in groups, in the order the groups first appear. Options of one group are gathered, in their own order. */
export function groupOptions(options: readonly ListboxOption[]): ListboxGroup[] {
  const groups = new Map<string | null, ListboxOption[]>();
  for (const option of options) {
    const key = option.group ?? null;
    const members = groups.get(key);
    if (members) members.push(option);
    else groups.set(key, [option]);
  }
  return [...groups].map(([label, members]) => ({ label, options: members }));
}

/**
 * The parts of a text that a search matches, as offsets into it, in order and without overlap. Case and accents are ignored, as they are by
 * `filterOptions`: "zurich" marks the whole of "Zürich". The text is folded one character at a time, so a hit maps back to where it was.
 */
export function matchRanges(text: string, query: string): [number, number][] {
  const needles = fold(query).split(/\s+/).filter(Boolean);
  if (needles.length === 0) return [];
  const chars = [...text];
  const origin: number[] = [];
  const owner: number[] = [];
  let folded = "";
  let offset = 0;
  chars.forEach((char, index) => {
    origin.push(offset);
    offset += char.length;
    const plain = fold(char);
    for (let unit = 0; unit < plain.length; unit += 1) owner.push(index);
    folded += plain;
  });
  origin.push(offset);
  const found: [number, number][] = [];
  for (const needle of needles) {
    for (let at = folded.indexOf(needle); at !== -1; at = folded.indexOf(needle, at + needle.length)) {
      const first = owner[at];
      const last = owner[at + needle.length - 1];
      if (first === undefined || last === undefined) continue;
      found.push([origin[first] ?? 0, origin[last + 1] ?? text.length]);
    }
  }
  found.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const range of found) {
    const previous = merged[merged.length - 1];
    if (previous && range[0] <= previous[1]) previous[1] = Math.max(previous[1], range[1]);
    else merged.push([range[0], range[1]]);
  }
  return merged;
}

/**
 * Where typing a letter goes. One letter, typed again and again, steps through
 * the options that start with it; several letters find the first option that
 * starts with all of them, beginning at the one that is active.
 */
export function typeahead(options: readonly ListboxOption[], typed: string, from: number): number {
  const text = fold(typed);
  if (!text) return -1;
  const cycling = [...text].every((letter) => letter === text[0]);
  const prefix = cycling ? text[0]! : text;
  const start = cycling ? from + 1 : Math.max(from, 0);
  for (let step = 0; step < options.length; step += 1) {
    const index = (start + step + options.length) % options.length;
    if (fold(options[index]!.label).startsWith(prefix)) return index;
  }
  return -1;
}

/** The values of a list in the order of the options, without any that are no longer there. */
export const inOrder = (options: readonly ListboxOption[], chosen: Iterable<string>): string[] => {
  const set = new Set(chosen);
  return options.filter((option) => set.has(option.value)).map((option) => option.value);
};
