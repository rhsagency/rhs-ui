/**
 * Height of the sticky header in px. The header is part of the scrollable
 * content (it sticks to the top of the box), so the maths below count it: the
 * first row starts this far down, and the top of the viewport is hidden
 * behind it.
 */
export const HEADER_HEIGHT = 40;

export interface WindowInput {
  /** How far the box has scrolled, in px. */
  scrollTop: number;
  /** The height of the box, in px. */
  viewport: number;
  /** How many rows there are in all. */
  total: number;
  /** The height of every row, in px. Every row is the same, which is what makes the maths this simple. */
  rowHeight: number;
  /** Rows kept in the DOM above and below what is in view. */
  overscan: number;
}

export interface RowWindow {
  /** The first row in the DOM. */
  start: number;
  /** One past the last row in the DOM. */
  end: number;
  /** The first row in view below the header (the last row is `last`). */
  first: number;
  last: number;
}

/** Which rows are in view, and which rows to keep in the DOM around them. All indexes are 0-based. */
export function windowOf({ scrollTop, viewport, total, rowHeight, overscan }: WindowInput): RowWindow {
  if (total <= 0) return { start: 0, end: 0, first: 0, last: -1 };
  // A stale scroll position (the data just got shorter) reads as the bottom, which is where the browser will put it.
  const reach = Math.max(0, HEADER_HEIGHT + total * rowHeight - viewport);
  const top = Math.min(Math.max(0, scrollTop), reach);
  const visible = Math.max(0, viewport - HEADER_HEIGHT);
  const first = Math.min(total - 1, Math.floor(top / rowHeight));
  const last = Math.min(total - 1, Math.max(first, Math.ceil((top + visible) / rowHeight) - 1));
  return { start: Math.max(0, first - overscan), end: Math.min(total, last + 1 + overscan), first, last };
}

export function sameWindow(a: RowWindow, b: RowWindow): boolean {
  return a.start === b.start && a.end === b.end && a.first === b.first && a.last === b.last;
}
