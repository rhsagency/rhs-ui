/**
 * The transcript behind TranscriptList, as plain functions: they hold no state
 * and call no hook, so a Server Component can use them too (to search a
 * transcript on the server, or to write it out as text).
 */

/** One line of the transcript, as a WebVTT parser of your own gives it. */
export interface Cue {
  /** When the line starts, in seconds. */
  start: number;
  /** When it ends, in seconds. */
  end: number;
  /** Who says it. A name is shown above the first line of each turn. */
  speaker?: string;
  /** What is said. */
  text: string;
}

/** The words the transcript says, for translation. A `{name}` mark in a sentence is filled in. */
export interface TranscriptListLabels {
  /** Names the transcript for a screen reader. Default "Transcript". */
  transcript?: string;
  /** The label and the placeholder of the search field. Default "Search the transcript". */
  search?: string;
  /** The button that brings the playing line back into view. Default "Jump to current". */
  jump?: string;
  /** The name of a timestamp button; `{time}`. Default "Jump to {time}". */
  seek?: string;
  /** The count under a search; `{count}`. Default "{count} lines match". */
  matches?: string;
  /** The same for a single line. Default "1 line matches". */
  matchesOne?: string;
  /** When nothing matches; `{query}`. Default "No line mentions “{query}”". */
  noMatches?: string;
  /** Shown instead of the transcript when there are no lines. Default "No transcript yet". */
  empty?: string;
}

export const DEFAULT_LABELS = {
  transcript: "Transcript",
  search: "Search the transcript",
  jump: "Jump to current",
  seek: "Jump to {time}",
  matches: "{count} lines match",
  matchesOne: "1 line matches",
  noMatches: "No line mentions “{query}”",
  empty: "No transcript yet",
} satisfies Required<TranscriptListLabels>;

export type Words = Required<TranscriptListLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/** A time as people read it on a player: "01:12", and "1:04:12" once an hour is involved (`hours` keeps a whole column the same width). */
export function clock(seconds: number, hours: boolean): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return hours ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

/** How long after a line ends it still counts as the line being read: a breath, so the mark does not flicker off between two lines. */
const GRACE = 1.5;

/**
 * The line being spoken at `time`: the last one that has started, for as long
 * as it runs and a breath after. `cues` must be in the order they start in.
 * -1 when no line is being spoken, before the first and after the last.
 */
export function activeCue(cues: readonly Pick<Cue, "start" | "end">[], time: number): number {
  let found = -1;
  cues.forEach((cue, index) => {
    if (cue.start <= time + 0.1) found = index;
  });
  const cue = cues[found];
  return cue && time <= Math.max(cue.start, cue.end) + GRACE ? found : -1;
}

const MARKS = /[\u0300-\u036f]/g;

/** The text in lower case and without accents, and for every character of it where in the original it came from, so a match can be marked in the text as written. */
function fold(text: string): { folded: string; from: number[]; to: number[] } {
  let folded = "";
  const from: number[] = [];
  const to: number[] = [];
  let index = 0;
  for (const char of text) {
    const piece = char.normalize("NFD").replace(MARKS, "").toLowerCase();
    for (let i = 0; i < piece.length; i++) {
      from.push(index);
      to.push(index + char.length);
    }
    folded += piece;
    index += char.length;
  }
  return { folded, from, to };
}

/**
 * Where a search finds its words in a text, as [start, end) pairs in the text
 * as written. It ignores case and accents, so "cafe" finds "Café", and finds
 * the query as typed, spaces and all.
 */
export function matchRanges(text: string, query: string): [number, number][] {
  const needle = fold(query.trim()).folded;
  if (!needle) return [];
  const { folded, from, to } = fold(text);
  const ranges: [number, number][] = [];
  let at = folded.indexOf(needle);
  while (at !== -1) {
    const start = from[at];
    const end = to[at + needle.length - 1];
    if (start !== undefined && end !== undefined) ranges.push([start, end]);
    at = folded.indexOf(needle, at + needle.length);
  }
  return ranges;
}

/** The text cut into pieces, each saying whether it is a match. */
export function splitMatches(text: string, query: string): { text: string; match: boolean }[] {
  const pieces: { text: string; match: boolean }[] = [];
  let last = 0;
  for (const [start, end] of matchRanges(text, query)) {
    if (start > last) pieces.push({ text: text.slice(last, start), match: false });
    pieces.push({ text: text.slice(start, end), match: true });
    last = end;
  }
  if (last < text.length) pieces.push({ text: text.slice(last), match: false });
  return pieces.length ? pieces : [{ text, match: false }];
}
