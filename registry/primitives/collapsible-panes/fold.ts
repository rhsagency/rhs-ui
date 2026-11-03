/**
 * The open panes in the order they are kept when there is not room for all of them: the ones a person opened most recently first (`recent`),
 * then the rest in the order of the list. The last of these are the first to fold.
 */
export function keepOrder(ids: readonly string[], open: readonly string[], recent: readonly string[]): string[] {
  const isOpen = new Set(open);
  const rank = (id: string) => {
    const seen = recent.indexOf(id);
    return seen === -1 ? recent.length + ids.indexOf(id) : seen;
  };
  return ids.filter((id) => isOpen.has(id)).sort((a, b) => rank(a) - rank(b));
}

/**
 * How many panes can be open at once: the height left once every header has its row, divided by the least height an open pane may have.
 * One pane can always be open, even when it cannot meet its minimum. With no height yet (before the first measurement) there is no limit.
 */
export function paneCapacity(height: number | null, headers: number, headerHeight: number, minPaneHeight: number): number {
  if (height === null) return Number.POSITIVE_INFINITY;
  return Math.max(1, Math.floor((height - headers * headerHeight) / Math.max(1, minPaneHeight)));
}

/** The panes that are really open, which is the open ones that fit: the ones that cannot meet their minimum height fold, last first. */
export function shownPanes(ids: readonly string[], open: readonly string[], recent: readonly string[], capacity: number): ReadonlySet<string> {
  return new Set(keepOrder(ids, open, recent).slice(0, Math.max(0, capacity)));
}

/**
 * The list of open ids after a click on a header. A pane that is really open closes. Any other (a closed one, or one folded for lack of
 * room) opens, which also makes it the one that stays when room is short; with `multiple` off it opens alone.
 */
export function toggledOpenIds(open: readonly string[], shown: ReadonlySet<string>, id: string, multiple: boolean): string[] {
  if (shown.has(id)) return open.filter((other) => other !== id);
  return multiple ? [...open.filter((other) => other !== id), id] : [id];
}
