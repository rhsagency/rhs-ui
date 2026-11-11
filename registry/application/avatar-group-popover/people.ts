/**
 * The people, the words and the small decisions behind AvatarGroupPopover, as
 * plain types and functions: they hold no state, so a Server Component can use
 * them too.
 */

/** Where someone is right now. Each has its own word and its own drawing, so none depends on colour. */
export type PresenceStatus = "online" | "away" | "busy" | "offline";

/** One person in the stack. */
export interface AvatarPerson {
  /** A stable identity from your own data. It is the key of the row and what `onSelect` reports. */
  id: string;
  /** Their name. Initials stand in while the picture loads, or when there is none; a screen reader hears the name. */
  name: string;
  /** What they do, in muted text under the name: "Design lead". */
  role?: string;
  /** A picture. */
  image?: string;
  /** Where they are right now. Left out, the row shows no presence. */
  status?: PresenceStatus;
}

/** The words the popover says, for translation. `{count}`, `{name}`, `{first}`, `{second}` and `{query}` are filled in. */
export interface AvatarGroupLabels {
  /** The title of the list. Default "People". */
  title?: string;
  /** The name of the overflow button for one more person. Default "Show {count} more person". */
  showMoreOne?: string;
  /** The same for any other number. Default "Show {count} more people". */
  showMoreMany?: string;
  /** What the whole stack reads as, for one person. Default "{name}". */
  summaryOne?: string;
  /** For two people. Default "{first} and {second}". */
  summaryTwo?: string;
  /** For three or more, with one other. Default "{name} and {count} other". */
  summaryOther?: string;
  /** For three or more, with several others. Default "{name} and {count} others". */
  summaryOthers?: string;
  /** The count beside the title, for one person. Default "{count} person". */
  countOne?: string;
  /** The same for any other number. Default "{count} people". */
  countMany?: string;
  /** The name of the filter field. Default "Filter people". */
  search?: string;
  /** The hint inside it. Default "Find a person". */
  searchPlaceholder?: string;
  /** Said when the filter finds nobody. Default "Nobody matches “{query}”". */
  nothingMatches?: string;
  /** Said politely after filtering, for one match. Default "{count} person matches". */
  matchesOne?: string;
  /** The same for any other number. Default "{count} people match". */
  matchesMany?: string;
  /** The link at the foot. Default "View all people". */
  viewAll?: string;
  /** The word for someone who is here. Default "Online". */
  online?: string;
  /** The word for someone who stepped away. Default "Away". */
  away?: string;
  /** The word for someone who does not want to be disturbed. Default "Busy". */
  busy?: string;
  /** The word for someone who is not here. Default "Offline". */
  offline?: string;
}

export const DEFAULT_LABELS = {
  title: "People",
  showMoreOne: "Show {count} more person",
  showMoreMany: "Show {count} more people",
  summaryOne: "{name}",
  summaryTwo: "{first} and {second}",
  summaryOther: "{name} and {count} other",
  summaryOthers: "{name} and {count} others",
  countOne: "{count} person",
  countMany: "{count} people",
  search: "Filter people",
  searchPlaceholder: "Find a person",
  nothingMatches: "Nobody matches “{query}”",
  matchesOne: "{count} person matches",
  matchesMany: "{count} people match",
  viewAll: "View all people",
  online: "Online",
  away: "Away",
  busy: "Busy",
  offline: "Offline",
} satisfies Required<AvatarGroupLabels>;

/** How many people the list holds before it gets a filter field. */
export const SEARCH_AFTER = 8;

/** Puts values into a template: `fill("{name} and {count} others", { name, count })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** `one` for 1 in the locale's own rules, `other` for the rest. */
export function plural(count: number, one: string, other: string, locale: string): string {
  try {
    return new Intl.PluralRules(locale).select(count) === "one" ? one : other;
  } catch {
    return count === 1 ? one : other;
  }
}

/** A count written in the locale. */
export function numberText(count: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(count);
  } catch {
    return String(count);
  }
}

/** What the whole stack reads as: "Maya Okafor and 6 others". The first person leads; two people are named both. */
export function stackSummary(people: readonly AvatarPerson[], words: Required<AvatarGroupLabels>, locale: string): string {
  const [first, second] = people;
  if (!first) return "";
  if (people.length === 1) return fill(words.summaryOne, { name: first.name });
  if (people.length === 2 && second) return fill(words.summaryTwo, { first: first.name, second: second.name });
  const others = people.length - 1;
  return fill(plural(others, words.summaryOther, words.summaryOthers, locale), { name: first.name, count: numberText(others, locale) });
}

/** Text without capitals and accents, so "Zoë" is found by "zoe". */
function plain(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/** The people whose name or role contains what was typed. An empty filter keeps everybody. */
export function filterPeople(people: readonly AvatarPerson[], query: string): AvatarPerson[] {
  const needle = plain(query.trim());
  if (!needle) return [...people];
  return people.filter((person) => plain(person.name).includes(needle) || plain(person.role ?? "").includes(needle));
}
