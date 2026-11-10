/** One column of the lookup table. */
export interface LookupColumn {
  /** The key of the value in each record. */
  key: string;
  /** The heading of the column. */
  label: string;
  /** Whether the heading sorts the table: the sort is sent to `loadRows`. Default true. */
  sortable?: boolean;
  /** Where the values stand in the column: numbers and amounts usually on the right. Default "left". */
  align?: "left" | "right";
  /**
   * The width of the column, as any CSS length: "12rem" or "30%". With a width on any column the layout is fixed, so
   * the columns stay where they are from one answer to the next instead of following the longest value of each page;
   * a long value is cut with an ellipsis, and a column without a width shares what is left. Default none: the table
   * fits its columns to what it shows.
   */
  width?: string;
}

/** One record: an id, and a value for each column key. Numbers and strings are shown as they are, so format them before they get here. */
export interface LookupRecord {
  id: string;
  [key: string]: string | number | null | undefined;
}

/** How the table is sorted: a column, and which way. */
export interface LookupSort {
  key: string;
  direction: "ascending" | "descending";
}

/** What `loadRows` is asked for. */
export interface LookupQuery {
  /** What is typed in the search field, empty for no search. Already waited for: it is sent when typing pauses. */
  search: string;
  /** The page wanted, from 1. */
  page: number;
  pageSize: number;
  /** The sort, or `null` for the order the server chooses. */
  sort: LookupSort | null;
}

/** What `loadRows` answers: one page of records, and how many there are in all for this search. */
export interface LookupPage {
  rows: readonly LookupRecord[];
  total: number;
}

/** The words the lookup says, for translation. A `{name}` mark in a sentence is filled in. */
export interface RecordLookupLabels {
  /** The button that opens the dialog. Default "Look up". */
  lookUp?: string;
  /** What the field says before anything is chosen. Default "Nothing chosen". */
  placeholder?: string;
  /** Names the button that clears the choice; `{label}` is the chosen record. Default "Clear {label}". */
  clear?: string;
  /** What the dialog says under its title. Default "Search, then choose one row. Press Enter to take the first result." */
  hint?: string;
  /** The placeholder of the search field. Default "Search". */
  searchPlaceholder?: string;
  /** Names the search field. Default "Search records". */
  search?: string;
  /** Names the column of radio buttons, which only a screen reader hears. Default "Choose". */
  choose?: string;
  /** Names the table for a screen reader; `{title}`, `{page}` and `{pages}`. Default "{title}, page {page} of {pages}". */
  caption?: string;
  /** The range in the footer; `{from}`, `{to}` and `{total}`. Default "{from} to {to} of {total}". */
  range?: string;
  /** The page in the footer; `{page}` and `{pages}`. Default "Page {page} of {pages}". */
  page?: string;
  /** Names the button to the page before. Default "Previous page". */
  previous?: string;
  /** Names the button to the page after. Default "Next page". */
  next?: string;
  /** What is announced when a search has answered; `{count}` and `{noun}`. Default "{count} {noun} found". */
  found?: string;
  /** What is announced when it found nothing; `{noun}` and `{query}`. Default "No {noun} match “{query}”". */
  none?: string;
  /** What the table says when there is nothing to show and no search; `{noun}`. Default "There are no {noun} yet." */
  empty?: string;
  /** The word for one record. Default "record". */
  recordOne?: string;
  /** The word for several records. Default "records". */
  recordOther?: string;
  /** The button under "no match" that empties the search and shows everything again; `{noun}`. Default "Show all {noun}". */
  clearSearch?: string;
  /** What is said when loading failed; `{noun}`. Default "The {noun} could not be loaded." */
  failed?: string;
  /** The button that asks again. Default "Try again". */
  retry?: string;
  /** In the dialog's footer, naming the row that is chosen; `{label}`. Default "Selected: {label}". */
  selected?: string;
  /** In the dialog's footer while no row is chosen. Default "Nothing selected". */
  nothingSelected?: string;
  /** The button that takes the chosen row. Default "Select". */
  select?: string;
  /** The button that closes the dialog without choosing. Default "Cancel". */
  cancel?: string;
}

export const DEFAULT_LABELS = {
  lookUp: "Look up",
  placeholder: "Nothing chosen",
  clear: "Clear {label}",
  hint: "Search, then choose one row. Press Enter to take the first result.",
  searchPlaceholder: "Search",
  search: "Search records",
  choose: "Choose",
  caption: "{title}, page {page} of {pages}",
  range: "{from} to {to} of {total}",
  page: "Page {page} of {pages}",
  previous: "Previous page",
  next: "Next page",
  found: "{count} {noun} found",
  none: "No {noun} match “{query}”",
  empty: "There are no {noun} yet.",
  recordOne: "record",
  recordOther: "records",
  clearSearch: "Show all {noun}",
  failed: "The {noun} could not be loaded.",
  retry: "Try again",
  selected: "Selected: {label}",
  nothingSelected: "Nothing selected",
  select: "Select",
  cancel: "Cancel",
} satisfies Required<RecordLookupLabels>;

export type Words = Required<RecordLookupLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** The text before and after a `{name}` mark, so the value can sit between them in its own markup. Without the mark, everything is "before". */
export function around(template: string, name: string): [before: string, after: string] {
  const at = template.indexOf(`{${name}}`);
  return at < 0 ? [template, ""] : [template.slice(0, at), template.slice(at + name.length + 2)];
}

/** The word for a number of records, by the plural rules of the language. */
export function nounFor(count: number, words: Words, locale: string): string {
  return new Intl.PluralRules(locale).select(count) === "one" ? words.recordOne : words.recordOther;
}

/** What a record shows for a column: the value as text, nothing for a missing one. */
export function cellText(record: LookupRecord, key: string): string {
  const value = record[key];
  return value === null || value === undefined ? "" : String(value);
}

/** The next sort when a heading is pressed: ascending, then descending, then the server's own order. */
export function nextSort(current: LookupSort | null, key: string): LookupSort | null {
  if (!current || current.key !== key) return { key, direction: "ascending" };
  return current.direction === "ascending" ? { key, direction: "descending" } : null;
}

/** The pages there are, at least one. */
export function pagesOf(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
}
