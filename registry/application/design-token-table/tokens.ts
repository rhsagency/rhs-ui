/**
 * What the design token table works out, as plain functions with no state, so a build step can make the same anchors,
 * the same sizes and the same matches the table does (a docs page, a lint, a diff of two releases) and so the rules can
 * be tested alone.
 */

/** What a token holds, which decides how it is drawn. */
export type TokenType = "color" | "size" | "radius" | "shadow" | "font" | "duration";

/**
 * The anchor of a token: "--color-primary" becomes "color-primary". Lower case, letters and digits, one hyphen between
 * them, so it works as an `id`, as a link and in a URL without escaping.
 */
export function slugOf(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Whether a token matches what was typed: its name or its value contains it, in any case. An empty search matches everything. */
export function matchesQuery(token: { name: string; value: string }, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return needle === "" || token.name.toLowerCase().includes(needle) || token.value.toLowerCase().includes(needle);
}

/** A piece of text, and whether it is the part that matched. */
export interface Piece {
  text: string;
  match: boolean;
}

/**
 * A text cut into the parts that match a search and the parts between them, so the matches can be marked. A text whose
 * lower case is not the same length as itself (a few letters change length in some scripts) is not cut, rather than
 * cut in the wrong place.
 */
export function splitMatches(text: string, query: string): Piece[] {
  const needle = query.trim().toLowerCase();
  const haystack = text.toLowerCase();
  if (needle === "" || haystack.length !== text.length) return [{ text, match: false }];
  const pieces: Piece[] = [];
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(needle, from);
    if (at < 0) break;
    if (at > from) pieces.push({ text: text.slice(from, at), match: false });
    pieces.push({ text: text.slice(at, at + needle.length), match: true });
    from = at + needle.length;
  }
  if (from < text.length) pieces.push({ text: text.slice(from), match: false });
  return pieces.length > 0 ? pieces : [{ text, match: false }];
}

const LENGTH = /^(-?(?:\d+\.?\d*|\.\d+))(px|rem|em)$/;

/** A length in pixels, for the units that have a fixed size on the page: px, and rem and em at the usual 16px. Anything else (a percentage, a calc, a viewport unit) is null. */
export function lengthInPx(value: string): number | null {
  const text = value.trim();
  if (text === "0") return 0;
  const match = LENGTH.exec(text);
  if (!match) return null;
  const number = Number(match[1]);
  return match[2] === "px" ? number : number * 16;
}

/** Whether a size can be drawn as the width of a bar: a plain length in a unit CSS knows. */
export const isCssLength = (value: string): boolean => /^-?(?:\d+\.?\d*|\.\d+)(?:px|rem|em|ch|vw|vh|%|pt|cm|mm|in)$/.test(value.trim()) || value.trim() === "0";

const DURATION = /^((?:\d+\.?\d*|\.\d+))(ms|s)$/;

/** A duration in milliseconds: "200ms" and "0.2s" are both 200. Anything else is null. */
export function durationInMs(value: string): number | null {
  const match = DURATION.exec(value.trim());
  if (!match) return null;
  return Number(match[1]) * (match[2] === "s" ? 1000 : 1);
}

/** A group of tokens, in the order the groups first appear. */
export interface Group<T> {
  name: string;
  tokens: T[];
}

/** Sorts tokens into their groups, in the order each group first appears. A token with no group goes under `fallback`. */
export function groupTokens<T extends { group?: string }>(tokens: readonly T[], fallback: string): Group<T>[] {
  const groups: Group<T>[] = [];
  for (const token of tokens) {
    const name = token.group?.trim() || fallback;
    const found = groups.find((group) => group.name === name);
    if (found) found.tokens.push(token);
    else groups.push({ name, tokens: [token] });
  }
  return groups;
}

/** Anchors that are all different: a name that makes the same slug as an earlier one gets a number, so no two rows share an `id`. */
export function uniqueIds(names: readonly string[], prefix: string): string[] {
  const seen = new Map<string, number>();
  return names.map((name) => {
    const base = `${prefix}${slugOf(name)}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}-${count + 1}`;
  });
}

/** `{name}` placeholders filled in. A placeholder with no value is left as it is, so a missing word shows up in review. */
export function fill(template: string, values: Readonly<Record<string, string | number>>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => String(values[key] ?? match));
}
