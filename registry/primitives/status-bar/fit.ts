/** A segment as the fitting sees it: how wide it is, and how long it should stay when the bar runs out of room. */
export interface MeasuredSegment {
  id: string;
  /** Which side of the bar it sits on. */
  group: "start" | "end";
  /** Its position in its own list, from 0. */
  index: number;
  /** How much it matters: higher stays longer. Segments with no opinion all have the same number. */
  priority: number;
  /** Its natural width in pixels, whether it is showing or not. */
  width: number;
}

/**
 * Which segments fit. They are taken in order of importance and kept for as long as they fit together; the first one that does not, and
 * everything less important than it, drops out. Importance is the priority, and where priorities are equal the position in the list: the
 * first of each side is the most important, the last the least, and the two sides take turns. Nothing less important ever stays when a more
 * important one has to go, so the bar never keeps a small segment and loses a big one next to it.
 *
 * `available` is the width of the bar and `reserve` what must stay free between the two sides (it only counts when both have a segment).
 */
export function fitSegments(segments: readonly MeasuredSegment[], available: number, reserve = 12): ReadonlySet<string> {
  const order = [...segments].sort((a, b) => b.priority - a.priority || a.index - b.index || (a.group === b.group ? 0 : a.group === "start" ? -1 : 1));
  const kept = new Set<string>();
  const sides = new Set<string>();
  let used = 0;
  for (const segment of order) {
    // The gap between the sides is only needed once both of them have something in it.
    const gap = sides.size === 1 && !sides.has(segment.group) ? reserve : 0;
    if (used + segment.width + gap > available) break;
    used += segment.width + gap;
    sides.add(segment.group);
    kept.add(segment.id);
  }
  return kept;
}
