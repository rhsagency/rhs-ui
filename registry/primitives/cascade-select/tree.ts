/** One choice in the tree. A choice with `children` opens them; one without is a leaf and can be picked. */
export interface CascadeOption {
  /** What the path is made of. It must be unique among the choices that share a parent. */
  value: string;
  /** What people read. */
  label: string;
  /** The choices inside this one. */
  children?: readonly CascadeOption[];
  /** The choice cannot be picked or opened, and is skipped by the arrow keys. */
  disabled?: boolean;
}

/** The words the select says, for another language or your own voice. */
export interface CascadeLabels {
  /** What the field says before anything is chosen. */
  placeholder: string;
  /** What the search box says before anything is typed. */
  searchPlaceholder: string;
  /** The name of the search box, given the name of the field: "Search category". */
  search: (label: string) => string;
  /** The name of the button that empties the search box. */
  clearSearch: string;
  /** The name of the list of matches. */
  results: string;
  /** Said when nothing matches, given what was typed. */
  empty: (query: string) => string;
  /** Said under a list of matches that was cut short, given how many are not shown. */
  more: (hidden: number) => string;
  /** Read after a match count changes: "3 results". */
  found: (count: number) => string;
  /** The name of the top level, on the way back on a phone. */
  all: string;
  /** The name of the button that goes back a level, given where it goes: "Back to Electronics". */
  back: (to: string) => string;
  /** Read after a choice that opens more: where you are and how many choices are in it. */
  level: (title: string, level: number, depth: number, count: number) => string;
  /** Read after a choice that opens more, as part of its name: ", 4 choices inside". */
  inside: (count: number) => string;
}

export const DEFAULT_LABELS: CascadeLabels = {
  placeholder: "Choose an option",
  searchPlaceholder: "Search every level",
  search: (label) => `Search ${label.toLowerCase()}`,
  clearSearch: "Clear search",
  results: "Results",
  empty: (query) => `Nothing matches "${query}"`,
  more: (hidden) => `${hidden} more. Type a little more to narrow it down.`,
  found: (count) => (count === 1 ? "1 result" : `${count} results`),
  all: "All",
  back: (to) => `Back to ${to}`,
  level: (title, level, depth, count) => `${title}, level ${level} of ${depth}, ${count} ${count === 1 ? "choice" : "choices"}`,
  inside: (count) => `, ${count} ${count === 1 ? "choice" : "choices"} inside`,
};

/** An id for a path, for matching an element to the state: values may hold any character, so they are joined with one that is not typed. */
export const keyOf = (path: readonly string[]): string => path.join("\u001f");

export const hasChildren = (option: CascadeOption): boolean => (option.children?.length ?? 0) > 0;

/** The choices along a path of values, one for each step, or null when a step is not there. */
export function resolve(options: readonly CascadeOption[], path: readonly string[]): CascadeOption[] | null {
  const chain: CascadeOption[] = [];
  let level: readonly CascadeOption[] = options;
  for (const value of path) {
    const found = level.find((option) => option.value === value);
    if (!found) return null;
    chain.push(found);
    level = found.children ?? [];
  }
  return chain;
}

/** How many levels the tree has. */
export function depthOf(options: readonly CascadeOption[]): number {
  return options.length ? 1 + Math.max(...options.map((option) => depthOf(option.children ?? []))) : 0;
}

/** One column of the panel: the choices of a level, the choice they belong to (null for the top level) and the path to it. */
export interface Column {
  parent: CascadeOption | null;
  path: string[];
  options: readonly CascadeOption[];
}

/** The columns that are open: the top level, and the children of every choice on the trail that has some. */
export function columnsFor(options: readonly CascadeOption[], trail: readonly string[]): Column[] {
  const columns: Column[] = [{ parent: null, path: [], options }];
  let level: readonly CascadeOption[] = options;
  for (let index = 0; index < trail.length; index += 1) {
    const node = level.find((option) => option.value === trail[index]);
    if (!node || !hasChildren(node)) break;
    columns.push({ parent: node, path: trail.slice(0, index + 1), options: node.children ?? [] });
    level = node.children ?? [];
  }
  return columns;
}

/** The trail that shows a value: every step that has children below it is open, so the chosen choice is seen with what is inside it. */
export function trailFor(options: readonly CascadeOption[], path: readonly string[]): string[] {
  const chain = resolve(options, path);
  if (!chain || !chain.length) return [];
  const last = chain[chain.length - 1]!;
  return hasChildren(last) ? [...path] : path.slice(0, -1);
}

/** Lower case with the accents taken off, so "cafe" finds "Café". */
export const fold = (text: string): string => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();

/** A text split around the first place the query is found in it: [before, the match, after]. The match is empty when there is none. */
export function splitMatch(text: string, query: string): [string, string, string] {
  const needle = fold(query.trim());
  if (!needle) return [text, "", ""];
  // Folding one letter at a time keeps every position the same as in the original text.
  const folded = [...text].map((letter) => fold(letter)).join("");
  const at = folded.indexOf(needle);
  if (at < 0 || [...text].length !== [...folded].length) return [text, "", ""];
  const letters = [...text];
  return [letters.slice(0, at).join(""), letters.slice(at, at + [...needle].length).join(""), letters.slice(at + [...needle].length).join("")];
}

/** A choice that matched the search, with the whole path to it. */
export interface Match {
  path: string[];
  labels: string[];
  option: CascadeOption;
}

/**
 * Every choice that can be picked and whose path holds all the words of the query, in any order, ignoring case and accents. A choice that
 * opens more can be picked only with `changeOnSelect`. Those whose own name holds the query come first, then the shorter paths.
 */
export function search(options: readonly CascadeOption[], query: string, changeOnSelect: boolean, limit = 40): { matches: Match[]; total: number } {
  const words = fold(query).split(/\s+/).filter(Boolean);
  if (!words.length) return { matches: [], total: 0 };
  const found: { match: Match; own: boolean }[] = [];
  const walk = (level: readonly CascadeOption[], path: string[], labels: string[]) => {
    for (const option of level) {
      if (option.disabled) continue;
      const nextPath = [...path, option.value];
      const nextLabels = [...labels, option.label];
      const open = hasChildren(option);
      if (!open || changeOnSelect) {
        const whole = fold(nextLabels.join(" "));
        if (words.every((word) => whole.includes(word))) found.push({ match: { path: nextPath, labels: nextLabels, option }, own: words.every((word) => fold(option.label).includes(word)) });
      }
      if (open) walk(option.children ?? [], nextPath, nextLabels);
    }
  };
  walk(options, [], []);
  found.sort((a, b) => Number(b.own) - Number(a.own) || a.match.path.length - b.match.path.length);
  return { matches: found.slice(0, limit).map((entry) => entry.match), total: found.length };
}
