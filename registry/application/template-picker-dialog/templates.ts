import type { ReactNode } from "react";

/**
 * The words and the small decisions behind TemplatePickerDialog, as plain types
 * and functions: they hold no state and call no hook, so a Server Component can
 * use them too.
 */

/** One template to start from. */
export interface Template {
  /** A stable identity from your own data: "weekly-report". It is what `onSelect` receives. Unique in the list. */
  id: string;
  /** What it is called: "Weekly report". It is on the card and in the button: "Use Weekly report". */
  name: string;
  /** One or two sentences on what you get. Shown beside the preview of the template in focus. */
  description: string;
  /** The `id` of its category. */
  category: string;
  /** A picture of it, drawn to fill its box: an `svg` with a viewBox, or a `div` that is `size-full`. It is shown small on the card and larger beside the grid, so it should scale. */
  preview: ReactNode;
  /** Words people may search for that are not in the name: "weekly", "status", "update". */
  tags?: readonly string[];
}

/** A group of templates, as the rail lists it. */
export interface TemplateCategory {
  /** The id the templates name in their `category`. */
  id: string;
  /** What the rail says: "Reports". */
  label: string;
}

/** The words the dialog says, for translation. `{name}`, `{count}`, `{query}` and `{category}` are filled in. */
export interface TemplatePickerLabels {
  /** The title. Default "Start from a template". */
  title?: string;
  /** The sentence under it. Default "Pick a starting point. You can change everything afterwards." */
  description?: string;
  /** The search field's name and hint. Default "Search templates". */
  search?: string;
  /** The name of the list of categories for screen readers. Default "Categories". */
  categories?: string;
  /** The first entry of the rail, with every template. Default "All templates". */
  all?: string;
  /** The name of the empty template. Default "Blank". */
  blank?: string;
  /** What the empty template says about itself. Default "An empty page. Start from nothing and add what you need." */
  blankDescription?: string;
  /** The line under Blank on its card, where the others show their category. Default "Start fresh". */
  blankCategory?: string;
  /** The name of the grid of cards for screen readers. Default "Templates". */
  templates?: string;
  /** How many templates are shown, for one. Default "{count} template". */
  countOne?: string;
  /** How many templates are shown, for the rest. Default "{count} templates". */
  countOther?: string;
  /** The button when a template is chosen. Default "Use {name}". */
  confirm?: string;
  /** The button when Blank is chosen. Default "Start blank". */
  confirmBlank?: string;
  /** The button that closes without choosing. Default "Cancel". */
  cancel?: string;
  /** Said while the choice is being made. Default "Creating". */
  working?: string;
  /** Shown and said when making it failed. Default "Could not start from this template. Nothing was changed." */
  failed?: string;
  /** The title of the empty search result. Default "No templates match “{query}”". */
  emptyTitle?: string;
  /** The line under it. Default "Try another word, or clear the search to see them all." */
  emptyHint?: string;
  /** The title when a search finds nothing in the category that is open, while other categories do have a match. Default "No templates in {category} match “{query}”". */
  emptyInCategory?: string;
  /** The line under it. Default "The ones that match are in other categories." */
  emptyInCategoryHint?: string;
  /** The button that goes to all categories and keeps the search. Default "Search all templates". */
  searchAll?: string;
  /** The title when a category has no templates and nothing is searched. Default "Nothing in this category yet". */
  emptyCategory?: string;
  /** The line under it. Default "Pick another category, or start from Blank." */
  emptyCategoryHint?: string;
  /** The button that empties the search. Default "Clear search". */
  clearSearch?: string;
  /** The button on a phone that opens the large preview. Default "Show preview". */
  showPreview?: string;
  /** The button on a phone that closes it again. Default "Hide preview". */
  hidePreview?: string;
  /** The close icon's name. Default "Close". */
  close?: string;
  /** The name of the panel that describes the template in focus, for screen readers. Default "Selected template". */
  details?: string;
}

export const DEFAULT_LABELS = {
  title: "Start from a template",
  description: "Pick a starting point. You can change everything afterwards.",
  search: "Search templates",
  categories: "Categories",
  all: "All templates",
  blank: "Blank",
  blankDescription: "An empty page. Start from nothing and add what you need.",
  blankCategory: "Start fresh",
  templates: "Templates",
  countOne: "{count} template",
  countOther: "{count} templates",
  confirm: "Use {name}",
  confirmBlank: "Start blank",
  cancel: "Cancel",
  working: "Creating",
  failed: "Could not start from this template. Nothing was changed.",
  emptyTitle: "No templates match “{query}”",
  emptyHint: "Try another word, or clear the search to see them all.",
  emptyInCategory: "No templates in {category} match “{query}”",
  emptyInCategoryHint: "The ones that match are in other categories.",
  searchAll: "Search all templates",
  emptyCategory: "Nothing in this category yet",
  emptyCategoryHint: "Pick another category, or start from Blank.",
  clearSearch: "Clear search",
  showPreview: "Show preview",
  hidePreview: "Hide preview",
  close: "Close",
  details: "Selected template",
} satisfies Required<TemplatePickerLabels>;

/** The id Blank answers to inside the dialog. `onSelect` gets null for it, never this. */
export const BLANK_ID = "__blank__";

/** The id of the rail entry that shows every template. */
export const ALL_ID = "__all__";

/** Puts values into a template: `fill("Use {name}", { name: "Weekly report" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** Whether a handler returned a promise, so a quick answer does not flash a busy state. */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

/** The message a refused choice carries, when it carries one worth showing: an `Error` with text. */
export function messageOf(error: unknown): string {
  return error instanceof Error ? error.message.trim() : "";
}

/** Lower case without accents, so "Café" is found by "cafe" and "ÉTÉ" by "été". */
export function plain(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}

/** Whether a template answers a search: every word of the query is in its name or in one of its tags. An empty query matches all. */
export function matches(template: Template, query: string): boolean {
  const words = plain(query).split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const haystack = plain([template.name, ...(template.tags ?? [])].join(" "));
  return words.every((word) => haystack.includes(word));
}

/** The categories to show: the ones you gave, then any a template names that you did not, in the order they appear. */
export function categoriesOf(templates: readonly Template[], given?: readonly TemplateCategory[]): TemplateCategory[] {
  const list = [...(given ?? [])];
  for (const template of templates) {
    if (!list.some((category) => category.id === template.category)) list.push({ id: template.category, label: template.category });
  }
  return list;
}

/** A number the way the locale writes it. */
export function numberText(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat("en-US").format(value);
  }
}

/** Which of the two count words to use. */
export function isOne(value: number, locale: string): boolean {
  try {
    return new Intl.PluralRules(locale).select(value) === "one";
  } catch {
    return value === 1;
  }
}
