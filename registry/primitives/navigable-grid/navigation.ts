/**
 * The keyboard model of NavigableGrid, without React: where a key takes the focus, how far PageDown goes, and which
 * controls inside a cell are kept out of the Tab order until the cell is entered. It reads the grid from the DOM, so it
 * follows whatever the cells render, and it asks which cells are displayed, so a column hidden by a media query is
 * stepped over instead of swallowing the focus.
 */

/** A place in the grid. Row 0 is the header row; the body starts at row 1. */
export interface GridPosition {
  row: number;
  column: number;
}

/** How big the grid is, and which cells can take focus at the moment (a cell that is not displayed cannot). */
export interface GridShape {
  rows: number;
  columns: number;
  open: (row: number, column: number) => boolean;
}

/** What a key press needs to know besides the key. */
export interface KeyContext {
  /** Ctrl or Cmd is held: the arrows jump to the edge, Home and End to the corners. */
  jump: boolean;
  /** The grid reads right to left, so the horizontal arrows swap. */
  rtl: boolean;
  /** How many rows PageUp and PageDown move. */
  page: number;
}

/** Every cell the model moves between carries its place in these two attributes. */
export const ROW = "data-grid-row";
export const COLUMN = "data-grid-column";
export const CELL = `[${ROW}][${COLUMN}]`;

/** Holds the `tabindex` a control had before the grid took it out of the Tab order ("" when it had none). */
const KEPT = "data-grid-tabindex";

/** Everything a keyboard can land on inside a cell. */
const REACHABLE =
  'a[href], area[href], button, input:not([type="hidden"]), select, textarea, summary, iframe, audio[controls], video[controls], [contenteditable]:not([contenteditable="false"]), [tabindex]';

/** The cells by place: `cells[row][column]`. */
export function cellsOf(grid: HTMLElement): (HTMLElement | undefined)[][] {
  const rows: (HTMLElement | undefined)[][] = [];
  for (const cell of grid.querySelectorAll<HTMLElement>(CELL)) {
    const row = Number(cell.getAttribute(ROW));
    const column = Number(cell.getAttribute(COLUMN));
    (rows[row] ??= [])[column] = cell;
  }
  return rows;
}

/** A cell that is displayed has boxes; one under `display: none` has none and cannot take focus. */
const displayed = (element: HTMLElement) => element.getClientRects().length > 0;

/** A control the keyboard can really reach: displayed, and not `visibility: hidden` either, which keeps its boxes but cannot take focus. */
const reachable = (element: HTMLElement) => (typeof element.checkVisibility === "function" ? element.checkVisibility({ checkVisibilityCSS: true, visibilityProperty: true }) : element.getClientRects().length > 0);

/** The shape of the grid the cells make, with a test for which of them are displayed right now. */
export function shapeOf(cells: readonly (readonly (HTMLElement | undefined)[] | undefined)[]): GridShape {
  const columns = cells.reduce((most, row) => Math.max(most, row?.length ?? 0), 0);
  return {
    rows: cells.length,
    columns,
    open: (row, column) => {
      const cell = cells[row]?.[column];
      return cell !== undefined && displayed(cell);
    },
  };
}

/** The nearest open cell from (row, column), stepping one way until the edge. The start itself is not looked at. */
function scan(shape: GridShape, row: number, column: number, stepRow: number, stepColumn: number): GridPosition | null {
  for (let r = row + stepRow, c = column + stepColumn; r >= 0 && r < shape.rows && c >= 0 && c < shape.columns; r += stepRow, c += stepColumn) {
    if (shape.open(r, c)) return { row: r, column: c };
  }
  return null;
}

const firstInRow = (shape: GridShape, row: number) => scan(shape, row, -1, 0, 1);
const lastInRow = (shape: GridShape, row: number) => scan(shape, row, shape.columns, 0, -1);
const firstInColumn = (shape: GridShape, column: number) => scan(shape, -1, column, 1, 0);
const lastInColumn = (shape: GridShape, column: number) => scan(shape, shape.rows, column, -1, 0);

/** The top left corner: the first open cell of the first row that has one. */
export function topLeft(shape: GridShape): GridPosition | null {
  for (let row = 0; row < shape.rows; row += 1) {
    const found = firstInRow(shape, row);
    if (found) return found;
  }
  return null;
}

/** The bottom right corner: the last open cell of the last row that has one. */
function bottomRight(shape: GridShape): GridPosition | null {
  for (let row = shape.rows - 1; row >= 0; row -= 1) {
    const found = lastInRow(shape, row);
    if (found) return found;
  }
  return null;
}

/** Where the Tab stop goes when its cell can no longer take focus: along the same row, then anywhere. */
export function nearestOpen(shape: GridShape, from: GridPosition): GridPosition | null {
  return scan(shape, from.row, from.column, 0, 1) ?? scan(shape, from.row, from.column, 0, -1) ?? topLeft(shape);
}

/** The place of a cell, from its attributes. They stay on a cell that has been removed from the page. */
export const placeOf = (cell: HTMLElement): GridPosition => ({ row: Number(cell.getAttribute(ROW)), column: Number(cell.getAttribute(COLUMN)) });

/**
 * Where the Tab stop has to move because the cell it is meant to sit on is not displayed (a media query or a class hid its
 * column), or null when it is where it should be. A stop on a hidden cell would drop the whole grid out of the Tab order.
 * It asks about the cell the grid means to put the stop on, not about the DOM: the DOM is updated a moment after the state.
 */
export function misplacedStop(grid: HTMLElement, at: GridPosition): GridPosition | null {
  // Called after every render, so the common answer (it is fine) costs one lookup and not a walk of the whole grid.
  const cell = grid.querySelector<HTMLElement>(`[${ROW}="${at.row}"][${COLUMN}="${at.column}"]`);
  if (cell && displayed(cell)) return null;
  const shape = shapeOf(cellsOf(grid));
  return shape.open(at.row, at.column) ? null : nearestOpen(shape, at);
}

/** The cell that now sits where `lost` was, a cell whose row has been removed: the same place, or the nearest one that is still there. */
export function heirOf(grid: HTMLElement, lost: HTMLElement): HTMLElement | undefined {
  const cells = cellsOf(grid);
  const shape = shapeOf(cells);
  const was = placeOf(lost);
  const place = { row: Math.min(was.row, shape.rows - 1), column: was.column };
  const spot = shape.open(place.row, place.column) ? place : nearestOpen(shape, place);
  return spot ? cells[spot.row]?.[spot.column] : undefined;
}

/**
 * Where `key` takes the focus from `from`. A position when the focus moves, `null` when the key is one of the grid's
 * but there is nowhere to go (an edge), `undefined` when the key is not the grid's at all and should be left alone.
 * Edges stop: the focus does not wrap to the next row, as a spreadsheet does not.
 */
export function destination(shape: GridShape, from: GridPosition, key: string, { jump, rtl, page }: KeyContext): GridPosition | null | undefined {
  const forward = rtl ? -1 : 1;
  switch (key) {
    case "ArrowRight":
      return jump ? (rtl ? firstInRow : lastInRow)(shape, from.row) : scan(shape, from.row, from.column, 0, forward);
    case "ArrowLeft":
      return jump ? (rtl ? lastInRow : firstInRow)(shape, from.row) : scan(shape, from.row, from.column, 0, -forward);
    case "ArrowDown":
      return jump ? lastInColumn(shape, from.column) : scan(shape, from.row, from.column, 1, 0);
    case "ArrowUp":
      return jump ? firstInColumn(shape, from.column) : scan(shape, from.row, from.column, -1, 0);
    case "Home":
      return jump ? topLeft(shape) : firstInRow(shape, from.row);
    case "End":
      return jump ? bottomRight(shape) : lastInRow(shape, from.row);
    case "PageDown": {
      const row = Math.min(shape.rows - 1, from.row + page);
      const found = row > from.row ? scan(shape, row + 1, from.column, -1, 0) : null;
      return found && found.row > from.row ? found : null;
    }
    case "PageUp": {
      const row = Math.max(0, from.row - page);
      const found = row < from.row ? scan(shape, row - 1, from.column, 1, 0) : null;
      return found && found.row < from.row ? found : null;
    }
    default:
      return undefined;
  }
}

/** The nearest ancestor that scrolls up and down, or null when the page itself does. */
function scrollBoxOf(element: HTMLElement): HTMLElement | null {
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight + 1) return node;
  }
  return null;
}

/**
 * How many rows PageDown moves: what fits in the scroll box the grid sits in, or in the window when it sits in none, less
 * one row so the last one stays in view and the eye has something to hold on to.
 */
export function screenful(grid: HTMLElement, row: HTMLElement): number {
  const height = row.getBoundingClientRect().height || 40;
  const room = scrollBoxOf(grid)?.clientHeight ?? window.innerHeight;
  return Math.max(1, Math.floor(room / height) - 1);
}

/** The controls in a cell that Enter can hand the focus to, in order. */
export function controlsIn(cell: HTMLElement): HTMLElement[] {
  return Array.from(cell.querySelectorAll<HTMLElement>(REACHABLE)).filter((control) => {
    if (control.matches(":disabled") || control.closest("[inert], [aria-hidden='true']")) return false;
    // A control its author left out of the Tab order stays out (a hidden input); one the grid silenced is still ours.
    if (control.getAttribute("tabindex") === "-1" && !control.hasAttribute(KEPT)) return false;
    return reachable(control);
  });
}

/**
 * Makes the grid one Tab stop. The cells carry the stop themselves; every control inside a cell leaves the Tab order,
 * except those of the `engaged` cell, the one the focus is inside. A control's own `tabindex` is remembered and put
 * back when its cell is entered. It is safe to call again at any time: it only changes what is out of line.
 */
export function syncStops(grid: HTMLElement, engaged: HTMLElement | null): void {
  for (const control of grid.querySelectorAll<HTMLElement>(REACHABLE)) {
    if (control.matches(CELL)) continue;
    const cell = control.closest<HTMLElement>(CELL);
    if (!cell || !grid.contains(cell)) continue;
    const own = control.getAttribute("tabindex");
    if (cell === engaged) {
      if (!control.hasAttribute(KEPT)) continue;
      const kept = control.getAttribute(KEPT);
      control.removeAttribute(KEPT);
      if (kept) control.setAttribute("tabindex", kept);
      else control.removeAttribute("tabindex");
    } else if (own !== "-1") {
      control.setAttribute(KEPT, own ?? "");
      control.setAttribute("tabindex", "-1");
    }
  }
}
