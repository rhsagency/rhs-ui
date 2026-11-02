import type { ComponentProps, ReactNode } from "react";

import { IconArrowLeft, IconArrowLeftRight, IconArrowRight, IconMinusCircle } from "@rhs-ui/icons";
import { SectionHeading } from "@rhs-ui/primitives/section-heading";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@rhs-ui/primitives/table";
import { cn } from "@/lib/utils";

/** to-right: from your tool to theirs. to-left: from theirs to yours. both: each side changes the other. */
export type SyncDirection = "to-right" | "to-left" | "both";

export interface SyncTool {
  /** The tool's name: "Halcyon". It heads its column. */
  name: string;
  /** A logo or glyph drawn at 16px in a small tile beside the name. It is decoration: the name is written. The first letter of the name stands in when there is none. */
  mark?: ReactNode;
}

export interface SyncRow {
  /** The object in your tool, on the left: "Contacts". It is the row's heading. */
  ours: string;
  /** The object in the other tool, on the right: "Customers". */
  theirs: string;
  /** Which way the data goes. */
  direction: SyncDirection;
  /** How often it syncs, as people say it: "Real time", "Every 15 minutes", "Once a day". */
  frequency: string;
  /** What stays manual, or what to know about this pair: "Only contacts with an email address." */
  note?: string;
}

export interface SyncMappingLabels {
  /** Column head for the direction. */
  direction: string;
  /** Column head for the frequency. */
  frequency: string;
  /** Column head for the notes. */
  note: string;
  /** The words for a one way pair. */
  oneWay: string;
  /** The words for a two way pair. */
  twoWay: string;
  /** What a screen reader hears for a one way pair. {from} and {to} stand for the two objects. */
  announceOne: string;
  /** What a screen reader hears for a two way pair. {from} and {to} stand for the two objects. */
  announceTwo: string;
  /** The table's name, read out by screen readers. {left} and {right} stand for the two tools. */
  caption: string;
  /** The title of the list of what does not sync. */
  limits: string;
  /** Said under the table when it has to scroll sideways. */
  scroll: string;
}

export interface SyncMappingProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The small line over the heading: "Integration". */
  eyebrow?: string;
  /** The heading: "What syncs between Halcyon and Ledgerly". */
  title: string;
  /** One or two sentences under the heading. */
  description?: string;
  /** Your tool: its name heads the left column of objects. */
  left: SyncTool;
  /** The other tool: its name heads the right column of objects. */
  right: SyncTool;
  /** One row per pair of objects. */
  rows: readonly SyncRow[];
  /** What does not sync, one plain line each: "Attachments are not synced". It is a list under the table, because this is the part people search for. */
  limits?: readonly string[];
  /** The level of the heading: 2 by default. The title of the list of limits sits one level below. */
  headingLevel?: 2 | 3;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<SyncMappingLabels>;
}

const LABELS: SyncMappingLabels = {
  direction: "Direction",
  frequency: "How often",
  note: "Notes",
  oneWay: "One way",
  twoWay: "Two way",
  announceOne: "{from} to {to}, one way",
  announceTwo: "{from} to {to}, two way",
  caption: "What syncs between {left} and {right}",
  limits: "What does not sync",
  scroll: "Scroll sideways to see the whole table",
};

const ARROW = { "to-right": IconArrowRight, "to-left": IconArrowLeft, both: IconArrowLeftRight } as const;

/**
 * The first column stays in view while the rest of the table scrolls sideways, so a row never loses the name of its
 * object. It is solid, or the cells passing beneath it would show through, and it ends in an inset line because a
 * collapsed border stays where the column started while the cell moves. From the width where the whole table fits
 * it is an ordinary column again.
 */
const PINNED = "sticky left-0 z-10 [box-shadow:inset_-1px_0_0_var(--border)] @[44rem]:static @[44rem]:[box-shadow:none]";

/** The tool's mark in a small tile: what you pass, or the first letter of its name. */
function Tool({ tool }: { tool: SyncTool }): React.JSX.Element {
  return (
    <span className="flex items-center gap-2.5 text-foreground">
      <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center rounded-md border border-border bg-background text-[0.8125rem] font-semibold [&_svg]:size-4">
        {tool.mark ?? tool.name.charAt(0).toUpperCase()}
      </span>
      <span className="text-sm font-medium">{tool.name}</span>
    </span>
  );
}

/**
 * What syncs between two tools, in the table people actually look for: one row per pair of objects, your object on
 * the left and the other tool's on the right, the direction between them (an arrow and the words One way or Two
 * way), how often it runs and what stays manual. Direction is announced in full, "Contacts to Customers, two way",
 * and never left to an arrow. Under the table is a plain list of what does not sync, because that is the honest detail
 * integration pages usually leave out. On a narrow block the table scrolls sideways inside its own region, which can
 * be reached and scrolled with the keyboard, and says so underneath; the first column, your object, stays in view
 * while it scrolls, so a row never loses its name. No state, no script: it renders on the server.
 */
export function SyncMapping({ eyebrow, title, description, left, right, rows, limits, headingLevel = 2, labels: custom, className, ...props }: SyncMappingProps) {
  const labels = { ...LABELS, ...custom };
  const Limits = `h${headingLevel + 1}` as "h3" | "h4";
  const caption = labels.caption.replace("{left}", left.name).replace("{right}", right.name);

  /** "Contacts to Customers, two way": the pair in the order the data travels, then how many ways it goes. */
  const announce = (row: SyncRow) => {
    const from = row.direction === "to-left" ? row.theirs : row.ours;
    const to = row.direction === "to-left" ? row.ours : row.theirs;
    return (row.direction === "both" ? labels.announceTwo : labels.announceOne).replace("{from}", from).replace("{to}", to);
  };

  return (
    <section data-slot="sync-mapping" className={cn("@container w-full break-words", className)} {...props}>
      <SectionHeading eyebrow={eyebrow} title={title} description={description} as={headingLevel === 3 ? "h3" : "h2"} />

      {/*
        The one scroll container: the table's own wrapper is told not to scroll, so the region you can focus is the one that moves.
        It is a tab stop at every width, also where the table fits and nothing scrolls. Knowing that a region overflows takes a
        script, and a region that does scroll but cannot be reached by keyboard is the worse of the two, so the block keeps to
        no script and one extra Tab. (isolate keeps the pinned column's z-index inside the region.)
      */}
      <div
        role="region"
        aria-label={caption}
        tabIndex={0}
        className="relative isolate mt-10 overflow-x-auto rounded-xl border border-border bg-card outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 @3xl:mt-12 [&_[data-slot=table-container]]:overflow-visible"
      >
        <Table className="min-w-[44rem]">
          <TableCaption className="sr-only">{caption}</TableCaption>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead scope="col" className={cn(PINNED, "h-auto w-28 bg-[color-mix(in_oklch,var(--card),var(--muted)_40%)] py-3 pl-5 align-middle whitespace-normal @[44rem]:w-[17%] @[44rem]:whitespace-nowrap")}>
                <Tool tool={left} />
              </TableHead>
              <TableHead scope="col" className="h-auto w-[15%] py-3 align-middle">
                {labels.direction}
              </TableHead>
              <TableHead scope="col" className="h-auto w-[17%] py-3 align-middle">
                <Tool tool={right} />
              </TableHead>
              <TableHead scope="col" className="h-auto w-[15%] py-3 align-middle">
                {labels.frequency}
              </TableHead>
              <TableHead scope="col" className="h-auto py-3 pr-5 align-middle">
                {labels.note}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const Arrow = ARROW[row.direction];
              return (
                <TableRow key={`${row.ours}-${row.theirs}`} className="hover:bg-transparent">
                  <TableHead scope="row" className={cn(PINNED, "h-auto bg-card py-4 pl-5 align-top text-[0.9375rem] leading-6 font-medium whitespace-normal text-foreground")}>
                    {row.ours}
                  </TableHead>
                  <TableCell className="py-4 align-top">
                    <span className="inline-flex h-6 items-center gap-2.5 whitespace-nowrap">
                      <span aria-hidden="true" className="grid h-6 w-8 place-items-center rounded-full border border-border bg-background">
                        <Arrow className="size-3.5" />
                      </span>
                      <span aria-hidden="true" className="text-sm">
                        {row.direction === "both" ? labels.twoWay : labels.oneWay}
                      </span>
                      <span className="sr-only">{announce(row)}</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-4 align-top text-[0.9375rem] leading-6 font-medium">{row.theirs}</TableCell>
                  <TableCell className="py-4 align-top text-sm leading-6 tabular-nums">{row.frequency}</TableCell>
                  <TableCell className="py-4 pr-5 align-top text-sm leading-6 text-pretty whitespace-normal text-muted-foreground">{row.note}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground @[44rem]:hidden">
        <IconArrowLeftRight aria-hidden="true" className="size-3.5 shrink-0" />
        {labels.scroll}
      </p>

      {limits?.length ? (
        <div className="mt-10 max-w-2xl">
          <Limits className="text-base leading-snug font-medium tracking-[-0.01em]">{labels.limits}</Limits>
          <ul role="list" className="mt-4 grid gap-3 text-sm leading-relaxed text-muted-foreground">
            {limits.map((limit) => (
              <li key={limit} className="flex gap-3">
                <IconMinusCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0">{limit}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
