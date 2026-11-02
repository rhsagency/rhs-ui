/** A phrase on offer. `id` identifies the chip and `text` is what gets written. */
export interface QuickPhrase {
  id: string;
  text: string;
}

/** Where a phrase sits in a text: the characters from `from` to `to`, a closing full stop or exclamation mark included. */
export interface PhraseSpan {
  from: number;
  to: number;
}

/** The words the field says, for another language or your own voice. Each can be replaced. */
export interface QuickPhrasesLabels {
  /** What a screen reader hears after a phrase is added: "Added Leave at the door". */
  added: (phrase: string) => string;
  /** What a screen reader hears after a phrase is taken out. */
  removed: (phrase: string) => string;
  /** The line under the phrases when the limit is reached and no phrase fits. */
  full: (max: number) => string;
  /** The line under the phrases when some of them need more room than is left. */
  tooLong: (count: number, left: number) => string;
  /** What a screen reader hears behind a phrase that is disabled: how many characters it needs, and how many are left. */
  needs: (need: number, left: number) => string;
}

const plural = (count: number, one: string, other: string) => (count === 1 ? one : other);

export const DEFAULT_LABELS: QuickPhrasesLabels = {
  added: (phrase) => `Added ${phrase}`,
  removed: (phrase) => `Removed ${phrase}`,
  full: (max) => `The limit of ${max} characters is reached, so no phrase fits.`,
  tooLong: (count, left) => `${count} ${plural(count, "phrase needs", "phrases need")} more than the ${left} ${plural(left, "character", "characters")} left.`,
  needs: (need, left) => `, needs ${need} ${plural(need, "character", "characters")}, ${left} left`,
};

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** The phrases you pass as one list of objects. A plain string is its own id, and an empty phrase or a repeated id is dropped. */
export function toPhrases(input: readonly (string | QuickPhrase)[]): QuickPhrase[] {
  const seen = new Set<string>();
  const phrases: QuickPhrase[] = [];
  for (const entry of input) {
    const phrase = typeof entry === "string" ? { id: entry, text: entry } : entry;
    if (phrase.text.trim() === "" || seen.has(phrase.id)) continue;
    seen.add(phrase.id);
    phrases.push(phrase);
  }
  return phrases;
}

/**
 * With a full stop as the separator, a phrase that closes its own sentence ("Thanks for getting in touch.", "Anything else?") needs no second one:
 * `addPhrase` leaves it out, so the reading side has to accept the phrase's own full stop, exclamation mark or question mark in its place.
 */
const closesSentence = (character: string, core: string) => core === "." && (character === "." || character === "!" || character === "?");

/** True when the phrase starts a piece of the text: at the very start, or right behind the separator. */
function startsSegment(text: string, at: number, core: string, lines: boolean): boolean {
  const before = text.slice(0, at);
  if (before.trim() === "") return true;
  if (lines) return /\n[ \t]*$/.test(before);
  if (core) {
    const head = before.trimEnd();
    return head.endsWith(core) || closesSentence(head.charAt(head.length - 1), core);
  }
  return /\s$/.test(before);
}

/** Where the piece ends, counting a full stop or an exclamation mark typed after the phrase; null when the phrase runs on into other words. */
function endOfSegment(text: string, at: number, core: string, lines: boolean): number | null {
  let end = at;
  const mark = text.charAt(end);
  // When the full stop is the separator itself, it belongs to the separator and not to the phrase.
  if ((mark === "." || mark === "!") && core !== mark) end += 1;
  let next = end;
  while (text.charAt(next) === " " || text.charAt(next) === "\t") next += 1;
  if (next >= text.length) return end;
  const following = text.charAt(next);
  if (lines) return following === "\n" || following === "\r" ? end : null;
  if (core) return text.startsWith(core, next) || (next > end && closesSentence(text.charAt(end - 1), core)) ? end : null;
  return next > end ? end : null;
}

/**
 * Finds a phrase in a text. It counts as present when it stands as a piece of
 * its own, between the separators and whatever the capitals: typed by hand it
 * counts as much as tapped, but "Ring twice please" does not contain "Ring
 * twice" as a piece when the pieces are separated by line breaks.
 */
export function locate(text: string, phrase: string, separator: string): PhraseSpan | null {
  const wanted = phrase.trim();
  if (wanted === "") return null;
  const core = separator.trim();
  const lines = separator.includes("\n");
  for (const match of text.matchAll(new RegExp(escapeRegExp(wanted), "giu"))) {
    const from = match.index ?? 0;
    if (!startsSegment(text, from, core, lines)) continue;
    const to = endOfSegment(text, from + match[0].length, core, lines);
    if (to !== null) return { from, to };
  }
  return null;
}

/** The text with the phrase added behind it, after one separator: a line of its own, or behind a comma, as `separator` says. */
export function addPhrase(text: string, phrase: string, separator: string): string {
  const wanted = phrase.trim();
  const rest = text.replace(/[ \t]+$/, "");
  if (rest.trim() === "") return wanted;
  if (separator.includes("\n")) {
    const have = rest.match(/\n*$/)?.[0].length ?? 0;
    const need = separator.split("\n").length - 1;
    return rest + "\n".repeat(Math.max(0, need - have)) + wanted;
  }
  const core = separator.trim();
  // A comma or full stop the writer typed already is the separator: only the space behind it is added.
  if (core && (rest.endsWith(core) || (core === "." && /[.!?]$/.test(rest)))) return rest + separator.slice(separator.trimEnd().length) + wanted;
  return rest + separator + wanted;
}

/** The text without the phrase and without the separator that went with it. Text that does not contain the phrase comes back as it was. */
export function removePhrase(text: string, phrase: string, separator: string): string {
  const span = locate(text, phrase, separator);
  if (!span) return text;
  const before = text.slice(0, span.from);
  const after = text.slice(span.to);
  const core = separator.trim();
  const next = after.replace(/^[ \t]*/, "");
  let result: string;
  if (separator.includes("\n")) {
    // The whole line goes, with the line breaks that stood behind it: as many as the separator holds, so a blank line between phrases (two) goes too and leaves no gap at the start or in the middle.
    // The last line takes the line breaks in front of it along.
    const breaks = separator.split("\n").length - 1;
    const behind = new RegExp(`^\\r?\\n(?:[ \\t]*\\r?\\n){0,${breaks - 1}}`);
    result = /^\r?\n/.test(next) ? before + next.replace(behind, "") : before.replace(/(\r?\n[ \t]*)+$/, "");
  } else if (core) {
    if (next.startsWith(core)) result = before + next.slice(core.length).replace(/^[ \t]*/, "");
    // The phrase closed its own sentence, so what follows stands on its own after the space.
    else if (next !== "") result = before + next;
    // The last one: its separator goes with it. A full stop is the exception, because it may well be the end of the phrase before.
    else result = core === "." ? before.trimEnd() : before.replace(new RegExp(`\\s*${escapeRegExp(core)}\\s*$`), "");
  } else {
    result = next !== "" ? before + next : before.trimEnd();
  }
  return result.trim() === "" ? "" : result;
}
