import type { ComboboxOption } from "@rhs-ui/primitives/combobox";

/** An option is the same shape as a Combobox option, so a list can move between the two: value, label, and optionally keywords, a description, a group and `disabled`. */
export type CreatableOption = ComboboxOption;

/** The value of a field that allows several, or of one that allows one, as a list. */
export function asList(value: string | readonly string[] | null | undefined): readonly string[] {
  if (value === null || value === undefined || value === "") return [];
  return typeof value === "string" ? [value] : value;
}

/** How two texts are compared to tell whether something already exists: no capitals, no spaces at the ends, one space between words. */
export const defaultNormalise = (text: string): string => text.trim().replace(/\s+/g, " ").toLowerCase();

const fold = (text: string): string => text.normalize("NFD").replace(/\p{M}+/gu, "").toLowerCase();

/** The option that already says what was typed: the same label or the same value once both are normalised. */
export function findExact(options: readonly CreatableOption[], typed: string, normalise: (text: string) => string): CreatableOption | undefined {
  const wanted = normalise(typed);
  if (!wanted) return undefined;
  return options.find((option) => normalise(option.label) === wanted || normalise(option.value) === wanted);
}

/**
 * The options that match what was typed, best first: the one that says exactly that, then those that
 * begin with it, those with a word that begins with it, and those that only contain it. Within a rank the
 * order you gave is kept. With nothing typed every option is listed, in your order.
 */
export function rankOptions(options: readonly CreatableOption[], typed: string, normalise: (text: string) => string): CreatableOption[] {
  const wanted = fold(typed.trim());
  if (!wanted) return [...options];
  const ranked: { option: CreatableOption; rank: number; order: number }[] = [];
  options.forEach((option, order) => {
    if (findExact([option], typed, normalise)) {
      ranked.push({ option, rank: 0, order });
      return;
    }
    let best: number | null = null;
    for (const text of [option.label, ...(option.keywords ?? [])]) {
      const haystack = fold(text);
      const at = haystack.indexOf(wanted);
      if (at < 0) continue;
      const rank = at === 0 ? 1 : /[\s\-_(/]/.test(haystack.charAt(at - 1)) ? 2 : 3;
      if (best === null || rank < best) best = rank;
    }
    if (best !== null) ranked.push({ option, rank: best, order });
  });
  return ranked.sort((a, b) => a.rank - b.rank || a.order - b.order).map((entry) => entry.option);
}

/** The options under their group headings, in the order the groups first appear. Options with no group come first, under no heading. */
export function groupOptions(options: readonly CreatableOption[]): { name: string; options: CreatableOption[] }[] {
  const groups = new Map<string, CreatableOption[]>();
  for (const option of options) groups.set(option.group ?? "", [...(groups.get(option.group ?? "") ?? []), option]);
  return [...groups].map(([name, grouped]) => ({ name, options: grouped })).sort((a, b) => Number(b.name === "") - Number(a.name === ""));
}
