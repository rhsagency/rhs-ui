/**
 * The parts of the listen button that need no React: cutting text into
 * sentences, finding those sentences in a page, drawing the one being read,
 * and keeping track of which button holds the voice. Nothing here speaks; the
 * button owns the speech engine.
 */

/** One sentence to read aloud. */
export interface Sentence {
  /** What is said, on one line. */
  text: string;
  /** Where it sits in the page, when the text came from an element. */
  range: Range | null;
}

interface Span {
  start: number;
  end: number;
}

interface Piece extends Span {
  node: Text;
}

// Block elements: a sentence never runs on from one into the next, so a heading without a full stop still ends.
const BLOCKS = "address, article, aside, blockquote, dd, div, dl, dt, figcaption, figure, footer, h1, h2, h3, h4, h5, h6, header, li, main, nav, ol, p, pre, section, table, td, th, tr, ul";
// Text a person does not read: scripts, styles, anything hidden from assistive technology, or marked `data-listen-skip`.
const SKIPPED = "script, style, noscript, template, svg, [hidden], [aria-hidden='true'], [data-listen-skip]";
// The full stops that do not end a sentence. Intl.Segmenter splits after "Dr." as well, so those pieces are joined again.
const ABBREVIATION = /(?:\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|No|Inc|Ltd|Co)|\b(?:[a-z]\.){1,3}[a-z])\.\s*$/i;

function trimmed(text: string, span: Span): Span {
  let { start, end } = span;
  while (start < end && /\s/.test(text.charAt(start))) start += 1;
  while (end > start && /\s/.test(text.charAt(end - 1))) end -= 1;
  return { start, end };
}

// Intl.Segmenter and the CSS Custom Highlight API are newer than some TypeScript libs a project compiles against, so they are typed here.
interface SegmenterLike {
  segment(input: string): Iterable<{ segment: string; index: number }>;
}
type SegmenterClass = new (locale: string, options: { granularity: "sentence" }) => SegmenterLike;
const segmenter = (): SegmenterClass | undefined => (Intl as unknown as { Segmenter?: SegmenterClass }).Segmenter;
interface HighlightsLike {
  set(name: string, highlight: unknown): unknown;
  delete(name: string): unknown;
}
type HighlightClass = new (...ranges: Range[]) => unknown;
const highlights = (): HighlightsLike | undefined => (typeof CSS === "undefined" ? undefined : (CSS as unknown as { highlights?: HighlightsLike }).highlights);
const highlightClass = (): HighlightClass | undefined => (globalThis as unknown as { Highlight?: HighlightClass }).Highlight;

/** Where each sentence of `text` starts and ends, in the language given. */
function sentenceSpans(text: string, lang: string): Span[] {
  const raw: Span[] = [];
  const Segmenter = segmenter();
  if (Segmenter) {
    try {
      for (const part of new Segmenter(lang, { granularity: "sentence" }).segment(text)) raw.push({ start: part.index, end: part.index + part.segment.length });
    } catch {
      // An unknown language tag: the plain rule below does the job.
    }
  }
  if (!raw.length) {
    for (const match of text.matchAll(/[^.!?…]+(?:[.!?…]+["'”’)\]]*|$)\s*/g)) raw.push({ start: match.index, end: match.index + match[0].length });
  }
  const joined: Span[] = [];
  for (const span of raw) {
    const last = joined[joined.length - 1];
    const before = last ? text.slice(last.start, last.end) : "";
    // A full stop followed on the same line by a lower-case letter ("5 p.m. in") is inside a sentence, not between two.
    const inside = /\.[^\S\n]*$/.test(before) && /^\p{Ll}/u.test(text.slice(span.start, span.end));
    if (last && (ABBREVIATION.test(before) || inside)) last.end = span.end;
    else joined.push({ ...span });
  }
  return joined.map((span) => trimmed(text, span)).filter((span) => span.end > span.start);
}

const say = (text: string) => text.replace(/\s+/g, " ").trim();
// A sentence with no letter or digit in it (a lone dash, a bullet) is not worth a pause in the speech.
const speakable = (text: string) => /[\p{L}\p{N}]/u.test(text);

function hidden(node: Node, root: Element): boolean {
  for (let element = node.parentElement; element; element = element.parentElement) {
    if (element.matches(SKIPPED)) return true;
    if (element === root) return false;
  }
  return false;
}

function rangeOf(pieces: Piece[], span: Span): Range | null {
  const first = pieces.find((piece) => piece.end > span.start);
  const last = [...pieces].reverse().find((piece) => piece.start < span.end);
  if (!first || !last) return null;
  const range = document.createRange();
  range.setStart(first.node, Math.max(0, span.start - first.start));
  range.setEnd(last.node, Math.min(last.node.data.length, span.end - last.start));
  return range;
}

/** The text of an element as sentences, each with the range it covers, so the one being read can be drawn without touching the markup. */
function fromElement(root: Element, lang: string): Sentence[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const pieces: Piece[] = [];
  let text = "";
  let before: Element | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const run = node as Text;
    if (!run.data || hidden(run, root)) continue;
    const block = run.parentElement?.closest(BLOCKS) ?? root;
    if (before && block !== before) text += "\n";
    before = block;
    pieces.push({ node: run, start: text.length, end: text.length + run.data.length });
    text += run.data;
  }
  return sentenceSpans(text, lang)
    .map((span) => ({ text: say(text.slice(span.start, span.end)), range: rangeOf(pieces, span) }))
    .filter((sentence) => speakable(sentence.text));
}

/** What to read, as sentences: the text of the element when there is one, else the string. */
export function collectSentences(source: { text?: string; element?: Element | null }, lang: string): Sentence[] {
  if (source.element) return fromElement(source.element, lang);
  const text = source.text ?? "";
  return sentenceSpans(text, lang)
    .map((span) => ({ text: say(text.slice(span.start, span.end)), range: null }))
    .filter((sentence) => speakable(sentence.text));
}

const HIGHLIGHT = "rhs-listen";
const STYLE = `::highlight(${HIGHLIGHT}){background-color:color-mix(in oklab,var(--foreground,currentColor) 14%,transparent);color:inherit}`;
let adopted: CSSStyleSheet | null = null;

/**
 * Puts the rule that paints the highlight into the page, once. It is adopted as a
 * constructed style sheet, not added as a `<style>` element, so a site that
 * forbids inline styles still shows the sentence being read.
 */
function adoptStyle(): void {
  if (typeof CSSStyleSheet === "undefined" || !("adoptedStyleSheets" in document)) return;
  if (adopted && document.adoptedStyleSheets.includes(adopted)) return;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(STYLE);
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    adopted = sheet;
  } catch {
    // A browser that cannot adopt the rule still shows the progress, only without the highlight.
  }
}

/** Whether this browser can draw a range without wrapping it in markup (the CSS Custom Highlight API). Without it the progress still shows. */
export function canHighlight(): boolean {
  return highlights() !== undefined && highlightClass() !== undefined;
}

/** Draws one range as the sentence being read, or nothing. There is one reader at a time, so there is one highlight. */
export function drawHighlight(range: Range | null): void {
  const registry = highlights();
  const Highlighted = highlightClass();
  if (!registry || !Highlighted) return;
  if (!range) {
    registry.delete(HIGHLIGHT);
    return;
  }
  adoptStyle();
  registry.set(HIGHLIGHT, new Highlighted(range));
}

interface Holder {
  token: object;
  stop: () => void;
}
let holder: Holder | null = null;

/**
 * Takes the voice for a reader. A page has one speech engine and one highlight, so
 * the reader that had the voice is told to stop before the new one speaks: two
 * buttons never talk over each other, and neither pauses the other's voice.
 * `token` names the reader, `stop` is how it lets go.
 */
export function claimVoice(token: object, stop: () => void): void {
  const previous = holder;
  holder = { token, stop };
  if (previous && previous.token !== token) previous.stop();
}

/** Gives the voice back, if this reader is the one holding it. */
export function freeVoice(token: object): void {
  if (holder?.token === token) holder = null;
}

/** Brings a sentence into view when it has run off the screen, so reading along never means scrolling after it. */
export function followRange(range: Range | null): void {
  if (!range) return;
  const box = range.getBoundingClientRect();
  if (box.height === 0 || (box.top >= 0 && box.bottom <= window.innerHeight)) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  range.startContainer.parentElement?.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
}
