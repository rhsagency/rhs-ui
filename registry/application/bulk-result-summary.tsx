"use client";

import { useEffect, useId, useRef, useState, type ComponentProps, type CSSProperties } from "react";

import { IconAlertCircle, IconCheck, IconChevronDown, IconDownload, IconRefresh } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@rhs-ui/primitives/collapsible";
import { cn } from "@/lib/utils";

/** One item that did not make it. */
export interface BulkFailure {
  /** A stable key for the item: a row number, an id. */
  id: string;
  /** What it was, in the words the person knows it by: "Row 17", "jane@acme.com". */
  label: string;
  /** Why it failed, in plain words that start lower case: "email is not valid". It is written after the label and a colon. */
  reason: string;
}

/** The words the panel uses, for translation. `{verb}`, `{succeeded}`, `{total}`, `{noun}`, `{count}` and `{counts}` are filled in. */
export interface BulkResultSummaryLabels {
  /** The headline when some items did not make it. Default "{verb} {succeeded} of {total} {noun}". */
  headline?: string;
  /** The headline, and the whole panel, when everything worked. Default "{verb} {total} {noun}". */
  headlineAll?: string;
  /** What the first count is called; leave it out and it is the verb in lower case ("imported"). */
  succeededLabel?: string;
  /** Default "skipped". */
  skippedLabel?: string;
  /** Default "failed". */
  failedLabel?: string;
  /** For items that were never tried, when the three counts do not add up to the total. Default "not processed". */
  restLabel?: string;
  /** The note beside the calm success line when some were skipped. Default "{count} skipped". */
  skippedNote?: string;
  /** The note beside it when some were never tried. Default "{count} not processed". */
  restNote?: string;
  /** The small heading above the failed items. Default "Failed items". */
  failedHeading?: string;
  /** The button that unfolds a long list. Default "Show all {count}". */
  showAll?: string;
  /** The button that folds it again. Default "Show fewer". */
  showFewer?: string;
  /** Default "Retry {count} failed". */
  retry?: string;
  /** Default "Download report". */
  download?: string;
  /** What a screen reader hears for the bar and the panel's description. Default "{counts}". */
  summarySpoken?: string;
}

export interface BulkResultSummaryProps extends Omit<ComponentProps<"section">, "children" | "title"> {
  /** How many items the job was given. */
  total: number;
  /** How many worked. */
  succeeded: number;
  /** How many were left alone on purpose: duplicates, rows that were empty. Default 0. */
  skipped?: number;
  /** The items that failed, each with the reason. The count of failures is the length of this list. With none, the panel shrinks to one calm line. */
  failures?: readonly BulkFailure[];
  /** Called when "Retry n failed" is pressed. Return a promise and the button shows a spinner meanwhile. When it settles the panel takes the focus, so a screen reader reads out the new headline and counts: settle it once the new numbers are in. Leave it out and there is no button. */
  onRetryFailed?: () => unknown;
  /** Called when "Download report" is pressed. Return a promise and the button shows a spinner meanwhile, and takes the focus back when it settles. Leave it out and there is no button. */
  onDownloadReport?: () => unknown;
  /** What the items are: "contacts", or `{ one: "contact", other: "contacts" }` so that one item is not "1 contacts". Default items. */
  noun?: string | { one: string; other: string };
  /** What the job did, in the past tense with a capital: "Imported", "Deleted", "Archived". Default "Processed". */
  verb?: string;
  /** How many failures show before the rest fold behind "Show all". Default 5. */
  foldAfter?: number;
  /** Take the focus once, when the panel appears, so a screen reader reads the result. Turn it off for a panel that is part of a page, not the answer to something the person just did. Default true. */
  autoFocus?: boolean;
  /** The language of the numbers. Default "en-US". */
  locale?: string;
  /** The words the panel uses, for translation. */
  labels?: BulkResultSummaryLabels;
}

const DEFAULT_LABELS = {
  headline: "{verb} {succeeded} of {total} {noun}",
  headlineAll: "{verb} {total} {noun}",
  succeededLabel: "",
  skippedLabel: "skipped",
  failedLabel: "failed",
  restLabel: "not processed",
  skippedNote: "{count} skipped",
  restNote: "{count} not processed",
  failedHeading: "Failed items",
  showAll: "Show all {count}",
  showFewer: "Show fewer",
  retry: "Retry {count} failed",
  download: "Download report",
  summarySpoken: "{counts}",
} satisfies Required<BulkResultSummaryLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

const isThenable = (value: unknown): value is PromiseLike<unknown> => typeof (value as { then?: unknown } | null)?.then === "function";

type Part = "succeeded" | "skipped" | "failed" | "rest";

/**
 * What each part of the bar looks like, told apart by pattern and not only by tone: a solid, dots, a diagonal hatch and an empty
 * outline. The marks are drawn with currentColor on hard stops, the same ink in both themes.
 */
const PARTS: Record<Part, { className: string; style?: CSSProperties }> = {
  succeeded: { className: "bg-primary" },
  skipped: {
    className: "bg-muted text-muted-foreground ring-1 ring-border ring-inset",
    style: { backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1.5px)", backgroundSize: "5px 5px", backgroundPosition: "center" },
  },
  failed: {
    className: "bg-[color-mix(in_oklch,var(--destructive)_12%,var(--background))] text-destructive ring-1 ring-destructive/60 ring-inset",
    style: { backgroundImage: "repeating-linear-gradient(135deg, currentColor 0 1.5px, transparent 1.5px 4.5px)" },
  },
  rest: { className: "ring-1 ring-border ring-inset" },
};

function Swatch({ part }: { part: Part }) {
  // Pulled down by half the difference between the label's line and the swatch, so it sits beside the first line when a long label wraps.
  return <span aria-hidden="true" style={PARTS[part].style} className={cn("mt-0.5 size-3 shrink-0 rounded-[4px]", PARTS[part].className)} />;
}

function FailureList({ items, label, className }: { items: readonly BulkFailure[]; label: string; className?: string }) {
  return (
    <ul role="list" aria-label={label} className={cn("grid gap-2.5", className)}>
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-2.5 text-sm leading-snug">
          <IconAlertCircle aria-hidden="true" className="mt-px size-4 shrink-0 text-destructive" />
          <span className="min-w-0 [overflow-wrap:anywhere]">
            <span className="font-medium text-foreground tabular-nums">{item.label}</span>
            <span className="text-muted-foreground">: {item.reason}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The outcome of a batch job in numbers: what worked, what was left alone and
 * what failed, with the failures listed one by one. A headline ("Imported 118
 * of 124 contacts"), a bar in three parts told apart by pattern (solid, dots,
 * hatch) with every count written out under it, and the failed items each
 * with its reason ("Row 17: email is not valid"). Beyond five failures the list
 * folds behind "Show all 9". Retry and Download report are the way on, and they
 * show a spinner while your promise runs; the focus, which a disabled button
 * loses, then goes back to Download report, and after a retry to the panel, so
 * a screen reader reads the new result. When nothing failed the whole panel
 * shrinks to one calm line with a check. The panel takes the focus once when
 * it appears, so a screen reader reads the result the person was waiting for;
 * turn that off for a panel that is part of a page.
 */
export function BulkResultSummary({
  total,
  succeeded,
  skipped = 0,
  failures = [],
  onRetryFailed,
  onDownloadReport,
  noun = { one: "item", other: "items" },
  verb = "Processed",
  foldAfter = 5,
  autoFocus = true,
  locale = "en-US",
  labels,
  className,
  ...props
}: BulkResultSummaryProps) {
  const text: Required<BulkResultSummaryLabels> = { ...DEFAULT_LABELS, ...labels };
  const id = useId();
  const panel = useRef<HTMLElement>(null);
  const retryButton = useRef<HTMLButtonElement>(null);
  const downloadButton = useRef<HTMLButtonElement>(null);
  const refocus = useRef<"retry" | "download" | null>(null);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState<"retry" | "download" | null>(null);

  useEffect(() => {
    if (autoFocus) panel.current?.focus();
    // Once, when the panel appears.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A disabled button cannot keep the focus, so the browser lets go of it while the job runs. When it is over the focus returns: to Download report, and after a retry to the panel, whose headline and counts have changed, so a screen reader reads out the new result. Not when the person has moved on in the meantime.
  useEffect(() => {
    if (working !== null || refocus.current === null) return;
    const which = refocus.current;
    refocus.current = null;
    const active = document.activeElement;
    const pressed = which === "retry" ? retryButton.current : downloadButton.current;
    if (active && active !== document.body && active !== pressed) return;
    (which === "retry" ? panel : downloadButton).current?.focus({ preventScroll: true });
  }, [working]);

  const whole = (value: number) => Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  const all = whole(total);
  const failed = failures.length;
  const worked = Math.min(whole(succeeded), all);
  const left = Math.min(whole(skipped), Math.max(0, all - worked));
  const rest = Math.max(0, all - worked - left - failed);

  const numbers = new Intl.NumberFormat(locale);
  const count = (value: number) => numbers.format(value);
  const word = typeof noun === "string" ? noun : new Intl.PluralRules(locale).select(all) === "one" ? noun.one : noun.other;
  const succeededWord = text.succeededLabel || verb.toLowerCase();

  const counts = [`${count(worked)} ${succeededWord}`, left > 0 ? `${count(left)} ${text.skippedLabel}` : "", failed > 0 ? `${count(failed)} ${text.failedLabel}` : "", rest > 0 ? `${count(rest)} ${text.restLabel}` : ""]
    .filter(Boolean)
    .join(", ");
  const spoken = fill(text.summarySpoken, { counts });
  const headline = failed === 0 && left === 0 && rest === 0 ? fill(text.headlineAll, { verb, total: count(all), noun: word }) : fill(text.headline, { verb, succeeded: count(worked), total: count(all), noun: word });

  // After the calm line's headline: what was left alone or never tried, as sentences.
  const notes = [left > 0 ? fill(text.skippedNote, { count: count(left) }) : "", rest > 0 ? fill(text.restNote, { count: count(rest) }) : ""].filter(Boolean);

  async function run(which: "retry" | "download", action: (() => unknown) | undefined) {
    if (working) return;
    const result = action?.();
    if (!isThenable(result)) return;
    refocus.current = document.activeElement === (which === "retry" ? retryButton : downloadButton).current ? which : null;
    setWorking(which);
    try {
      await result;
    } catch {
      // Your app shows its own error; the button just comes back.
    } finally {
      setWorking(null);
    }
  }

  const shell = "w-full rounded-xl border border-border bg-card text-card-foreground shadow-xs outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";
  const download = onDownloadReport ? (
    <Button ref={downloadButton} type="button" variant="outline" size="sm" loading={working === "download"} onClick={() => void run("download", onDownloadReport)}>
      {working === "download" ? null : <IconDownload />}
      {text.download}
    </Button>
  ) : null;

  // Nothing failed: one calm line, and the way to the report if there is one.
  if (failed === 0) {
    return (
      <section
        ref={panel}
        tabIndex={-1}
        data-slot="bulk-result-summary"
        data-outcome="complete"
        aria-labelledby={`${id}-headline`}
        aria-describedby={`${id}-summary`}
        className={cn(shell, "flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:px-5", className)}
        {...props}
      >
        <div className="flex min-w-0 flex-1 basis-56 items-center gap-3.5">
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground text-background [&_svg]:size-4">
            <IconCheck />
          </span>
          <p className="min-w-0 text-sm leading-snug">
            <span id={`${id}-headline`} className="font-medium tabular-nums">
              {headline}
            </span>
            {/* A note never breaks between its number and its word: it moves to the next line as a whole. */}
            {notes.map((note, index) => (
              <span key={index} className="text-muted-foreground tabular-nums">
                . <span className="whitespace-nowrap">{note}</span>
              </span>
            ))}
            <span id={`${id}-summary`} className="sr-only">
              {spoken}
            </span>
          </p>
        </div>
        {download}
      </section>
    );
  }

  const shown = failures.slice(0, foldAfter);
  const folded = failures.slice(foldAfter);
  const legend: { part: Part; value: number; label: string }[] = [
    { part: "succeeded", value: worked, label: succeededWord },
    ...(left > 0 ? [{ part: "skipped" as const, value: left, label: text.skippedLabel }] : []),
    { part: "failed", value: failed, label: text.failedLabel },
    ...(rest > 0 ? [{ part: "rest" as const, value: rest, label: text.restLabel }] : []),
  ];

  return (
    <section
      ref={panel}
      tabIndex={-1}
      data-slot="bulk-result-summary"
      data-outcome="partial"
      aria-labelledby={`${id}-headline`}
      aria-describedby={`${id}-summary`}
      className={cn(shell, "grid gap-5 p-5 sm:p-6", className)}
      {...props}
    >
      <div className="grid gap-4">
        <h3 id={`${id}-headline`} className="text-lg leading-snug font-semibold tracking-[-0.02em] text-balance tabular-nums">
          {headline}
        </h3>
        <p id={`${id}-summary`} className="sr-only">
          {spoken}
        </p>

        {/* The bar is a picture of the counts below it, so it is hidden from assistive technology; the counts are the content. */}
        <div aria-hidden="true" className="flex h-3 w-full gap-0.5">
          {legend.map((item) => (
            <span key={item.part} style={{ ...PARTS[item.part].style, flexGrow: item.value }} className={cn("min-w-1.5 basis-0 rounded-[4px]", PARTS[item.part].className)} />
          ))}
        </div>

        {/* Three counts or fewer share one row at any width; four go two by two on a phone and in one row from the small breakpoint, so no count is left alone on a row of its own. */}
        <dl className={cn("grid gap-x-3 gap-y-4", legend.length > 3 ? "grid-cols-2 sm:grid-cols-4" : legend.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {legend.map((item) => (
            <div key={item.part} className="grid min-w-0 gap-0.5">
              <dt className="order-2 flex items-start gap-2 text-xs leading-snug text-muted-foreground">
                <Swatch part={item.part} />
                {item.label}
              </dt>
              <dd className="order-1 text-2xl leading-none font-semibold tracking-[-0.03em] tabular-nums">{count(item.value)}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="grid gap-3 border-t border-border pt-5">
        <p className="text-xs leading-none font-medium tracking-[0.02em] text-muted-foreground uppercase">{text.failedHeading}</p>
        <Collapsible open={open} onOpenChange={setOpen}>
          <FailureList items={shown} label={text.failedHeading} />
          {folded.length ? (
            <>
              <CollapsibleContent>
                <FailureList items={folded} label={text.failedHeading} className="pt-2.5" />
              </CollapsibleContent>
              <div className="pt-2">
                <CollapsibleTrigger asChild>
                  <Button type="button" variant="ghost" size="sm" className="-ml-2.5 text-muted-foreground hover:text-foreground">
                    {open ? text.showFewer : fill(text.showAll, { count: count(failed) })}
                    <IconChevronDown className={cn("transition-transform duration-200 motion-reduce:transition-none", open && "rotate-180")} />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </>
          ) : null}
        </Collapsible>
      </div>

      {onRetryFailed || download ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-5">
          {onRetryFailed ? (
            <Button ref={retryButton} type="button" size="sm" loading={working === "retry"} onClick={() => void run("retry", onRetryFailed)}>
              {working === "retry" ? null : <IconRefresh />}
              {fill(text.retry, { count: count(failed) })}
            </Button>
          ) : null}
          {download}
        </div>
      ) : null}
    </section>
  );
}
