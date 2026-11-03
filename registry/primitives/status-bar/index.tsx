"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@rhs-ui/primitives/tooltip";
import { cn } from "@/lib/utils";
import { fitSegments, type MeasuredSegment } from "./fit";

export interface StatusBarSegment {
  /** A stable key, also what the fitting remembers a segment by. */
  id: string;
  /** What the segment says: `main`, `Ln 12, Col 8`, `UTF-8`. It is also its accessible name, unless you give an `ariaLabel`. */
  label: string;
  /** A small icon before the label, as an element: `<IconGitBranch />`. It is decorative. */
  icon?: ReactNode;
  /** Hide the label and show the icon alone. The label stays the accessible name, and the tooltip is worth setting. */
  iconOnly?: boolean;
  /** Makes the segment a button: it runs when the segment is pressed. Without it the segment is plain text. */
  onSelect?: () => void;
  /** What the button does, in a tooltip on hover and focus (`Switch branch`). A plain segment shows it as its title. */
  tooltip?: string;
  /** A fuller accessible name for a button than its label: `Problems: 2 errors, 3 warnings` for `2 · 3`. */
  ariaLabel?: string;
  /** A status that changes by itself (`Synced`, `Offline`): a change of its label is announced politely to a screen reader. */
  live?: boolean;
  /** What a screen reader says when a live segment changes, when the label alone is too terse. */
  announcement?: string;
  /** How long the segment stays when the bar runs out of room: higher stays longer. Without it the order of the list decides, first longest. */
  priority?: number;
  /** A button that cannot be pressed for now. */
  disabled?: boolean;
}

export interface StatusBarProps extends Omit<ComponentProps<"div">, "children"> {
  /** The segments on the start side, most important first: the branch, the sync status, the problems. */
  start?: readonly StatusBarSegment[];
  /** The segments on the end side, most important first: the cursor, the encoding, the language. */
  end?: readonly StatusBarSegment[];
  /** A hairline between neighbouring segments. Default `false`. */
  separators?: boolean;
  /** The element to render. `div` is a labelled region; `footer` is a footer landmark with the same name. Default `div`. */
  as?: "div" | "footer";
  /** The name of the region, for assistive technology. Default `Status bar`. */
  label?: string;
}

/** The layout effect that does not warn on the server, where there is no layout. */
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Tabular figures, so a cursor position that counts up does not make the segments next to it move.
const SEGMENT = "flex h-full shrink-0 items-center gap-1.5 px-2.5 whitespace-nowrap tabular-nums";

function SegmentView({ segment, hidden, divider }: { segment: StatusBarSegment; hidden: boolean; divider: boolean }) {
  const content = (
    <>
      {segment.icon ? (
        <span aria-hidden="true" className="inline-flex shrink-0 [&_svg]:size-3.5">
          {segment.icon}
        </span>
      ) : null}
      <span className={cn(segment.iconOnly && "sr-only")}>{segment.label}</span>
    </>
  );
  // A segment that does not fit stays in the document, out of the way and out of reach, so its width is still known when there is room again.
  const classes = cn(SEGMENT, divider && "border-s border-border", hidden && "pointer-events-none invisible absolute start-0 top-0");
  const common = { "data-slot": "status-bar-segment", "data-segment": segment.id, "data-hidden": hidden || undefined, "aria-hidden": hidden || undefined, inert: hidden || undefined } as const;
  if (!segment.onSelect) {
    return (
      <span {...common} title={segment.tooltip} className={classes}>
        {content}
      </span>
    );
  }
  const button = (
    <button
      type="button"
      {...common}
      aria-label={segment.ariaLabel}
      disabled={segment.disabled}
      onClick={segment.onSelect}
      className={cn(classes, "outline-none transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:bg-muted focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-inset active:bg-muted/70 disabled:pointer-events-none disabled:opacity-50 motion-reduce:transition-none")}
    >
      {content}
    </button>
  );
  if (!segment.tooltip || hidden) return button;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        {segment.tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function Group({ segments, hidden, separators, register }: { segments: readonly StatusBarSegment[]; hidden: ReadonlySet<string>; separators: boolean; register: (id: string, node: HTMLElement | null) => void }) {
  const firstShown = segments.find((segment) => !hidden.has(segment.id))?.id;
  return (
    <div data-slot="status-bar-group" className="relative flex h-full min-w-0 items-stretch">
      {segments.map((segment) => (
        <span key={segment.id} ref={(node) => register(segment.id, node)} className="contents">
          <SegmentView segment={segment} hidden={hidden.has(segment.id)} divider={separators && segment.id !== firstShown} />
        </span>
      ))}
    </div>
  );
}

/**
 * The thin strip at the foot of an editor or a tool, in the manner of a code
 * editor's: facts on both sides, such as the branch, the sync status, the
 * problems, the cursor, the encoding and the language. A segment that acts
 * (`onSelect`) is a button with a visible focus ring and an optional tooltip;
 * one that only informs is plain text. The bar is a labelled region, so a
 * screen reader reads it in one pass, and a change in a `live` segment is
 * announced politely. When the bar runs out of room the least important
 * segments drop out whole (by `priority`, then by position), never cut in half,
 * and come back when there is room. It is 28px high and uses only the border
 * and muted tokens, so it stays calm next to whatever it sits under.
 */
export function StatusBar({ start = [], end = [], separators = false, as = "div", label = "Status bar", className, ref, ...props }: StatusBarProps) {
  const Tag = as as "div";
  const bar = useRef<HTMLDivElement | null>(null);
  // The bar needs its own ref to measure itself, and the caller may want theirs too.
  const attach = (node: HTMLDivElement | null) => {
    bar.current = node;
    if (typeof ref === "function") ref(node);
    else if (ref) ref.current = node;
  };
  const nodes = useRef(new Map<string, HTMLElement>());
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());

  const register = (id: string, node: HTMLElement | null) => {
    if (node) nodes.current.set(id, node);
    else nodes.current.delete(id);
  };

  // What is measured is the natural width of every segment, showing or not, so the fitting is a pure function of widths and never flickers.
  const measure = () => {
    const element = bar.current;
    if (!element) return;
    const measured: MeasuredSegment[] = [];
    const add = (segments: readonly StatusBarSegment[], group: "start" | "end") =>
      segments.forEach((segment, index) => {
        const holder = nodes.current.get(segment.id);
        const node = holder?.firstElementChild as HTMLElement | null | undefined;
        measured.push({ id: segment.id, group, index, priority: segment.priority ?? 0, width: node ? node.offsetWidth : 0 });
      });
    add(start, "start");
    add(end, "end");
    const kept = fitSegments(measured, element.clientWidth);
    const next = new Set(measured.filter((segment) => !kept.has(segment.id)).map((segment) => segment.id));
    setHidden((previous) => (previous.size === next.size && [...next].every((id) => previous.has(id)) ? previous : next));
  };
  const latest = useRef(measure);

  // After every render, so a label that got longer is measured, and whenever the bar itself changes size or the fonts arrive.
  useBrowserLayoutEffect(() => {
    latest.current = measure;
    measure();
  });
  useEffect(() => {
    const element = bar.current;
    if (!element) return;
    const observer = new ResizeObserver(() => latest.current());
    observer.observe(element);
    void document.fonts?.ready.then(() => latest.current());
    return () => observer.disconnect();
  }, []);

  // A live segment that changed since the last render is what gets announced.
  const previous = useRef(new Map<string, string>());
  const [announced, setAnnounced] = useState("");
  useEffect(() => {
    const next = new Map<string, string>();
    let message = "";
    for (const segment of [...start, ...end]) {
      if (!segment.live) continue;
      next.set(segment.id, segment.label);
      const before = previous.current.get(segment.id);
      if (before !== undefined && before !== segment.label) message = segment.announcement ?? segment.label;
    }
    previous.current = next;
    if (message) setAnnounced(message);
  });

  return (
    <TooltipProvider delayDuration={400}>
      <Tag
        ref={attach}
        data-slot="status-bar"
        role={as === "div" ? "region" : undefined}
        aria-label={label}
        className={cn("relative flex h-7 w-full items-stretch justify-between overflow-hidden border-t border-border bg-muted/40 text-xs leading-none text-muted-foreground select-none", className)}
        {...props}
      >
        <Group segments={start} hidden={hidden} separators={separators} register={register} />
        <Group segments={end} hidden={hidden} separators={separators} register={register} />
        <span role="status" aria-live="polite" className="sr-only">
          {announced}
        </span>
      </Tag>
    </TooltipProvider>
  );
}
