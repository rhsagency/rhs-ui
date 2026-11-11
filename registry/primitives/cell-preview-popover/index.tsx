"use client";

import { useCallback, useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { IconExternal, IconMaximize } from "@rhs-ui/icons";
import { cellText, fullText, inferKind, safeHref, tokenizeJson, type CellKind, type JsonTone } from "@rhs-ui/primitives/cell-preview-popover/format";
import { CopyButton } from "@rhs-ui/primitives/copy-button";
import { Popover, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export type { CellKind } from "@rhs-ui/primitives/cell-preview-popover/format";

/** The words the cell and its popover say on their own, for another language or your own wording. */
export interface CellPreviewLabels {
  /** What a screen reader hears after a cell whose value is cut off. Default "Show the full value". */
  show: string;
  /** The heading of the popover when you gave no `title`. Default "Full value". */
  region: string;
  /** The copy button. Default "Copy". */
  copy: string;
  /** The copy button after the value is on the clipboard. Default "Copied". */
  copied: string;
  /** Said to screen readers after a link that opens a new tab. Default "(opens in a new tab)". */
  newTab: string;
  /** What shows in the popover for a value with nothing in it. Default "Empty". */
  empty: string;
}

export interface CellPreviewPopoverProps extends Omit<ComponentProps<"button">, "value" | "children" | "title" | "onCopy" | "type"> {
  /** The value: a string, or anything JSON can hold. A string is shown as it is; an object or an array as JSON. */
  value: unknown;
  /** How to read the value: `text`, `json` (pretty-printed in the popover) or `url` (a link that opens a new tab). Default `json` for anything that is not a string, otherwise `text`. */
  kind?: CellKind;
  /** How many lines the cell shows before it ends in an ellipsis. Default 2. */
  maxLines?: number;
  /** The name of the column or field. It is the heading of the popover and part of its name. */
  title?: string;
  /** The value was copied, with the exact text that went to the clipboard. */
  onCopy?: (text: string) => void;
  /** What the cell shows in place of the value, such as a badge or formatted text. The popover still shows the value. */
  children?: ReactNode;
  /** The words the cell and popover say, for translation. */
  labels?: Partial<CellPreviewLabels>;
}

const DEFAULT_LABELS = {
  show: "Show the full value",
  region: "Full value",
  copy: "Copy",
  copied: "Copied",
  newTab: "(opens in a new tab)",
  empty: "Empty",
} satisfies CellPreviewLabels;

/** A weight for each part of a JSON text, in the greys of the page: keys recede, values speak. */
const TONE: Record<JsonTone, string> = {
  key: "text-muted-foreground",
  string: "text-foreground",
  literal: "font-medium text-foreground",
  plain: "text-muted-foreground",
};

/** More than a pixel of overflow: text that exactly fits can report one pixel too many. */
const SLACK = 1;

/**
 * A cell for values that are longer than the column: it shows the first lines with an ellipsis and, only when there is
 * more to see, a small expand mark, and it opens the whole value in a popover with Copy. The popover holds the value in a
 * scrollable monospaced block that a keyboard can scroll, JSON pretty-printed with its keys in a quieter grey, a URL as a
 * link that says it opens a new tab (and only an http or https address is ever a link). The cell is a button with
 * `aria-expanded`, Escape closes the popover and returns focus, and selecting text inside it does not close it. Use it in a
 * table with a fixed layout, or any box with a width.
 */
export function CellPreviewPopover({ value, kind, maxLines = 2, title, onCopy, children, labels, className, ref: forwardedRef, ...props }: CellPreviewPopoverProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const reading = kind ?? inferKind(value);
  const lines = Math.max(1, Math.floor(maxLines));
  const headingId = useId();
  const hintId = useId();
  const shown = cellText(value, reading);
  const full = fullText(value, reading);
  const href = reading === "url" ? safeHref(full) : null;
  const text = useRef<HTMLSpanElement>(null);
  const [cut, setCut] = useState(false);

  const measure = useCallback(() => {
    const element = text.current;
    if (element) setCut(element.scrollHeight - element.clientHeight > SLACK);
  }, []);

  useEffect(() => {
    const element = text.current;
    if (!element) return;
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    // A web font arriving changes how the text wraps without changing the box.
    const fonts = document.fonts;
    let alive = true;
    void fonts?.ready.then(() => {
      if (alive) measure();
    });
    fonts?.addEventListener("loadingdone", measure);
    return () => {
      alive = false;
      observer.disconnect();
      fonts?.removeEventListener("loadingdone", measure);
    };
  }, [measure, shown, lines]);

  const clamp: CSSProperties = { display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lines };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          ref={forwardedRef}
          type="button"
          data-slot="cell-preview-popover"
          data-truncated={cut || undefined}
          aria-describedby={cut ? hintId : undefined}
          className={cn(
            "group/cell relative -mx-1.5 block w-[calc(100%+0.75rem)] min-w-0 rounded-md px-1.5 py-1 text-left outline-none",
            "transition-colors duration-150 motion-reduce:transition-none",
            "hover:bg-muted data-[state=open]:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40",
            className,
          )}
          {...props}
        >
          <span ref={text} style={clamp} className={cn("min-w-0 overflow-hidden [overflow-wrap:anywhere]", reading === "json" && "font-mono text-[0.8125rem]")}>
            {children ?? (shown || <span className="text-muted-foreground">{words.empty}</span>)}
          </span>
          {cut ? (
            <>
              {/* Seen on hover, on focus, while open, and always on a screen without hover: where there is more, the cell says so. */}
              <span
                aria-hidden="true"
                className="absolute right-1 bottom-1 hidden size-5 place-items-center rounded-md bg-background text-muted-foreground shadow-xs ring-1 ring-border group-hover/cell:grid group-focus-visible/cell:grid group-data-[state=open]/cell:grid pointer-coarse:grid"
              >
                <IconMaximize size={12} />
              </span>
              <span id={hintId} className="sr-only">
                {words.show}
              </span>
            </>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        collisionPadding={12}
        aria-labelledby={headingId}
        // Never taller than the room the screen leaves: the heading and Copy keep their place and the value scrolls in what is left.
        className="flex max-h-(--radix-popover-content-available-height) w-[min(30rem,var(--radix-popover-content-available-width))] max-w-none flex-col p-0"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border py-1.5 pr-1.5 pl-3.5">
          <h3 id={headingId} className="min-w-0 truncate text-xs font-medium text-muted-foreground">
            {title ?? words.region}
          </h3>
          <CopyButton size="sm" variant="ghost" value={full} label={words.copy} copiedLabel={words.copied} onCopy={onCopy} />
        </div>
        {/* A region that scrolls is a tab stop with a name, so the keyboard can scroll it; `relative` keeps it a containing block. */}
        <div
          tabIndex={0}
          role="region"
          aria-label={title ?? words.region}
          className="relative min-h-0 max-h-72 flex-1 overflow-auto rounded-b-lg p-3.5 font-mono text-[0.8125rem] leading-relaxed whitespace-pre-wrap text-foreground outline-none [overflow-wrap:anywhere] focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-ring/40"
        >
          {full === "" ? (
            <span className="font-sans text-muted-foreground">{words.empty}</span>
          ) : href ? (
            <a href={href} target="_blank" rel="noopener noreferrer" className="inline text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground">
              {full}
              <IconExternal aria-hidden="true" className="mb-0.5 ml-1.5 inline size-3.5 text-muted-foreground" />
              <span className="sr-only"> {words.newTab}</span>
            </a>
          ) : reading === "json" ? (
            tokenizeJson(full).map((token, index) => (
              <span key={index} className={TONE[token.tone]}>
                {token.text}
              </span>
            ))
          ) : (
            full
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
