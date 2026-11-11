/**
 * What the cell preview shows of a value, as plain functions with no state and no hook, so a Server Component can work out
 * the same text (for a title, a log line or a test) as the popover does.
 */

/** How a value reads: plain text, JSON, or a web address. */
export type CellKind = "text" | "json" | "url";

/** The kind to use when you did not say: a string is text, anything else is JSON. */
export function inferKind(value: unknown): CellKind {
  return typeof value === "string" ? "text" : "json";
}

/** JSON.stringify that never throws (a circular object, a bigint) and never returns undefined. */
function stringify(value: unknown, space?: number): string {
  try {
    return JSON.stringify(value, null, space) ?? String(value);
  } catch {
    return String(value);
  }
}

/** JSON on one line with a space after every comma, colon and bracket, so a cell can break between the parts of it and not in the middle of one. */
function oneLine(value: unknown): string {
  return stringify(value, 1).replace(/\n\s*/g, " ");
}

/** A string that holds JSON as the value it holds, or the string itself when it is not JSON. */
function parsed(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

/** The whole value as text, as the popover shows it and Copy copies it: JSON pretty-printed with two spaces, anything else as it is. */
export function fullText(value: unknown, kind: CellKind): string {
  if (kind === "json") return typeof value === "string" ? (typeof parsed(value) === "string" ? value : stringify(parsed(value), 2)) : stringify(value, 2);
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

/** What the cell shows before it is cut: the value on one line. JSON keeps a space after each comma and colon, so a narrow cell breaks between its parts. */
export function cellText(value: unknown, kind: CellKind): string {
  if (kind === "json") return typeof value === "string" ? (typeof parsed(value) === "string" ? value : oneLine(parsed(value))) : oneLine(value);
  return typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);
}

/** The address to link to, or null when it is not an http or https address: a `javascript:` address is never made a link. */
export function safeHref(value: string): string | null {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/** The part of a JSON text a token belongs to, so the popover can give each its own weight. */
export type JsonTone = "key" | "string" | "literal" | "plain";

export interface JsonToken {
  /** The characters of this part. */
  text: string;
  /** What kind of part it is. */
  tone: JsonTone;
}

/** A pretty-printed JSON text above this many characters is shown plain: thousands of spans would cost more than the colour is worth. */
export const HIGHLIGHT_LIMIT = 20_000;

const TOKEN = /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

/** Splits a JSON text into keys, strings, numbers and the rest. Joined again, the tokens are the same text. */
export function tokenizeJson(text: string): JsonToken[] {
  if (text.length > HIGHLIGHT_LIMIT) return [{ text, tone: "plain" }];
  const tokens: JsonToken[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const at = match.index ?? 0;
    if (at > last) tokens.push({ text: text.slice(last, at), tone: "plain" });
    if (match[1] !== undefined) {
      // A string followed by a colon is a key; the colon stays plain.
      tokens.push({ text: match[1], tone: match[2] ? "key" : "string" });
      if (match[2]) tokens.push({ text: match[2], tone: "plain" });
    } else {
      tokens.push({ text: match[0], tone: "literal" });
    }
    last = at + match[0].length;
  }
  if (last < text.length) tokens.push({ text: text.slice(last), tone: "plain" });
  return tokens;
}
