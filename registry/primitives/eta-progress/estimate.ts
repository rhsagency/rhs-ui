/** One reading of how far the work had got (0 to 1), and when it was taken, in ms. */
export interface EtaSample {
  at: number;
  value: number;
}

/** The words for the units of time. */
export interface EtaUnits {
  s: string;
  min: string;
  hr: string;
}

/** What the line under the bar says. */
export type EtaDisplay =
  | { kind: "calculating" }
  | { kind: "left"; seconds: number }
  | { kind: "almost" }
  | { kind: "finished"; seconds: number | null };

/** The recent pace counts for this much of the estimate, and the pace of the whole run for the rest. */
const RECENT_WEIGHT = 0.7;
/** The recent pace is the pace of this much of the latest history, in ms. */
const WINDOW = 20_000;
/** A pace is not read from less history than this, in ms. */
const SHORTEST = 3_000;

/**
 * How long is left, in ms, from the pace so far: the recent pace (the last 20
 * seconds of samples) blended with the pace of the whole run, so one fast or
 * slow stretch moves the answer but does not throw it. A stalled bar makes the
 * answer longer, not wild. null while there is not enough to go on.
 */
export function estimateRemaining(samples: readonly EtaSample[], startedAt: number, now: number, value: number): number | null {
  if (value >= 1) return 0;
  const elapsed = now - startedAt;
  if (elapsed <= 0 || value <= 0) return null;
  const overall = value / elapsed;
  const first = samples.find((sample) => sample.at >= now - WINDOW);
  let rate = overall;
  if (first && now - first.at >= SHORTEST) {
    const recent = Math.max(0, (value - first.value) / (now - first.at));
    rate = RECENT_WEIGHT * recent + (1 - RECENT_WEIGHT) * overall;
  }
  return rate > 0 ? (1 - value) / rate : null;
}

/** The size of the steps a time left is told in: 5 seconds, then 10, then whole minutes, then 5 minutes, then 10. */
function stepOf(seconds: number): number {
  return seconds < 15 ? 5 : seconds < 60 ? 10 : seconds < 600 ? 60 : seconds < 3600 ? 300 : 600;
}

/** Rounds a time left to a friendly step, never below the first step. */
export function roundSeconds(seconds: number): number {
  const step = stepOf(seconds);
  return Math.max(step, Math.round(seconds / step) * step);
}

/**
 * The time left to show: the one already on screen, unless the new estimate has
 * moved well past it (three quarters of a step and a tenth of the value), so the
 * line does not flicker between neighbours as the pace wobbles.
 */
export function settleSeconds(shown: number | null, rawSeconds: number): number {
  const next = roundSeconds(rawSeconds);
  if (shown === null || shown === next) return next;
  const slack = Math.max(Math.min(stepOf(shown), stepOf(next)) * 0.75, shown * 0.1);
  return Math.abs(rawSeconds - shown) > slack ? next : shown;
}

/** "40 s", "2 min", "1 min 20 s", "1 hr 5 min": seconds only below an hour, zero parts left out. */
export function formatDuration(seconds: number, units: EtaUnits): string {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  const parts: string[] = [];
  if (hours) parts.push(`${hours} ${units.hr}`);
  if (minutes) parts.push(`${minutes} ${units.min}`);
  if (rest && !hours) parts.push(`${rest} ${units.s}`);
  return parts.join(" ") || `0 ${units.s}`;
}

export interface EtaInput {
  /** Readings so far, oldest first, the latest one included. */
  samples: readonly EtaSample[];
  startedAt: number;
  now: number;
  value: number;
  /** For this long after the start the line says it is calculating, in ms. */
  calculatingFor: number;
  /** When the work finished, if that is known. */
  finishedAt: number | null;
}

/**
 * What the line should say now, given what it said before: calculating while
 * there is no pace to read, a settled time left, almost done in the last
 * seconds (and it takes more than a few more to leave that), and the time it
 * took once the work has finished. Returns `previous` itself when nothing has
 * changed, so a caller can skip the render.
 */
export function nextDisplay(previous: EtaDisplay, { samples, startedAt, now, value, calculatingFor, finishedAt }: EtaInput): EtaDisplay {
  if (value >= 1) {
    const seconds = finishedAt === null ? null : Math.max(0, Math.round((finishedAt - startedAt) / 1000));
    return previous.kind === "finished" && previous.seconds === seconds ? previous : { kind: "finished", seconds };
  }
  const raw = estimateRemaining(samples, startedAt, now, value);
  if (now - startedAt < calculatingFor || raw === null) return previous.kind === "left" || previous.kind === "almost" ? previous : { kind: "calculating" };
  const seconds = raw / 1000;
  if (seconds <= 5 || (previous.kind === "almost" && seconds <= 12)) return previous.kind === "almost" ? previous : { kind: "almost" };
  const settled = settleSeconds(previous.kind === "left" ? previous.seconds : null, seconds);
  return previous.kind === "left" && previous.seconds === settled ? previous : { kind: "left", seconds: settled };
}
