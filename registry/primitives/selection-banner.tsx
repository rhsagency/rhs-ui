"use client";

import { Fragment, useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { IconCheckDouble, IconCheckSquare } from "@rhs-ui/icons";
import { Button } from "@rhs-ui/primitives/button";
import { cn } from "@/lib/utils";

/** The words the banner says, for another language or your own wording. `{count}`, `{total}` and `{noun}` are filled in. */
export interface SelectionBannerLabels {
  /** What it says when the page is selected. Default "All {count} {noun} on this page are selected." */
  page: string;
  /** What it says when every row is selected. Default "All {total} {noun} are selected." */
  all: string;
  /** The button of the first state: it names the count. Default "Select all {total} {noun}". */
  selectAll: string;
  /** The button of the second state. Default "Clear selection". */
  clear: string;
}

export interface SelectionBannerProps extends Omit<ComponentProps<"div">, "children"> {
  /** How many rows the page shows. Mount the banner when every one of them is selected. */
  pageCount: number;
  /** How many rows there are in all, across every page. The banner stays away when the page holds them all. */
  total: number;
  /** Whether all `total` rows are selected, not only the ones on the page. */
  allSelected: boolean;
  /** Called when the person asks for every row. Keep an "everything matching" flag of your own and pass it back as `allSelected`. */
  onSelectAll: () => void;
  /** Called when the person clears the selection. The banner goes with the button that had the focus: move focus yourself before you clear, to the header checkbox of the table. */
  onClear: () => void;
  /** What the rows are, in the plural: "orders". Default "rows". */
  noun?: string;
  /** The locale that writes the counts: 1,312 or 1.312. Default "en-US". */
  locale?: string;
  /** The words the banner says, for translation. */
  labels?: Partial<SelectionBannerLabels>;
}

const DEFAULT_LABELS = {
  page: "All {count} {noun} on this page are selected.",
  all: "All {total} {noun} are selected.",
  selectAll: "Select all {total} {noun}",
  clear: "Clear selection",
} satisfies SelectionBannerLabels;

const fill = (template: string, values: Readonly<Record<string, string>>) => template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);

/** The same sentence with its counts set heavier, so the numbers are what the eye finds. */
function emphasise(template: string, values: Readonly<Record<string, string>>): ReactNode[] {
  return template.split(/(\{\w+\})/).map((part, index) => {
    const key = /^\{(\w+)\}$/.exec(part)?.[1];
    if (key === undefined || !(key in values)) return <Fragment key={index}>{part}</Fragment>;
    return key === "noun" ? (
      <Fragment key={index}>{values[key]}</Fragment>
    ) : (
      <span key={index} className="font-medium text-foreground tabular-nums">
        {values[key]}
      </span>
    );
  });
}

/**
 * The line under a table's header that offers to go on from the rows of one page to every row. Once all rows of a page are
 * selected and more exist, it reads "All 25 orders on this page are selected" with a button that names the count:
 * "Select all 312 orders". After the press it reads "All 312 orders are selected" with "Clear selection". It is one
 * button that changes its words, so keyboard focus stays where it was, and each state is announced once to a screen
 * reader through a live region that is on the page before its words are. Clearing removes the banner and the button
 * with it, so `onClear` is where you move the focus on (to the header checkbox). A calm muted surface with no colour; the
 * selection itself is yours, because only you know what "all 312" means for your query.
 */
export function SelectionBanner({ pageCount, total, allSelected, onSelectAll, onClear, noun = "rows", locale = "en-US", labels, className, ...props }: SelectionBannerProps) {
  const words = { ...DEFAULT_LABELS, ...labels };
  const numbers = new Intl.NumberFormat(locale);
  const values = { count: numbers.format(pageCount), total: numbers.format(total), noun };
  const template = allSelected ? words.all : words.page;
  const visible = allSelected || total > pageCount;
  const sentence = fill(template, values);

  // The region is on the page first and its words follow a moment later: a live region that is born with its text is often never read.
  const [said, setSaid] = useState("");
  useEffect(() => {
    if (!visible) {
      // Gone from the page: the next time it appears it starts empty again and is announced again.
      setSaid("");
      return;
    }
    const timer = window.setTimeout(() => setSaid(sentence), 120);
    return () => window.clearTimeout(timer);
  }, [visible, sentence]);

  if (!visible) return null;
  return (
    <div
      data-slot="selection-banner"
      data-state={allSelected ? "all" : "page"}
      className={cn("relative flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-lg border border-border bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground", className)}
      {...props}
    >
      {/* The icon is set in the sentence, not beside it: when a narrow screen wraps the sentence it stays with the first words and does not float off to the edge. */}
      <p>
        {allSelected ? (
          <IconCheckDouble aria-hidden="true" className="mr-2 inline-block size-4 align-[-3px]" />
        ) : (
          <IconCheckSquare aria-hidden="true" className="mr-2 inline-block size-4 align-[-3px]" />
        )}
        {emphasise(template, values)}
      </p>
      {/* One button for both states, so it keeps focus when its words change. */}
      <Button type="button" size="sm" variant={allSelected ? "ghost" : "outline"} onClick={allSelected ? onClear : onSelectAll} className="shrink-0">
        {allSelected ? words.clear : fill(words.selectAll, values)}
      </Button>
      <span role="status" className="sr-only">
        {said}
      </span>
    </div>
  );
}
