/** A time in seconds as people write it on a player: "0:24", "1:42", and "1:02:30" past the hour. Anything negative or not finite reads as "0:00". */
export function formatTime(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = String(total % 60).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${rest}` : `${minutes}:${rest}`;
}

/** The same time as an ISO 8601 duration for a <time datetime>: 102 seconds is "PT1M42S". */
export function isoDuration(seconds: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds)) : 0;
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return `PT${hours ? `${hours}H` : ""}${minutes ? `${minutes}M` : ""}${total % 60}S`;
}

/**
 * The chapter that is playing at `time`: the last one that has started. `starts` must be in
 * ascending order. A hair of tolerance means that jumping to a chapter's own start time, which a
 * browser may land a frame short of, still counts as being in that chapter.
 */
export function chapterAt(starts: readonly number[], time: number): number {
  let index = 0;
  starts.forEach((start, position) => {
    if (start <= time + 0.1) index = position;
  });
  return index;
}

/** How far through chapter `index` the video is, from 0 to 1. The last chapter ends where the video does; with no duration it has no length to measure. */
export function chapterProgress(starts: readonly number[], index: number, time: number, duration: number): number {
  const from = starts[index] ?? 0;
  const to = starts[index + 1] ?? duration;
  if (!(to > from)) return 0;
  return Math.min(1, Math.max(0, (time - from) / (to - from)));
}
