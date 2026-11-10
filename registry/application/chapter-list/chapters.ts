/**
 * The chapters behind ChapterList, as plain functions: they hold no state and
 * call no hook, so a Server Component can use them too (to build the list of
 * chapters for a page, or to write a table of contents). Every function that
 * writes a number takes the locale, so the same input gives the same text on
 * the server and in the browser.
 */

/** One chapter as you hold it in your own data. */
export interface Chapter {
  /** Where the chapter begins, in seconds from the start of the media. */
  start: number;
  /** What the chapter is about, in a few words: "Pricing". */
  title: string;
}

/** A chapter with what the list works out from its neighbours. */
export interface ChapterRow extends Chapter {
  /** Its place in the list, from 0. */
  index: number;
  /** Where it ends: where the next one starts, or the end of the media. Null when neither is known. */
  end: number | null;
  /** How long it runs, in seconds. Null when its end is not known. */
  length: number | null;
}

/** The words the list says, for translation. A `{name}` mark in a sentence is filled in. */
export interface ChapterListLabels {
  /** The heading over the list. Default "Chapters". */
  chapters?: string;
  /** The count beside it; `{count}`. Default "{count} chapters". */
  count?: string;
  /** The same for a list of one chapter. Default "{count} chapter". */
  countOne?: string;
  /** Said, to a screen reader only, for the chapter that is playing. Default "Now playing". */
  nowPlaying?: string;
  /** Shown instead of the list when there are no chapters. Default "No chapters yet". */
  empty?: string;
}

export const DEFAULT_LABELS = {
  chapters: "Chapters",
  count: "{count} chapters",
  countOne: "{count} chapter",
  nowPlaying: "Now playing",
  empty: "No chapters yet",
} satisfies Required<ChapterListLabels>;

export type Words = Required<ChapterListLabels>;

/** Fills `{name}` marks in a sentence. A mark with no value stays as it is. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (mark, key: string) => (key in values ? String(values[key]) : mark));
}

/**
 * The chapters in the order they start, each with its end and its length.
 * A chapter ends where the next one starts; the last one ends where the media
 * does, when `duration` is known. Chapters with a start that is not a number
 * are left out.
 */
export function deriveChapters(chapters: readonly Chapter[], duration?: number): ChapterRow[] {
  const sorted = chapters.filter((chapter) => Number.isFinite(chapter.start)).sort((a, b) => a.start - b.start);
  const total = duration !== undefined && Number.isFinite(duration) && duration > 0 ? duration : null;
  return sorted.map((chapter, index) => {
    const next = sorted[index + 1]?.start ?? total;
    const end = next !== null && next > chapter.start ? next : null;
    return { ...chapter, index, end, length: end === null ? null : end - chapter.start };
  });
}

/**
 * The chapter that is playing at `time`: the last one that has started, or -1
 * before the first. A hair of tolerance means that seeking to a chapter's own
 * start, which a player may land a frame short of, still counts as inside it.
 */
export function activeIndex(rows: readonly Pick<ChapterRow, "start">[], time: number): number {
  let found = -1;
  rows.forEach((row, index) => {
    if (row.start <= time + 0.1) found = index;
  });
  return found;
}

/** How far through a chapter `time` is, from 0 to 1. A chapter with no known end has no length to measure. */
export function progressIn(row: Pick<ChapterRow, "start" | "end">, time: number): number {
  if (row.end === null || !(row.end > row.start)) return 0;
  return Math.min(1, Math.max(0, (time - row.start) / (row.end - row.start)));
}

/** A time as people read it on a player: "04:12", and "1:04:12" once an hour is involved (`hours` keeps a whole column the same width). Negative and not-a-number read as zero. */
export function clock(seconds: number, hours: boolean): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const two = (n: number) => String(n).padStart(2, "0");
  return hours ? `${h}:${two(m)}:${two(s)}` : `${two(m)}:${two(s)}`;
}

/** The same time as an ISO 8601 duration for a `<time dateTime>`: 252 seconds is "PT4M12S". */
export function isoDuration(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `PT${h ? `${h}H` : ""}${m ? `${m}M` : ""}${total % 60}S`;
}

/**
 * How long a chapter runs, in words the locale writes itself: "45 seconds",
 * "3 minutes", "1 hour, 5 minutes", or in the short form "3 min". Under a
 * minute it counts seconds; from there on it rounds to the minute.
 */
export function lengthWords(seconds: number, locale: string, style: "long" | "short" = "long"): string {
  const unit = (value: number, name: "hour" | "minute" | "second") => new Intl.NumberFormat(locale, { style: "unit", unit: name, unitDisplay: style }).format(value);
  const total = Math.max(0, Math.round(seconds));
  if (total < 60) return unit(total, "second");
  const minutes = Math.round(total / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const parts = [...(h ? [unit(h, "hour")] : []), ...(m || !h ? [unit(m, "minute")] : [])];
  return new Intl.ListFormat(locale, { type: "unit", style }).format(parts);
}
