/**
 * The counting and the words behind DocumentStatsPopover, as plain types and
 * functions: they hold no state and call no hook, so a Server Component can use
 * them too. Counting follows the rules of the locale (where one word ends and
 * the next begins is not the same in English, Thai and Japanese), and a long
 * text is counted a piece at a time while the browser is idle, so typing never
 * waits for it.
 */

/** The numbers of a text. */
export interface DocumentStats {
  /** Words, as the locale's rules separate them. A hyphenated word counts once, as a word counter does. */
  words: number;
  /** Characters as a person sees them: an emoji or a letter with its accent is one. */
  characters: number;
  /** The same without any kind of space. */
  charactersNoSpaces: number;
  /** Sentences, as the locale's rules separate them. */
  sentences: number;
  /** Paragraphs: the lines that have something on them. */
  paragraphs: number;
}

export const NO_STATS: DocumentStats = { words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0, paragraphs: 0 };

/** The goal for the document. */
export interface DocumentGoal {
  /** How many words to write. */
  words: number;
}

/** The words the popover says, for translation. `{count}`, `{goal}`, `{rest}`, `{extra}`, `{selection}` and `{total}` are filled in. */
export interface DocumentStatsLabels {
  /** The name of the panel for screen readers. Default "Document statistics". */
  title?: string;
  /** The button when there is one word. Default "{count} word". */
  wordsOne?: string;
  /** The button for any other number. Default "{count} words". */
  wordsOther?: string;
  /** The button when text is selected. Default "{selection} of {total} words". */
  selectionOf?: string;
  /** The tag that says the numbers are for the whole text. Default "Document". */
  document?: string;
  /** The tag that says the numbers are for what is selected. Default "Selection". */
  selection?: string;
  /** Under the selection's numbers, to keep the whole text in sight. Default "Whole document: {total}". */
  wholeDocument?: string;
  /** Default "Words". */
  words?: string;
  /** Default "Characters". */
  characters?: string;
  /** Default "Characters without spaces". */
  charactersNoSpaces?: string;
  /** Default "Sentences". */
  sentences?: string;
  /** Default "Paragraphs". */
  paragraphs?: string;
  /** Default "Reading time". */
  readingTime?: string;
  /** Default "Speaking time". */
  speakingTime?: string;
  /** Said for a time under a minute. Default "Under 1 min". */
  underMinute?: string;
  /** The goal, with words to go. Default "Goal: {goal} words, {rest} to go". */
  goalToGo?: string;
  /** The goal, reached on the number. Default "Goal reached: {goal} words". */
  goalReached?: string;
  /** The goal, passed. Default "Goal: {goal} words, {extra} over". */
  goalPassed?: string;
  /** The name of the progress bar. Default "Progress towards the goal". */
  goalProgress?: string;
  /** Shown while a long text is being counted. Default "Counting". */
  counting?: string;
}

export const DEFAULT_LABELS = {
  title: "Document statistics",
  wordsOne: "{count} word",
  wordsOther: "{count} words",
  selectionOf: "{selection} of {total} words",
  document: "Document",
  selection: "Selection",
  wholeDocument: "Whole document: {total}",
  words: "Words",
  characters: "Characters",
  charactersNoSpaces: "Characters without spaces",
  sentences: "Sentences",
  paragraphs: "Paragraphs",
  readingTime: "Reading time",
  speakingTime: "Speaking time",
  underMinute: "Under 1 min",
  goalToGo: "Goal: {goal} words, {rest} to go",
  goalReached: "Goal reached: {goal} words",
  goalPassed: "Goal: {goal} words, {extra} over",
  goalProgress: "Progress towards the goal",
  counting: "Counting",
} satisfies Required<DocumentStatsLabels>;

/** Puts values into a template: `fill("{count} words", { count: "412" })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? (values[key] ?? match) : match));
}

/** A number the way the locale writes it. */
export function numberText(value: number, locale: string): string {
  try {
    return new Intl.NumberFormat(locale).format(value);
  } catch {
    return new Intl.NumberFormat("en-US").format(value);
  }
}

/** Whether the locale writes "1 word" with the singular. */
export function isOne(value: number, locale: string): boolean {
  try {
    return new Intl.PluralRules(locale).select(value) === "one";
  } catch {
    return value === 1;
  }
}

type Granularity = "word" | "sentence" | "grapheme";

const segmenters = new Map<string, Intl.Segmenter | null>();

/** A segmenter for the locale, made once. Null where the browser has none: the counts then fall back to simple rules. */
function segmenter(locale: string, granularity: Granularity): Intl.Segmenter | null {
  if (typeof Intl.Segmenter !== "function") return null;
  const key = `${granularity}|${locale}`;
  if (!segmenters.has(key)) {
    let made: Intl.Segmenter | null = null;
    try {
      made = new Intl.Segmenter(locale, { granularity });
    } catch {
      made = new Intl.Segmenter("en-US", { granularity });
    }
    segmenters.set(key, made);
  }
  return segmenters.get(key) ?? null;
}

const HYPHENS = new Set(["-", "‐", "‑"]);

function countWords(text: string, locale: string): number {
  const words = segmenter(locale, "word");
  if (!words) return (text.match(/\S+/g) ?? []).length;
  let count = 0;
  // A hyphen between two words joins them, as it does in a word counter: "well-known" is one.
  let word = false;
  let hyphen = false;
  for (const part of words.segment(text)) {
    if (part.isWordLike) {
      if (!hyphen) count += 1;
      word = true;
      hyphen = false;
    } else {
      hyphen = word && HYPHENS.has(part.segment);
      word = false;
    }
  }
  return count;
}

function countCharacters(text: string, locale: string): { all: number; solid: number } {
  const graphemes = segmenter(locale, "grapheme");
  let all = 0;
  let solid = 0;
  if (graphemes) {
    for (const part of graphemes.segment(text)) {
      all += 1;
      if (/\S/.test(part.segment)) solid += 1;
    }
  } else {
    for (const character of text) {
      all += 1;
      if (/\S/.test(character)) solid += 1;
    }
  }
  return { all, solid };
}

function countSentences(text: string, locale: string): number {
  const sentences = segmenter(locale, "sentence");
  if (!sentences) return (text.match(/[^.!?]*[\p{L}\p{N}][^.!?]*(?:[.!?]+|$)/gu) ?? []).length;
  let count = 0;
  for (const part of sentences.segment(text)) {
    if (/[\p{L}\p{N}]/u.test(part.segment)) count += 1;
  }
  return count;
}

/** The lines that have something on them. Cheap even for a very long text, so it is never split up. */
export function countParagraphs(text: string): number {
  let count = 0;
  for (const line of text.split(/\r?\n/)) if (/\S/.test(line)) count += 1;
  return count;
}

/** All the numbers of a text, at once. Fine for what a page holds; for a book use `countInIdle`. */
export function countText(text: string, locale: string): DocumentStats {
  if (!text) return NO_STATS;
  const characters = countCharacters(text, locale);
  return {
    words: countWords(text, locale),
    characters: characters.all,
    charactersNoSpaces: characters.solid,
    sentences: countSentences(text, locale),
    paragraphs: countParagraphs(text),
  };
}

/** Above this many characters a text is counted in idle time instead of while rendering. */
export const IDLE_ABOVE = 20_000;

/** How much is counted before the browser is asked whether it is still idle. */
const PIECE = 8_000;

/** Cuts a text into pieces of about `size` characters, at a line break or a space, so no word is split in two. */
export function piecesOf(text: string, size: number): string[] {
  const pieces: string[] = [];
  let start = 0;
  while (start < text.length) {
    let end = Math.min(text.length, start + size);
    if (end < text.length) {
      const line = text.lastIndexOf("\n", end);
      const space = text.lastIndexOf(" ", end);
      if (line > start + size / 2) end = line + 1;
      else if (space > start + size / 2) end = space + 1;
    }
    pieces.push(text.slice(start, end));
    start = end;
  }
  return pieces;
}

interface Idle {
  timeRemaining(): number;
}

/** Runs a task when the browser has nothing better to do, or soon after where there is no such thing (Safari). Returns the way to cancel it. */
function whenIdle(task: (idle: Idle) => void): () => void {
  if (typeof requestIdleCallback === "function") {
    const id = requestIdleCallback(task, { timeout: 600 });
    return () => cancelIdleCallback(id);
  }
  const id = setTimeout(() => task({ timeRemaining: () => 6 }), 16);
  return () => clearTimeout(id);
}

/**
 * Counts a long text a piece at a time, each piece while the browser says it has time to spare, so a key that is pressed
 * in the middle of it is never made to wait. Calls `onDone` with the numbers, or never if it was cancelled first.
 * Returns the way to cancel it; start a new count and cancel the old one whenever the text changes.
 */
export function countInIdle(text: string, locale: string, onDone: (stats: DocumentStats) => void): () => void {
  const pieces = piecesOf(text, PIECE);
  const total = { words: 0, characters: 0, charactersNoSpaces: 0, sentences: 0 };
  let index = 0;
  let cancelled = false;
  let cancelTask: () => void = () => undefined;

  const step = (idle: Idle) => {
    if (cancelled) return;
    do {
      const piece = countText(pieces[index] ?? "", locale);
      total.words += piece.words;
      total.characters += piece.characters;
      total.charactersNoSpaces += piece.charactersNoSpaces;
      total.sentences += piece.sentences;
      index += 1;
    } while (index < pieces.length && idle.timeRemaining() > 4);
    if (index < pieces.length) cancelTask = whenIdle(step);
    else onDone({ ...total, paragraphs: countParagraphs(text) });
  };

  cancelTask = whenIdle(step);
  return () => {
    cancelled = true;
    cancelTask();
  };
}

/** Minutes it takes at a pace, as a fraction. A pace of 0 or less gives 0. */
export function minutesFor(words: number, perMinute: number): number {
  return perMinute > 0 ? words / perMinute : 0;
}

// Intl writes the space before a unit as a no-break or narrow space, and the version of its data decides which: a plain space looks the same and every engine agrees on it.
const ODD_SPACES = new RegExp(`[${String.fromCharCode(0x00a0, 0x2009, 0x202f)}]`, "g");

/** A time for a glance: "2 min", "1 hr 12 min", and under a minute the words you give. Nothing at all gives "0 min". */
export function durationText(minutes: number, locale: string, underMinute: string): string {
  const unit = (value: number, name: "minute" | "hour") => {
    const options = { style: "unit", unit: name, unitDisplay: "short" } as const;
    let text: string;
    try {
      text = new Intl.NumberFormat(locale, options).format(value);
    } catch {
      text = new Intl.NumberFormat("en-US", options).format(value);
    }
    return text.replace(ODD_SPACES, " ");
  };
  if (minutes <= 0) return unit(0, "minute");
  if (minutes < 1) return underMinute;
  const total = Math.round(minutes);
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return unit(total, "minute");
  return rest === 0 ? unit(hours, "hour") : `${unit(hours, "hour")} ${unit(rest, "minute")}`;
}
