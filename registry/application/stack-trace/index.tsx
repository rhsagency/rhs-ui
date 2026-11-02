"use client";

import { Fragment, useEffect, useId, useMemo, useRef, useState, type ComponentProps } from "react";

import { IconCheck, IconChevronRight, IconCopy } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

import { locationOf, packagesOf, parseStack, rowsOf, traceText, type StackFrame } from "./parse";

export type { StackFrame } from "./parse";

/** The words the trace uses, for translation. `{count}`, `{location}` and `{packages}` are filled in. */
export interface StackTraceLabels {
  /** The heading above the frames. Default "Stack trace". */
  heading?: string;
  /** The count beside the heading, for one frame. Default "{count} frame". */
  frameOne?: string;
  /** For several. Default "{count} frames". */
  frames?: string;
  /** The button that copies the whole trace. Default "Copy trace". */
  copyTrace?: string;
  /** The same button for a moment after the copy. Default "Copied". */
  copiedButton?: string;
  /** The label on your first frame. Default "Start here". */
  start?: string;
  /** What a screen reader hears after it, behind a comma. Default "the first frame in your code". */
  startNote?: string;
  /** The name of the button around a file location. Default "Copy {location}". */
  copyLocation?: string;
  /** Opens a fold of one library frame. Default "Show {count} library frame". */
  showOne?: string;
  /** Opens a fold of several. Default "Show {count} library frames". */
  showMany?: string;
  /** Closes a fold of one. Default "Hide {count} library frame". */
  hideOne?: string;
  /** Closes a fold of several. Default "Hide {count} library frames". */
  hideMany?: string;
  /** Said for a frame without a function name. Default "anonymous". */
  anonymous?: string;
  /** Said when there are no frames to show. Default "No stack frames were found." */
  empty?: string;
  /** What a screen reader hears after the whole trace was copied. Default "Stack trace copied". */
  copiedTrace?: string;
  /** What it hears after a location was copied. Default "Copied {location}". */
  copiedLocation?: string;
  /** What the trace says when the clipboard refuses. Default "Could not copy. Select the text and copy it by hand." */
  failed?: string;
}

export interface StackTraceProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** The error: its `name` and `message` head the card, and its `stack` is parsed into frames unless you pass `frames`. An Error object works as it is. */
  error?: { name?: string; message?: string; stack?: string };
  /** The frames, when you have parsed them yourself or want to mark library frames with `library`. Takes the place of `error.stack`. */
  frames?: readonly StackFrame[];
  /** The folder your project lives in, such as "/Users/mara/northwind-shop": a frame outside it is library code, and paths inside it are shown relative to it. */
  projectRoot?: string;
  /** Shows the library frames instead of folding them. Default false. */
  defaultExpanded?: boolean;
  /** Called after the whole trace or one location was copied, with the text. */
  onCopied?: (text: string) => void;
  /** Heading level of "Stack trace". Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The words the trace uses, for translation. */
  labels?: StackTraceLabels;
}

const DEFAULT_LABELS = {
  heading: "Stack trace",
  frameOne: "{count} frame",
  frames: "{count} frames",
  copyTrace: "Copy trace",
  copiedButton: "Copied",
  start: "Start here",
  startNote: "the first frame in your code",
  copyLocation: "Copy {location}",
  showOne: "Show {count} library frame",
  showMany: "Show {count} library frames",
  hideOne: "Hide {count} library frame",
  hideMany: "Hide {count} library frames",
  anonymous: "anonymous",
  empty: "No stack frames were found.",
  copiedTrace: "Stack trace copied",
  copiedLocation: "Copied {location}",
  failed: "Could not copy. Select the text and copy it by hand.",
} satisfies Required<StackTraceLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/** How long a check stays on a button after a copy. */
const COPIED_MS = 1800;

/** The failure text, darkened toward the foreground so the small red line reaches 4.5:1 on the card. */
const DANGER_TEXT = "text-[color:color-mix(in_oklch,var(--destructive),var(--foreground)_30%)]";

/** A path with a place to break after every slash, so a narrow line wraps between folders and not in the middle of a file name. */
function breakable(location: string) {
  return location.split("/").map((part, index, all) => (
    <Fragment key={index}>
      {part}
      {index < all.length - 1 ? (
        <>
          /<wbr />
        </>
      ) : null}
    </Fragment>
  ));
}

interface FrameLineProps {
  frame: StackFrame;
  projectRoot?: string;
  /** Your first frame: the row is set apart and says why. */
  start?: boolean;
  /** A library frame: quieter than your own. */
  quiet?: boolean;
  copied: boolean;
  onCopy: (location: string) => void;
  text: Required<StackTraceLabels>;
}

/** One frame: the function, and under it the file location, which is a button that copies it. */
function FrameLine({ frame, projectRoot, start = false, quiet = false, copied, onCopy, text }: FrameLineProps) {
  const location = locationOf(frame, projectRoot);
  return (
    <li className={cn("relative grid gap-0.5 rounded-lg px-3 py-2", start && "bg-muted/70 before:absolute before:top-2 before:bottom-2 before:left-0 before:w-[3px] before:rounded-full before:bg-foreground")}>
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        <span className={cn("min-w-0 font-mono text-[0.8125rem] leading-5 [overflow-wrap:anywhere]", quiet ? "text-muted-foreground" : "font-semibold text-foreground", !frame.fn && "font-normal text-muted-foreground italic")}>
          {frame.fn ?? `<${text.anonymous}>`}
        </span>
        {start ? (
          <Badge variant="default" className="shrink-0">
            {text.start}
            <span className="sr-only">, {text.startNote}</span>
          </Badge>
        ) : null}
      </div>
      <button
        type="button"
        aria-label={fill(text.copyLocation, { location })}
        onClick={() => onCopy(location)}
        className={cn(
          "group/location -mx-1 flex min-w-0 items-start gap-1.5 rounded-md px-1 py-0.5 text-left font-mono text-xs leading-5 outline-none",
          "text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none",
        )}
      >
        <span className="min-w-0 [overflow-wrap:anywhere]">{breakable(location)}</span>
        {/* The glyph says a location can be copied. A fingertip has no hover to show it, so there it is always there, softly. */}
        <span
          aria-hidden="true"
          className={cn("mt-0.5 shrink-0", copied ? "text-foreground" : "opacity-0 transition-opacity group-hover/location:opacity-100 group-focus-visible/location:opacity-100 motion-reduce:transition-none [@media(hover:none)]:opacity-60")}
        >
          {copied ? <IconCheck className="size-3.5" /> : <IconCopy className="size-3.5" />}
        </span>
      </button>
    </li>
  );
}

/** A run of library frames, folded: one line that opens them. */
function LibraryRun({ frames, projectRoot, defaultOpen, copiedLocation, onCopy, text }: { frames: StackFrame[]; projectRoot?: string; defaultOpen: boolean; copiedLocation: string | null; onCopy: (location: string) => void; text: Required<StackTraceLabels> }) {
  const [open, setOpen] = useState(defaultOpen);
  const count = frames.length;
  const label = fill(open ? (count === 1 ? text.hideOne : text.hideMany) : count === 1 ? text.showOne : text.showMany, { count: String(count) });
  const packages = packagesOf(frames, projectRoot);
  return (
    <li>
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group/run flex w-full min-w-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-xs leading-5 text-muted-foreground outline-none transition-colors duration-150 hover:bg-muted/70 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
          >
            <IconChevronRight aria-hidden="true" className="size-3.5 shrink-0 transition-transform duration-150 group-data-[state=open]/run:rotate-90 motion-reduce:transition-none" />
            <span className="shrink-0 font-medium">{label}</span>
            {packages.length ? <span className="min-w-0 truncate font-mono text-[0.6875rem] text-muted-foreground/80">{packages.slice(0, 4).join(", ")}</span> : null}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol role="list" className="ml-3 grid border-l border-border py-1 pl-1">
            {frames.map((frame, index) => (
              <FrameLine key={index} frame={frame} projectRoot={projectRoot} quiet copied={copiedLocation === locationOf(frame, projectRoot)} onCopy={onCopy} text={text} />
            ))}
          </ol>
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/**
 * An error's stack trace made readable. The error's name and message head the
 * card; under them the frames are an ordered list under a heading, your own
 * frames in full weight with the function and the file location, and the first
 * of them set apart as the place to start. The long runs of node_modules, Node
 * and framework frames fold away under "Show 8 library frames", with the
 * packages they come from. Every file location is a button that copies it as
 * "src/cart.tsx:42:13", and one button copies the whole trace as the plain
 * text an engine writes, ready for an issue. Pass the error and it reads the
 * stack (V8, Firefox and Safari formats), or pass frames you parsed yourself.
 */
export function StackTrace({ error, frames: given, projectRoot, defaultExpanded = false, onCopied, headingLevel = 3, labels, className, ...props }: StackTraceProps) {
  const text: Required<StackTraceLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const frames = useMemo(() => given ?? (error?.stack ? parseStack(error.stack) : []), [given, error?.stack]);
  const rows = useMemo(() => rowsOf(frames, projectRoot), [frames, projectRoot]);
  const first = rows.find((row) => row.kind === "app")?.index;
  const whole = given ? traceText(error ?? {}, frames, projectRoot) : (error?.stack ?? traceText(error ?? {}, frames, projectRoot));

  const [copied, setCopied] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [said, setSaid] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  /** `key` is what the button shows as copied: "trace" for the whole trace, the location for a frame. */
  async function copy(key: string, value: string, announcement: string) {
    if (timer.current) clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setFailed(false);
      setCopied(key);
      setSaid(announcement);
      onCopied?.(value);
      timer.current = setTimeout(() => setCopied(null), COPIED_MS);
    } catch {
      setCopied(null);
      setFailed(true);
      setSaid(text.failed);
    }
  }

  const count = String(frames.length);

  return (
    <section data-slot="stack-trace" className={cn("w-full overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs", className)} {...props}>
      {error?.name || error?.message ? (
        <div className="grid min-w-0 justify-items-start gap-2 border-b border-border px-4 py-3.5">
          {error.name ? (
            <Badge variant="destructive" className={cn("max-w-full font-mono", DANGER_TEXT)}>
              {error.name}
            </Badge>
          ) : null}
          {error.message ? <p className="text-sm leading-5 font-medium [overflow-wrap:anywhere]">{error.message}</p> : null}
        </div>
      ) : null}

      <div className="px-2 py-2">
        <div className="flex items-center justify-between gap-3 pt-0.5 pr-1 pl-3">
          <Heading id={`${id}-heading`} className="flex min-w-0 items-baseline gap-2 text-xs leading-5 font-medium tracking-[0.02em] text-muted-foreground">
            <span className="uppercase">{text.heading}</span>
            <span className="font-normal tabular-nums">{fill(frames.length === 1 ? text.frameOne : text.frames, { count })}</span>
          </Heading>
          {frames.length ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => void copy("trace", whole, text.copiedTrace)} className="shrink-0 text-muted-foreground hover:text-foreground">
              {copied === "trace" ? <IconCheck /> : <IconCopy />}
              {copied === "trace" ? text.copiedButton : text.copyTrace}
            </Button>
          ) : null}
        </div>
        {/* A clipboard that refuses (a page on http, a denied permission) is said to everyone, not only to a screen reader: otherwise nothing seems to happen. */}
        {failed ? <p className={cn("px-3 pt-1 pb-1 text-xs leading-5", DANGER_TEXT)}>{text.failed}</p> : null}
        {rows.length ? (
          <ol role="list" aria-labelledby={`${id}-heading`} className="grid">
            {rows.map((row) =>
              row.kind === "app" ? (
                <FrameLine key={row.index} frame={row.frame} projectRoot={projectRoot} start={row.index === first} copied={copied === locationOf(row.frame, projectRoot)} onCopy={(location) => void copy(location, location, fill(text.copiedLocation, { location }))} text={text} />
              ) : (
                <LibraryRun key={row.index} frames={row.frames} projectRoot={projectRoot} defaultOpen={defaultExpanded} copiedLocation={copied} onCopy={(location) => void copy(location, location, fill(text.copiedLocation, { location }))} text={text} />
              ),
            )}
          </ol>
        ) : (
          <p className="px-3 py-3 text-sm text-muted-foreground">{text.empty}</p>
        )}
      </div>

      <p role="status" className="sr-only">
        {said}
      </p>
    </section>
  );
}
