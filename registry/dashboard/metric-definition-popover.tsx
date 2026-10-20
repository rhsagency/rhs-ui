"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from "react";

import { IconArrowUpRight, IconCheck, IconClose, IconCopy, IconInfo, IconWarning } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { DescriptionList, type DescriptionItem } from "@rhs-ui/primitives/description-list";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@rhs-ui/primitives/popover";
import { cn } from "@/lib/utils";

export interface MetricOwner {
  /** Who or which team owns the metric. It is the text of the owner line, and of the link when there is an `href`. */
  name: string;
  /** Where to reach them: a profile, a team page, a mailto link. */
  href?: string;
}

export interface MetricDefinitionPopoverProps {
  /** The metric's name, "Net revenue retention". It names the button and heads the panel. */
  name: string;
  /** What the number means, in a sentence or two. */
  definition: ReactNode;
  /** How it is worked out, as plain text. Shown monospaced and selectable, with a copy button. */
  formula?: string;
  /** Where the data comes from: "Billing warehouse, finance.mrr_snapshots". */
  source?: ReactNode;
  /** When the source last refreshed. Shown as "2 hours ago" and as a date and time. */
  refreshedAt?: Date | string | number;
  /** After how many hours the source counts as stale, and is flagged in words. */
  staleAfterHours?: number;
  /** Who to ask about it. */
  owner?: MetricOwner;
  /** A caveat, under the list: "Excludes one-off services." */
  notes?: ReactNode;
  /** BCP 47 locale for the dates. */
  locale?: string;
  /** IANA zone the refresh time is shown in. */
  timeZone?: string;
  /** The moment "2 hours ago" is measured from. Without it, the moment the panel is opened: for tests and demos. */
  now?: Date | string | number;
  /** Open on first render, for a panel that is already in view. Focus then stays where it was. */
  defaultOpen?: boolean;
  /** Whether the panel is open, for controlled use. Pair it with `onOpenChange`. */
  open?: boolean;
  /** Called when the panel opens or closes. */
  onOpenChange?: (open: boolean) => void;
  /** Which side of the button the panel opens on. */
  side?: ComponentProps<typeof PopoverContent>["side"];
  /** How the panel lines up with the button along that side: its start, its centre or its end. */
  align?: ComponentProps<typeof PopoverContent>["align"];
  /** Classes for the button. */
  className?: string;
}

const toMs = (value: Date | string | number): number => (value instanceof Date ? value.getTime() : typeof value === "number" ? value : Date.parse(value));

/** "2 hours ago", "yesterday", "3 days ago": the largest unit that fits. */
function ago(at: number, now: number, locale: string): string {
  const seconds = Math.round((at - now) / 1000);
  const abs = Math.abs(seconds);
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (abs < 45) return relative.format(0, "second");
  if (abs < 3600) return relative.format(Math.round(seconds / 60), "minute");
  if (abs < 86_400) return relative.format(Math.round(seconds / 3600), "hour");
  if (abs < 30 * 86_400) return relative.format(Math.round(seconds / 86_400), "day");
  return relative.format(Math.round(seconds / (30 * 86_400)), "month");
}

/** The formula in a code block that selects whole on one click, with a copy button that falls back to selecting it. */
function Formula({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const code = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async (): Promise<void> => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // No clipboard permission: select the formula so Ctrl C still works.
      const selection = window.getSelection();
      if (code.current && selection) {
        const range = document.createRange();
        range.selectNodeContents(code.current);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setState("failed");
    }
    timer.current = setTimeout(() => setState("idle"), 2200);
  };

  return (
    <span className="relative block font-normal">
      <code
        ref={code}
        className="block rounded-md border border-border bg-muted/50 py-2.5 pr-11 pl-3 font-mono text-[0.8125rem] leading-relaxed [overflow-wrap:anywhere] whitespace-pre-wrap [font-variant-ligatures:none] select-all"
      >
        {text}
      </code>
      <button
        type="button"
        aria-label="Copy formula"
        onClick={() => void copy()}
        className="absolute top-1.5 right-1.5 grid size-7 place-items-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-background hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
      >
        {state === "copied" ? <IconCheck aria-hidden="true" className="size-4 text-foreground" /> : <IconCopy aria-hidden="true" className="size-4" />}
      </button>
      <span role="status" className="sr-only">
        {state === "copied" ? "Formula copied" : state === "failed" ? "Could not copy. The formula is selected: press Ctrl C." : ""}
      </span>
    </span>
  );
}

/**
 * Explains a number where it is shown. A small info button sits next to the
 * metric's label and opens a panel with what the number means, how it is
 * worked out (a monospaced formula you can select or copy), where the data
 * comes from, when it last refreshed and who owns it, always in that order.
 * The refresh time reads both as "2 hours ago" and as a date, and a source
 * older than `staleAfterHours` is flagged in words. The button is named
 * "About metric: Net revenue retention", the panel does not trap focus and
 * works on touch, and none of its content is in the page until it is opened.
 */
export function MetricDefinitionPopover({
  name,
  definition,
  formula,
  source,
  refreshedAt,
  staleAfterHours = 24,
  owner,
  notes,
  locale = "en-US",
  timeZone = "UTC",
  now,
  defaultOpen,
  open,
  onOpenChange,
  side = "bottom",
  align = "start",
  className,
}: MetricDefinitionPopoverProps) {
  const titleId = useId();
  const [own, setOwn] = useState(defaultOpen ?? false);
  const opened = open ?? own;
  // A panel that was open from the start must not pull focus; one the reader opened should.
  const askedFor = useRef(false);

  const refreshed = refreshedAt === undefined ? Number.NaN : toMs(refreshedAt);
  const measuredFrom = now === undefined ? Date.now() : toMs(now);
  const stale = Number.isFinite(refreshed) && measuredFrom - refreshed > staleAfterHours * 3_600_000;

  const items: DescriptionItem[] = [{ term: "Definition", value: <span className="font-normal">{definition}</span> }];
  if (formula) items.push({ term: "Formula", value: <Formula text={formula} /> });
  if (source) items.push({ term: "Source", value: <span className="font-normal">{source}</span> });
  if (Number.isFinite(refreshed)) {
    const absolute = new Intl.DateTimeFormat(locale, {
      timeZone,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(refreshed);
    items.push({
      term: "Last refreshed",
      value: (
        <span className="block font-normal">
          <span className="font-medium" suppressHydrationWarning={now === undefined}>
            {ago(refreshed, measuredFrom, locale)}
          </span>
          <span className="text-muted-foreground">
            {" "}
            &middot; <time dateTime={new Date(refreshed).toISOString()}>{absolute}</time>
          </span>
          {stale ? (
            <span className="mt-1.5 flex items-start gap-1.5 text-xs font-medium">
              <IconWarning aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span>
                Stale: refreshed more than {new Intl.NumberFormat(locale, { style: "unit", unit: "hour", unitDisplay: "long" }).format(staleAfterHours)} ago, so the number may be
                out of date.
              </span>
            </span>
          ) : null}
        </span>
      ),
    });
  }
  if (owner) {
    items.push({
      term: "Owner",
      value: owner.href ? (
        <a
          href={owner.href}
          className="rounded-sm underline decoration-border underline-offset-4 transition-colors duration-150 outline-none hover:decoration-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
        >
          {owner.name}
          {/* Inline, with a word joiner before it, so when a long name wraps the arrow stays on the line of its last word. */}
          {"\u2060"}
          <IconArrowUpRight aria-hidden="true" className="ml-1 inline size-3.5 align-[-0.15em]" />
        </a>
      ) : (
        owner.name
      ),
    });
  }

  return (
    <Popover
      open={opened}
      onOpenChange={(next) => {
        if (next) askedFor.current = true;
        if (open === undefined) setOwn(next);
        onOpenChange?.(next);
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          data-slot="metric-definition-popover"
          aria-label={`About metric: ${name}`}
          className={cn(
            // The drawing is 24px; the touch target reaches 44px.
            "relative size-6 rounded-full text-muted-foreground hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-foreground",
            "after:absolute after:top-1/2 after:left-1/2 after:size-11 after:-translate-x-1/2 after:-translate-y-1/2 after:content-['']",
            className,
          )}
        >
          <IconInfo className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        data-slot="metric-definition-content"
        side={side}
        align={align}
        collisionPadding={12}
        aria-labelledby={titleId}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          if (askedFor.current) (event.currentTarget as HTMLElement | null)?.focus();
        }}
        className="w-[22rem] max-w-[calc(100vw-1.5rem)] overflow-hidden p-0 outline-none"
      >
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">About this metric</p>
            <h3 id={titleId} className="mt-0.5 text-[0.9375rem] leading-snug font-medium tracking-[-0.02em] [overflow-wrap:anywhere]">
              {name}
            </h3>
          </div>
          <PopoverClose
            aria-label="Close"
            className="-mt-1 -mr-1.5 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors duration-150 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 motion-reduce:transition-none"
          >
            <IconClose aria-hidden="true" className="size-4" />
          </PopoverClose>
        </div>
        <div className="border-t border-border px-4 py-4">
          {/* One column that may shrink to the panel: without minmax(0, 1fr) the grid grows to the longest unbreakable token (a warehouse table name) and the panel cuts every section off. */}
          <DescriptionList
            items={items}
            layout="stacked"
            className="grid-cols-[minmax(0,1fr)] gap-4 [&_dd]:text-[0.8125rem] [&_dd]:leading-relaxed [&_dd]:font-normal [&_dd]:[overflow-wrap:anywhere] [&_dt]:text-xs [&>div]:grid-cols-[minmax(0,1fr)]"
          />
        </div>
        {notes ? <p className="border-t border-border bg-muted/40 px-4 py-3 text-xs leading-relaxed [overflow-wrap:anywhere] text-muted-foreground">{notes}</p> : null}
      </PopoverContent>
    </Popover>
  );
}
