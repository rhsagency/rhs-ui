/**
 * The engine of the find bar, as plain functions with no state and no hook: it reads the text of a region, finds a query in
 * it in slices so a big document never stalls typing, and marks what it found either with the CSS Custom Highlight API or, where
 * the browser has none, by wrapping the matches in `<mark>`. A Server Component can import the words and the types from here.
 */

/** The options of a search. */
export interface FindOptions {
  /** `A` is not `a`. */
  caseSensitive: boolean;
  /** `cat` is not found inside `category`. */
  wholeWord: boolean;
}

/** What `onMatchesChange` receives. */
export interface FindMatches {
  /** What was searched for. */
  query: string;
  /** How many matches there are. The count stops at 10 000. */
  total: number;
  /** The one that is current, from 1 (the "3" of "3 of 12"), or 0 when there is none. */
  current: number;
}

/** The words the bar says, for translation. Use `{current}` and `{total}` where the defaults do. */
export interface FindLabels {
  /** The name of the bar, for screen readers. Default "Find in page". */
  label?: string;
  /** The hint in the field, and its name. Default "Find". */
  find?: string;
  /** The count. Default "{current} of {total}". */
  count?: string;
  /** What is said when the text is nowhere. Default "No results". */
  noResults?: string;
  /** The name of the button that goes to the previous match. Default "Previous match". */
  previous?: string;
  /** The name of the button that goes to the next match. Default "Next match". */
  next?: string;
  /** The name of the button that tells upper case from lower case. Default "Match case". */
  matchCase?: string;
  /** The name of the button that finds whole words only. Default "Whole word". */
  wholeWord?: string;
  /** The name of the button that closes the bar. Default "Close". */
  close?: string;
}

export const DEFAULT_LABELS = {
  label: "Find in page",
  find: "Find",
  count: "{current} of {total}",
  noResults: "No results",
  previous: "Previous match",
  next: "Next match",
  matchCase: "Match case",
  wholeWord: "Whole word",
  close: "Close",
} satisfies Required<FindLabels>;

/** Puts values into a template: `fill("{current} of {total}", { current: 3, total: 12 })`. A name it does not know is left as it was. */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in values ? String(values[key]) : match));
}

/** No more matches than this are kept: a query that matches everything must not take the page down. */
export const MAX_MATCHES = 10_000;

/** The class of a wrapper mark, for the browsers that cannot paint a range. The current match adds `data-current`. */
export const MARK_CLASS = "rounded-[2px] bg-foreground/20 text-inherit data-[current]:bg-foreground data-[current]:text-background";

/** Elements whose text is never searched: code that is not text, hidden text, and text that is only for screen readers. */
const SKIPPED = "script,style,noscript,template,textarea,select,option,[hidden],[aria-hidden='true'],.sr-only,[data-find-skip],[data-slot='find-in-page-bar']";

/** Elements that end a line of text: a match is never found across two of them. */
const BLOCKS =
  "address,article,aside,blockquote,dd,details,dialog,div,dl,dt,fieldset,figcaption,figure,footer,form,h1,h2,h3,h4,h5,h6,header,hgroup,hr,li,main,nav,ol,p,pre,section,summary,table,tbody,td,tfoot,th,thead,tr,ul";

/** The pattern for a query, or null when there is nothing to look for. The query is text, never a pattern: every character is taken as it is. */
export function buildPattern(query: string, { caseSensitive, wholeWord }: FindOptions): RegExp | null {
  if (query.trim() === "") return null;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const body = wholeWord ? `(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])` : escaped;
  try {
    return new RegExp(body, caseSensitive ? "gu" : "giu");
  } catch {
    return null;
  }
}

/** The text nodes of one line of text (a paragraph, a list item), and the text they make together. */
export interface TextBlock {
  nodes: Text[];
  /** Where each node starts in `text`. */
  starts: number[];
  /** The text of all the nodes, with non-breaking spaces as spaces so a typed space finds them. */
  text: string;
}

function blockOf(nodes: Text[]): TextBlock {
  const starts: number[] = [];
  let text = "";
  for (const node of nodes) {
    starts.push(text.length);
    text += node.data;
  }
  return { nodes, starts, text: text.replace(/\u00a0/g, " ") };
}

function searchable(element: Element, root: Element, seen: Map<Element, boolean>): boolean {
  const known = seen.get(element);
  if (known !== undefined) return known;
  const skipped = element.closest(SKIPPED);
  let ok = !skipped || !root.contains(skipped);
  // Text that is not drawn (display none, inside a closed details) is not found: it could not be shown.
  if (ok && typeof element.checkVisibility === "function") ok = element.checkVisibility({ checkVisibilityCSS: true });
  seen.set(element, ok);
  return ok;
}

/** Walks the text of a region and hands it over one line of text at a time. */
function* readBlocks(root: HTMLElement): Generator<TextBlock> {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const seen = new Map<Element, boolean>();
  let owner: Element | null = null;
  let nodes: Text[] = [];
  for (let node = walker.nextNode() as Text | null; node; node = walker.nextNode() as Text | null) {
    const element = node.parentElement;
    if (!element || node.data === "" || !searchable(element, root, seen)) continue;
    const line: Element = element.closest(BLOCKS) ?? root;
    if (line !== owner && nodes.length) {
      yield blockOf(nodes);
      nodes = [];
    }
    owner = line;
    nodes.push(node);
  }
  if (nodes.length) yield blockOf(nodes);
}

/**
 * The text of a region, read once and kept for the next query: typing "late", "laten", "latenc" does not walk the page three
 * times. It reads as far as it is asked to, so the first query does not wait for the whole document. Make a new one when the
 * region changes.
 */
export class BlockStore {
  readonly blocks: TextBlock[] = [];
  private done = false;
  private readonly source: Generator<TextBlock>;

  constructor(root: HTMLElement) {
    this.source = readBlocks(root);
  }

  /** The block at a place in the document, reading on to it if it has not been read yet; undefined past the end. */
  at(index: number): TextBlock | undefined {
    while (index >= this.blocks.length && !this.done) {
      const next = this.source.next();
      if (next.done) this.done = true;
      else this.blocks.push(next.value);
    }
    return this.blocks[index];
  }
}

/** The part of a match that lies in one text node. */
export interface Piece {
  node: Text;
  from: number;
  to: number;
}

/**
 * One match: where it lies in the text nodes, and, when the search was asked for them, a range over it for painting with the CSS
 * Custom Highlight API and for scrolling. Wrapping matches in marks needs no range, and a range is a liability there: every one is
 * live, so every node that is split or moved has to update all of them.
 */
export interface FoundMatch {
  pieces: Piece[];
  range: Range | null;
}

/** The index of the last text node that starts before the offset (or at it, when it is the start of a match). */
function nodeAt(block: TextBlock, offset: number, atEnd: boolean): number {
  let low = 0;
  let high = block.starts.length - 1;
  while (low < high) {
    const middle = (low + high + 1) >> 1;
    const start = block.starts[middle] ?? 0;
    if (atEnd ? start < offset : start <= offset) low = middle;
    else high = middle - 1;
  }
  return low;
}

function matchOf(block: TextBlock, start: number, end: number, ranges: boolean): FoundMatch {
  const first = nodeAt(block, start, false);
  const last = nodeAt(block, end, true);
  const pieces: Piece[] = [];
  for (let at = first; at <= last; at += 1) {
    const node = block.nodes[at] as Text;
    const base = block.starts[at] ?? 0;
    pieces.push({ node, from: Math.max(start - base, 0), to: Math.min(end - base, node.length) });
  }
  if (!ranges) return { pieces, range: null };
  const range = document.createRange();
  const head = pieces[0] as Piece;
  const tail = pieces[pieces.length - 1] as Piece;
  range.setStart(head.node, head.from);
  range.setEnd(tail.node, tail.to);
  return { pieces, range };
}

/** Waits for the browser to be idle, and for a moment in browsers that cannot say. */
export function idle(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestIdleCallback === "function") requestIdleCallback(() => resolve(), { timeout: 150 });
    else setTimeout(resolve, 16);
  });
}

/** The longest a slice works before it gives the page back, in milliseconds. */
const SLICE_MS = 10;

export interface Batch {
  /** The matches found since the last batch, in document order. */
  matches: FoundMatch[];
  /** The search has looked at everything, or reached the limit. */
  done: boolean;
  /** It stopped at the limit. */
  capped: boolean;
}

export interface FindAllOptions {
  /** The most matches to hand over. Default `MAX_MATCHES`. */
  limit?: number;
  /** Give each match a live range, for painting with the Highlight API. Leave it off when the matches are wrapped in marks. Default true. */
  ranges?: boolean;
}

/**
 * Looks for a pattern in the text of a region and hands the matches over in batches, in document order. Each slice of work is a
 * few milliseconds and then waits for the browser to be idle, so typing, scrolling and clicking never wait for a search of a
 * log of a hundred thousand lines. `stale` says the query has moved on: the search then stops at once.
 */
export async function* findAll(store: BlockStore, pattern: RegExp, stale: () => boolean, { limit = MAX_MATCHES, ranges = true }: FindAllOptions = {}): AsyncGenerator<Batch> {
  let batch: FoundMatch[] = [];
  let total = 0;
  let started = performance.now();
  for (let index = 0; ; index += 1) {
    const block = store.at(index);
    if (!block) break;
    pattern.lastIndex = 0;
    for (let found = pattern.exec(block.text); found; found = pattern.exec(block.text)) {
      if (found[0] === "") {
        pattern.lastIndex += 1;
        continue;
      }
      batch.push(matchOf(block, found.index, found.index + found[0].length, ranges));
      total += 1;
      if (total >= limit) {
        yield { matches: batch, done: true, capped: true };
        return;
      }
    }
    if (performance.now() - started > SLICE_MS) {
      yield { matches: batch, done: false, capped: false };
      batch = [];
      await idle();
      if (stale()) return;
      started = performance.now();
    }
  }
  yield { matches: batch, done: true, capped: false };
}

/** A place in the document, kept so the next search can start from where the last one was. */
export interface Anchor {
  node: Node;
  offset: number;
}

/**
 * Whether a match starts at the anchor or after it, or contains it: the one to continue with when the query grows. It is read from the
 * pieces of the match, not from a range, so it holds for matches that were found without one.
 */
export function isFrom(match: FoundMatch, anchor: Anchor): boolean {
  const tail = match.pieces[match.pieces.length - 1];
  if (!tail) return true;
  if (tail.node === anchor.node) return anchor.offset <= tail.to;
  const where = anchor.node.compareDocumentPosition(tail.node);
  // An anchor that is no longer in the document cannot be compared: the search starts from the first match.
  if (where & Node.DOCUMENT_POSITION_DISCONNECTED) return true;
  return (where & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
}

/** The index of the first match that is `isFrom` the anchor, or -1 when there is none. The matches are in document order, so it is a bisection. */
export function findFrom(matches: readonly FoundMatch[], anchor: Anchor): number {
  let low = 0;
  let high = matches.length;
  while (low < high) {
    const middle = (low + high) >> 1;
    if (isFrom(matches[middle] as FoundMatch, anchor)) high = middle;
    else low = middle + 1;
  }
  return low < matches.length ? low : -1;
}

/* ---- painting with the CSS Custom Highlight API ---- */

/** Whether the browser can paint a range without touching the page's elements. */
export function canHighlight(): boolean {
  return typeof CSS !== "undefined" && "highlights" in CSS && typeof Highlight !== "undefined";
}

/**
 * Adds the rules that paint the two highlights of one bar: every match in a soft tone of the text colour, the current one in the
 * inverted colours. They are written into a constructable stylesheet, which a strict Content Security Policy does not block the
 * way it blocks a style element, and they use the page's own tokens, so both themes work. Returns the function that takes them out.
 */
export function addHighlightStyles(all: string, current: string): () => void {
  if (typeof CSSStyleSheet === "undefined" || !("adoptedStyleSheets" in document)) return () => {};
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(
    [
      `::highlight(${all}) { background-color: color-mix(in oklab, var(--foreground, CanvasText) 20%, transparent); color: inherit; }`,
      `::highlight(${current}) { background-color: var(--foreground, CanvasText); color: var(--background, Canvas); }`,
      `@media (forced-colors: active) { ::highlight(${all}) { background-color: Mark; color: MarkText; } ::highlight(${current}) { background-color: Highlight; color: HighlightText; } }`,
    ].join("\n"),
  );
  document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
  return () => {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter((other) => other !== sheet);
  };
}

/* ---- painting with wrapper marks ---- */

/**
 * The most matches that are wrapped in marks at one time. Wrapping is a few DOM changes for each match, so wrapping every match of a
 * log with ten thousand lines on every key press would hold the page for seconds; the ones around the current match are marked, and
 * the marks move along when the current match does. The count always covers every match.
 */
export const MAX_MARKED = 500;

/** What wrapping changed, so it can be undone exactly. */
export interface Wrapped {
  /** The marks of each match that was wrapped, by the index of the match. */
  marks: Map<number, HTMLElement[]>;
  /** The text nodes that were split, with what they said before. */
  originals: Map<Text, string>;
  /** The text nodes the splitting made. */
  created: Text[];
}

/**
 * Wraps the matches from `start` up to (not including) `end` in a `<mark>` each, from the last to the first so the offsets of the ones
 * before stay true. A match across several text nodes gets a mark in each. Undo it with `unwrap` before wrapping any other matches:
 * the offsets of the others are those of the text as it was.
 */
export function wrap(matches: readonly FoundMatch[], start = 0, end = matches.length): Wrapped {
  const wrapped: Wrapped = { marks: new Map(), originals: new Map(), created: [] };
  for (let at = Math.min(end, matches.length) - 1; at >= Math.max(start, 0); at -= 1) {
    const marks: HTMLElement[] = [];
    const pieces = (matches[at] as FoundMatch).pieces;
    for (let piece = pieces.length - 1; piece >= 0; piece -= 1) {
      const { node, from, to } = pieces[piece] as Piece;
      if (!node.isConnected) continue;
      if (!wrapped.originals.has(node)) wrapped.originals.set(node, node.data);
      if (to < node.length) wrapped.created.push(node.splitText(to));
      const middle = from > 0 ? node.splitText(from) : node;
      if (from > 0) wrapped.created.push(middle);
      const mark = document.createElement("mark");
      mark.setAttribute("data-rhs-find", "");
      mark.className = MARK_CLASS;
      middle.parentNode?.insertBefore(mark, middle);
      mark.appendChild(middle);
      marks.unshift(mark);
    }
    wrapped.marks.set(at, marks);
  }
  return wrapped;
}

/** Takes the marks out and puts the text back the way it was: the same nodes, with the same words, in the same places. */
export function unwrap(wrapped: Wrapped): void {
  for (const group of wrapped.marks.values()) {
    for (const mark of group) {
      const parent = mark.parentNode;
      if (!parent) continue;
      while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
      parent.removeChild(mark);
    }
  }
  for (const node of wrapped.created) node.remove();
  for (const [node, data] of wrapped.originals) node.data = data;
}

/* ---- scrolling ---- */

function scrollable(element: Element): boolean {
  const style = getComputedStyle(element);
  return /(auto|scroll|overlay)/.test(style.overflowY + style.overflowX) && (element.scrollHeight > element.clientHeight || element.scrollWidth > element.clientWidth);
}

/**
 * Scrolls whatever has to scroll so the match is inside its container with room to spare: it is not left at the very edge, or
 * under the find bar. `measure` gives the match's rectangle and is read again after each container has moved. Nothing moves
 * when it is already comfortably in view. The scrolling is instant, so stepping through matches with Enter keeps up with the fingers.
 */
export function scrollIntoMargin(measure: () => DOMRect, from: Element | null, margin: number): void {
  for (let element = from; element && element !== document.documentElement; element = element.parentElement) {
    if (!scrollable(element)) continue;
    const rect = measure();
    const box = element.getBoundingClientRect();
    const room = Math.min(margin, box.height / 4);
    const above = rect.top - (box.top + room);
    const below = rect.bottom - (box.bottom - room);
    const left = rect.left - (box.left + room);
    const right = rect.right - (box.right - room);
    const top = above < 0 ? above : below > 0 ? Math.min(below, above) : 0;
    const side = left < 0 ? left : right > 0 ? Math.min(right, left) : 0;
    if (top || side) element.scrollBy({ top, left: side, behavior: "instant" });
  }
  const rect = measure();
  const room = Math.min(margin, window.innerHeight / 4);
  const top = rect.top < room ? rect.top - room : rect.bottom > window.innerHeight - room ? Math.min(rect.bottom - (window.innerHeight - room), rect.top - room) : 0;
  if (top) window.scrollBy({ top, behavior: "instant" });
}
