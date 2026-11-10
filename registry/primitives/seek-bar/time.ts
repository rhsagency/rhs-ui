/** A stretch of the media that is already loaded, in seconds. `HTMLMediaElement.buffered` gives these through `toBuffered`. */
export interface SeekBarBuffered {
  /** Where the loaded stretch starts. */
  start: number;
  /** Where it ends. */
  end: number;
}

/** A named part of the media. The bar is drawn in one piece per chapter, and the tooltip names the chapter under the pointer. */
export interface SeekBarChapter {
  /** Where the chapter starts, in seconds. */
  start: number;
  /** Its name: "Setting up". */
  title: string;
}

/** A whole number of seconds, never negative and never NaN or infinite: what a clock can show. */
export function wholeSeconds(seconds: number): number {
  return Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
}

/** Keep `value` between `min` and `max`. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * 83 becomes "1:23" and 3725 becomes "1:02:05". Pass `total` (the length of the
 * media) so that a clip over an hour shows hours on every time, even at 0:42,
 * and the times in a row line up.
 */
export function formatTime(seconds: number, total: number = seconds): string {
  const whole = wholeSeconds(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = String(whole % 60).padStart(2, "0");
  if (hours > 0 || wholeSeconds(total) >= 3600) return `${hours}:${String(minutes).padStart(2, "0")}:${rest}`;
  return `${minutes}:${rest}`;
}

const unit = (count: number, word: string): string => `${count} ${word}${count === 1 ? "" : "s"}`;

/** 83 becomes "1 minute 23 seconds" and 3600 becomes "1 hour": the way a screen reader should say a time. */
export function spokenTime(seconds: number): string {
  const whole = wholeSeconds(seconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const rest = whole % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(unit(hours, "hour"));
  if (minutes > 0) parts.push(unit(minutes, "minute"));
  if (rest > 0 || parts.length === 0) parts.push(unit(rest, "second"));
  return parts.join(" ");
}

/** "1 minute 23 seconds of 4 minutes 56 seconds": the default `aria-valuetext` of the bar. */
export function seekValueText(seconds: number, duration: number): string {
  return `${spokenTime(seconds)} of ${spokenTime(duration)}`;
}

/** The chapter that a time falls in: the last one that has started. `undefined` when there are none or the time is before the first. */
export function chapterAt(chapters: readonly SeekBarChapter[] | undefined, seconds: number): SeekBarChapter | undefined {
  let found: SeekBarChapter | undefined;
  for (const chapter of chapters ?? []) if (chapter.start <= seconds && (!found || chapter.start >= found.start)) found = chapter;
  return found;
}

/** The loaded stretches of a media element (`media.buffered`) as plain ranges for the bar. */
export function toBuffered(ranges: TimeRanges): SeekBarBuffered[] {
  const found: SeekBarBuffered[] = [];
  for (let index = 0; index < ranges.length; index += 1) found.push({ start: ranges.start(index), end: ranges.end(index) });
  return found;
}

/** One drawn piece of the bar: the whole length, or a chapter of it. */
export interface SeekBarSegment {
  start: number;
  end: number;
}

/** The pieces the bar is drawn in. Chapters that start at 0 or past the end are ignored, and so are repeats. */
export function segmentsOf(duration: number, chapters: readonly SeekBarChapter[] | undefined): SeekBarSegment[] {
  const starts = [...new Set((chapters ?? []).map((chapter) => chapter.start).filter((start) => start > 0 && start < duration))].sort((a, b) => a - b);
  const edges = [0, ...starts, duration];
  return edges.slice(0, -1).map((start, index) => ({ start, end: edges[index + 1] ?? duration }));
}
