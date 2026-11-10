"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type RefObject } from "react";

import { IconChevronDown, IconChevronUp, IconClose, IconSearch } from "@rhs-ui/icons";
import {
  addHighlightStyles,
  BlockStore,
  buildPattern,
  canHighlight,
  DEFAULT_LABELS,
  fill,
  findAll,
  findFrom,
  MAX_MARKED,
  scrollIntoMargin,
  unwrap,
  wrap,
  type Anchor,
  type FindLabels,
  type FindMatches,
  type FindOptions,
  type FoundMatch,
  type Wrapped,
} from "@rhs-ui/application/find-in-page-bar/search";
import { Button } from "@rhs-ui/primitives/button";
import { Toggle } from "@rhs-ui/primitives/toggle";
import { cn } from "@/lib/utils";

export type { FindLabels, FindMatches, FindOptions } from "@rhs-ui/application/find-in-page-bar/search";

export interface FindInPageBarProps extends Omit<ComponentProps<"div">, "children" | "onChange"> {
  /** The region to search: the article, the log, the document. Its text is read, never changed (the wrapper marks are taken out again). Make it focusable, or leave it to the bar: with the shortcut on it gets `tabindex="-1"` so a click inside puts keyboard focus there. */
  containerRef: RefObject<HTMLElement | null>;
  /** Whether the bar is open, when you control it. */
  open?: boolean;
  /** Whether it is open to begin with. */
  defaultOpen?: boolean;
  /** Called when the bar opens (the shortcut, or you) or closes (Escape, the close button). Closing takes the marks off the text and gives focus back to where it was. */
  onOpenChange?: (open: boolean) => void;
  /** What the field starts with, which is searched at once. */
  defaultQuery?: string;
  /** Upper case is not lower case: the state of the "Aa" button, when you control it. Pass `onOptionsChange` with it. */
  caseSensitive?: boolean;
  /** `cat` is not found in `category`: the state of the whole word button, when you control it. Pass `onOptionsChange` with it. */
  wholeWord?: boolean;
  /** Called with both options each time one of the two buttons is pressed. */
  onOptionsChange?: (options: FindOptions) => void;
  /** Open on Ctrl or Cmd with F while focus is inside the region, so the browser's own find still works everywhere else. Default true. */
  shortcut?: boolean;
  /** How matches are marked: "auto" uses the CSS Custom Highlight API where the browser has it, which leaves the page's elements alone, and wrapper marks where it does not; "marks" always wraps. Default "auto". */
  highlight?: "auto" | "marks";
  /** Called when the search has settled and each time the current match changes, with the query, how many matches there are and which one is current. */
  onMatchesChange?: (matches: FindMatches) => void;
  /** The language the counts are written in. Default "en-US". */
  locale?: string;
  /** The words the bar says, for translation. */
  labels?: FindLabels;
}

/** A Ctrl or Cmd with F, and no other modifier. */
const isFindKey = (event: { key: string; ctrlKey: boolean; metaKey: boolean; altKey: boolean; shiftKey: boolean }) =>
  (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "f";

/** In marks mode the marks move with the current match once it comes this close to the edge of the ones that are marked. */
const EDGE = 40;

/**
 * Find text inside a document, a log or an article. A small bar anchored to the top right of a region, with the count
 * ("3 of 12", said in a polite live region, "No results" when empty), next and previous, and the matches marked in the text:
 * with the CSS Custom Highlight API where the browser has it, and with wrapper marks where it does not. The current match is
 * marked more strongly and scrolled into view with room around it. Enter and Shift with Enter step through the matches, Escape closes
 * the bar and takes the marks off, and the case and whole-word options are real pressed buttons. A large document is searched in
 * idle slices, so typing never stalls; with wrapper marks, which are real changes to the page, about 500 matches around the current
 * one are marked at a time and the marks move along as it does, while the count always covers them all. Put the bar inside a
 * `relative` wrapper around the region, not inside the element that scrolls, so it stays put as the text moves, and leave room at the
 * top of the region as high as the bar (two rows on a phone) so the first lines are not under it. A bar that is open from the start
 * (`defaultOpen`, or `open` true on the first render) does not take focus or move the page: that is only for a bar somebody opened.
 */
export function FindInPageBar({
  containerRef,
  open,
  defaultOpen = false,
  onOpenChange,
  defaultQuery = "",
  caseSensitive,
  wholeWord,
  onOptionsChange,
  shortcut = true,
  highlight = "auto",
  onMatchesChange,
  locale = "en-US",
  labels,
  className,
  ...props
}: FindInPageBarProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const names = { all: `rhs-find-${id}`, current: `rhs-find-${id}-current` };
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const isOpen = open ?? ownOpen;
  const [mounted, setMounted] = useState(isOpen);
  // A bar that is open from the start (a preview, a log with its query ready) leaves the page alone: it takes no focus and scrolls nothing
  // until somebody uses it. Closing it ends that, so a bar that is opened later behaves as one that was asked for.
  const calm = useRef(isOpen);
  const [query, setQuery] = useState(defaultQuery);
  const [ownCase, setOwnCase] = useState(false);
  const [ownWord, setOwnWord] = useState(false);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(-1);
  const [searching, setSearching] = useState(false);
  const [capped, setCapped] = useState(false);
  const [version, setVersion] = useState(0);
  const [said, setSaid] = useState("");
  const bar = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const matches = useRef<FoundMatch[]>([]);
  const at = useRef(-1);
  const token = useRef(0);
  const store = useRef<BlockStore | null>(null);
  const anchor = useRef<Anchor | null>(null);
  const wrapped = useRef<Wrapped | null>(null);
  /** Which matches are wrapped in marks right now: from the first, up to (not including) the last. */
  const painted = useRef<{ from: number; to: number } | null>(null);
  /** Whether this search marks with wrapper marks, which have no ranges and cover a window of the matches. */
  const marking = useRef(false);
  const observer = useRef<MutationObserver | null>(null);
  const returnTo = useRef<HTMLElement | null>(null);
  const matchCase = caseSensitive ?? ownCase;
  const whole = wholeWord ?? ownWord;
  const number = (value: number) => new Intl.NumberFormat(locale).format(value);

  function setOpen(next: boolean) {
    if (open === undefined) setOwnOpen(next);
    onOpenChange?.(next);
  }

  /** Runs a change to the region's own text without the observer taking it for somebody else's. */
  function quietly(change: () => void) {
    change();
    observer.current?.takeRecords();
  }

  function clearPaint() {
    const marks = wrapped.current;
    if (marks) quietly(() => unwrap(marks));
    wrapped.current = null;
    painted.current = null;
    if (canHighlight()) {
      CSS.highlights.delete(names.all);
      CSS.highlights.delete(names.current);
    }
  }

  /** Marks the matches around one of them (about 500) with wrapper marks, and takes the marks off the ones that were marked before. */
  function paintAround(index: number) {
    const list = matches.current;
    const start = Math.max(0, Math.min(index - MAX_MARKED / 2, list.length - MAX_MARKED));
    const end = Math.min(list.length, start + MAX_MARKED);
    quietly(() => {
      if (wrapped.current) unwrap(wrapped.current);
      wrapped.current = wrap(list, start, end);
    });
    painted.current = { from: start, to: end };
  }

  /** Makes a match the current one: marks it more strongly, remembers where it is, and brings it into view. */
  function showCurrent(index: number, scroll: boolean) {
    const match = matches.current[index];
    const head = match?.pieces[0];
    if (!match || !head) return;
    if (marking.current) {
      // Only the matches around the current one wear marks: when it comes near the edge of them, they move along with it.
      const span = painted.current;
      const lead = span && span.from > 0 ? EDGE : 0;
      const trail = span && span.to < matches.current.length ? EDGE : 0;
      if (!span || index < span.from + lead || index >= span.to - trail) paintAround(index);
      const marks = wrapped.current?.marks;
      marks?.get(at.current)?.forEach((mark) => mark.removeAttribute("data-current"));
      marks?.get(index)?.forEach((mark) => mark.setAttribute("data-current", ""));
    } else if (canHighlight() && match.range) {
      const strong = new Highlight(match.range);
      strong.priority = 1;
      CSS.highlights.set(names.current, strong);
    }
    at.current = index;
    anchor.current = { node: head.node, offset: head.from };
    setCurrent(index);
    // The room left around the match is at least the height of the bar and a little more, so it is never under it: on a phone the bar is two rows.
    const target = marking.current ? wrapped.current?.marks.get(index)?.[0] : match.range;
    if (scroll && target) scrollIntoMargin(() => target.getBoundingClientRect(), head.node.parentElement, Math.max(80, (bar.current?.offsetHeight ?? 0) + 28));
  }

  function step(delta: number) {
    const size = matches.current.length;
    if (size) showCurrent((at.current + delta + size) % size, true);
  }

  function close() {
    const back = returnTo.current;
    const inside = bar.current?.contains(document.activeElement);
    setOpen(false);
    returnTo.current = null;
    // Focus goes back to where it was when the bar opened, but only if it was the bar that had it.
    if (inside) window.requestAnimationFrame(() => (back?.isConnected ? back : containerRef.current)?.focus({ preventScroll: true }));
  }

  // The bar leaves a moment after it is told to, so it can fade.
  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    if (!mounted) return;
    const timer = window.setTimeout(() => setMounted(false), 200);
    return () => window.clearTimeout(timer);
  }, [isOpen, mounted]);

  // Once the bar has been closed it is no longer the bar that was there from the start.
  useEffect(() => {
    if (!isOpen) calm.current = false;
  }, [isOpen]);

  // The field takes focus and what is in it is selected, so typing replaces it; where focus was is kept for the way out. A bar that was
  // there from the start does none of it: it leaves focus where it is until somebody goes to the field.
  useEffect(() => {
    if (!isOpen || !mounted || calm.current) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && active !== document.body && !bar.current?.contains(active)) returnTo.current = active;
    field.current?.focus({ preventScroll: true });
    field.current?.select();
  }, [isOpen, mounted]);

  // The shortcut belongs to the region: it works while focus is inside it, and the browser's find works everywhere else.
  useEffect(() => {
    const root = containerRef.current;
    if (!shortcut || !root) return;
    const listener = (event: globalThis.KeyboardEvent) => {
      if (!isFindKey(event)) return;
      event.preventDefault();
      if (isOpen) {
        field.current?.focus({ preventScroll: true });
        field.current?.select();
      } else setOpen(true);
    };
    root.addEventListener("keydown", listener);
    // A click on text puts focus on the nearest focusable element; this makes the region itself one, so there is somewhere for the key to land.
    const made = !root.hasAttribute("tabindex");
    if (made) root.tabIndex = -1;
    return () => {
      root.removeEventListener("keydown", listener);
      if (made) root.removeAttribute("tabindex");
    };
  }, [shortcut, isOpen, containerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // The rules that paint the highlights, for as long as the bar is open.
  useEffect(() => {
    if (!isOpen || highlight === "marks" || !canHighlight()) return;
    return addHighlightStyles(names.all, names.current);
  }, [isOpen, highlight, names.all, names.current]); // eslint-disable-line react-hooks/exhaustive-deps

  // If the text of the region changes under the search (a log that grows, a page that renders more), the search is done again.
  useEffect(() => {
    const root = containerRef.current;
    if (!isOpen || !root || typeof MutationObserver === "undefined") return;
    let timer = 0;
    const watching = new MutationObserver(() => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        store.current = null;
        setVersion((value) => value + 1);
      }, 250);
    });
    watching.observe(root, { childList: true, subtree: true, characterData: true });
    observer.current = watching;
    return () => {
      window.clearTimeout(timer);
      watching.disconnect();
      observer.current = null;
    };
  }, [isOpen, containerRef]);

  // The search itself: on every change of what is asked, in slices, marking as it goes.
  useEffect(() => {
    const root = containerRef.current;
    const mine = (token.current += 1);
    const stale = () => token.current !== mine;
    clearPaint();
    matches.current = [];
    at.current = -1;
    const pattern = isOpen && mounted && root ? buildPattern(query, { caseSensitive: matchCase, wholeWord: whole }) : null;
    // A bar that is closed holds on to none of the page's text nodes.
    if (!isOpen) store.current = null;
    if (!pattern || !root) {
      setTotal(0);
      setCurrent(-1);
      setCapped(false);
      setSearching(false);
      return;
    }
    const marksMode = highlight === "marks" || !canHighlight();
    marking.current = marksMode;
    setSearching(true);
    setCapped(false);
    store.current ??= new BlockStore(root);
    const source = store.current;
    void (async () => {
      const found: FoundMatch[] = [];
      const painting = marksMode ? null : new Highlight();
      if (painting) CSS.highlights.set(names.all, painting);
      let chosen = -1;
      // The page moves only for a search somebody asked for (typing, a key, a button): the one a bar starts with does not scroll anything.
      const scrolls = () => !calm.current;
      // Matches are found without ranges when they are going to be marks: a live range costs every split and move of a node an update.
      for await (const batch of findAll(source, pattern, stale, { ranges: !marksMode })) {
        if (stale()) return;
        for (const match of batch.matches) {
          found.push(match);
          if (painting && match.range) painting.add(match.range);
        }
        matches.current = found;
        setTotal(found.length);
        // The match to land on is the first at or after where the last one was, so a growing query does not jump back to the top.
        if (!marksMode && chosen < 0) {
          const place = anchor.current ? findFrom(found, anchor.current) : found.length ? 0 : -1;
          if (place >= 0) {
            chosen = place;
            showCurrent(place, scrolls());
          }
        }
        if (!batch.done) continue;
        // Highlighted matches are painted as they come and already have a current one by now, unless none came after the anchor; wrapper marks go
        // on once, here, around the match that is current.
        if (found.length && (marksMode || chosen < 0)) {
          chosen = marksMode && anchor.current ? Math.max(0, findFrom(found, anchor.current)) : 0;
          showCurrent(chosen, scrolls());
        }
        setCapped(batch.capped);
        setSearching(false);
      }
    })();
    return () => {
      token.current += 1;
    };
  }, [isOpen, mounted, query, matchCase, whole, highlight, version, containerRef]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nothing is left behind when the bar goes: no marks in the text, no highlight in the registry.
  useEffect(
    () => () => {
      token.current += 1;
      clearPaint();
    },
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const asked = query.trim() !== "";
  const count = !asked || (searching && total === 0) ? "" : total === 0 ? words.noResults : fill(words.count, { current: current >= 0 ? number(current + 1) : "…", total: `${number(total)}${searching || capped ? "+" : ""}` });
  const status = !asked || searching ? "" : total === 0 ? words.noResults : fill(words.count, { current: number(Math.max(current, 0) + 1), total: number(total) });

  // The live region is told once the numbers have stopped moving, and not on every key.
  useEffect(() => {
    const timer = window.setTimeout(() => setSaid(status), 350);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (searching) return;
    onMatchesChange?.({ query, total, current: total === 0 ? 0 : current + 1 });
  }, [searching, total, current, query]); // eslint-disable-line react-hooks/exhaustive-deps

  function keys(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (isFindKey(event)) {
      event.preventDefault();
      field.current?.focus();
      field.current?.select();
    }
  }

  if (!mounted) return null;

  const idle = total === 0;
  return (
    <div
      ref={bar}
      role="search"
      aria-label={words.label}
      data-slot="find-in-page-bar"
      data-state={isOpen ? "open" : "closed"}
      onKeyDown={keys}
      className={cn("@container absolute top-3 right-3 z-30 w-[min(28rem,calc(100%-1.5rem))]", className)}
      {...props}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-sm @md:flex-nowrap",
          "transition-[opacity,transform] duration-150 ease-out starting:-translate-y-1.5 starting:opacity-0 motion-reduce:transition-none",
          !isOpen && "pointer-events-none -translate-y-1.5 opacity-0",
        )}
      >
        <div className="relative order-1 min-w-0 flex-1 basis-[calc(100%-2.25rem)] @md:basis-auto">
          <IconSearch aria-hidden="true" size={16} className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={field}
            type="text"
            value={query}
            placeholder={words.find}
            aria-label={words.find}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            enterKeyHint="search"
            onChange={(event) => {
              calm.current = false;
              setQuery(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              step(event.shiftKey ? -1 : 1);
            }}
            className="h-8 w-full min-w-0 rounded-md border border-input bg-background pr-[5.5rem] pl-8 text-sm shadow-xs outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
          />
          <span aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-xs whitespace-nowrap tabular-nums", asked && !searching && total === 0 ? "font-medium text-foreground" : "text-muted-foreground")}>
            {count}
          </span>
        </div>

        {/* aria-disabled and not disabled: a button that disables itself under the finger would drop keyboard focus to the page. */}
        <Button type="button" variant="ghost" size="icon-sm" aria-label={words.previous} aria-disabled={idle || undefined} onClick={() => step(-1)} className="order-3 aria-disabled:pointer-events-none aria-disabled:opacity-40">
          <IconChevronUp />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={words.next} aria-disabled={idle || undefined} onClick={() => step(1)} className="order-3 aria-disabled:pointer-events-none aria-disabled:opacity-40">
          <IconChevronDown />
        </Button>
        <span aria-hidden="true" className="order-3 mx-0.5 h-5 w-px bg-border" />
        <Toggle
          size="sm"
          aria-label={words.matchCase}
          pressed={matchCase}
          onPressedChange={(next) => {
            calm.current = false;
            if (caseSensitive === undefined) setOwnCase(next);
            onOptionsChange?.({ caseSensitive: next, wholeWord: whole });
          }}
          className="order-3 px-0 text-[0.8125rem] font-semibold"
        >
          {/* The glyph is drawn by the style, not written in the markup, so the button's name (Match case) is the only text it has and a voice control says that. */}
          <span aria-hidden="true" className="before:content-['Aa']" />
        </Toggle>
        <Toggle
          size="sm"
          aria-label={words.wholeWord}
          pressed={whole}
          onPressedChange={(next) => {
            calm.current = false;
            if (wholeWord === undefined) setOwnWord(next);
            onOptionsChange?.({ caseSensitive: matchCase, wholeWord: next });
          }}
          className="order-3 px-0"
        >
          <span aria-hidden="true" className="rounded-[3px] border border-current px-1 text-[0.6875rem] leading-4 font-semibold before:content-['ab']" />
        </Toggle>
        <Button type="button" variant="ghost" size="icon-sm" aria-label={words.close} onClick={close} className="order-2 @md:order-4">
          <IconClose />
        </Button>
        <span role="status" aria-live="polite" className="sr-only">
          {said}
        </span>
      </div>
    </div>
  );
}
