import { useId, type ComponentProps, type ElementType, type ReactNode } from "react";

import { IconArrowRight, IconArrowUpRight, IconInfo } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface RoadmapItem {
  /** What it is, in the words a customer would use: "Single sign-on for teams". */
  title: string;
  /** One line on why it matters, written as the problem it solves. */
  summary: string;
  /** The area it belongs to: "Security", "Integrations". */
  tag?: string;
  /** Where it stands, in words: "In progress", "Designing", "Exploring". */
  status?: string;
  /** Makes the whole card one link: to the issue, the post or the request form. Cards without one stay plain. */
  href?: string;
}

export type RoadmapPhase = "now" | "next" | "later" | "shipped";

export interface RoadmapColumn {
  /** Stable and URL-safe. A column whose id is now, next, later or shipped also gets that phase's mark in its heading. */
  id: string;
  /** The horizon: "Now", "Next", "Later". */
  title: string;
  /** One line on what the horizon means: "Being built this quarter". */
  description?: string;
  /** The mark in front of the title, when the id does not already say it. */
  phase?: RoadmapPhase;
  items: readonly RoadmapItem[];
}

export interface RoadmapLabels {
  /** The noun after a count of one, read out in the heading. */
  item: string;
  /** The noun after any other count. */
  items: string;
  /** Said for a column with nothing in it. */
  empty: string;
  /** The text of the link to what has shipped. */
  shipped: string;
}

export interface RoadmapColumnsProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** A heading for the roadmap: "What we are building". */
  title?: string;
  /** One or two sentences under the title. */
  description?: string;
  /** The columns, left to right. Three or four read best; five or more wrap. */
  columns: readonly RoadmapColumn[];
  /** Where the full record of shipped work lives, usually the changelog. Shows as a link under the board. */
  shippedHref?: string;
  /** The footnote. It defaults to a plain "Plans change" line; pass null to leave it out. */
  note?: ReactNode;
  /** The level of the title. Column headings sit one level below it, or take this level when there is no title. */
  headingLevel?: 1 | 2 | 3;
  /** Renders the card links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<RoadmapLabels>;
}

const LABELS: RoadmapLabels = { item: "item", items: "items", empty: "Nothing here yet.", shipped: "See what we have shipped" };

const NOTE = "Plans change. This is where we are heading, not a promise of dates, and the order inside a column is not a ranking.";

const PHASES = new Set<string>(["now", "next", "later", "shipped"]);

// Written out whole: Tailwind only generates classes it can read in the source.
const GRID: Record<number, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-2 xl:grid-cols-4",
};

const FOCUS = "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40";

/** A badge that holds your words: it wraps, even a word too long for the card, instead of widening the page. */
const CHIP = "h-auto max-w-full py-0.5 text-left whitespace-normal [overflow-wrap:anywhere]";

function phaseOf(column: RoadmapColumn): RoadmapPhase | undefined {
  if (column.phase) return column.phase;
  return PHASES.has(column.id) ? (column.id as RoadmapPhase) : undefined;
}

/** A line of text that ends in an arrow. The arrow stays glued to the last word, so it never wraps onto a line of its own. */
function WithArrow({ text, children }: { text: string; children: ReactNode }) {
  const words = text.trim().split(" ");
  const last = words.pop() ?? "";
  // Only a short last word is glued to the arrow: a long one has to be free to break.
  return (
    <>
      {words.length ? `${words.join(" ")} ` : null}
      <span className={last.length <= 14 ? "whitespace-nowrap" : undefined}>
        {last}
        {children}
      </span>
    </>
  );
}

/** The mark that says how near a horizon is: a full disc now, half of one next, an empty ring later and a check once shipped. */
function PhaseMark({ phase }: { phase: RoadmapPhase }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={16}
      height={16}
      aria-hidden="true"
      focusable="false"
      data-phase={phase}
      className={cn("size-4 shrink-0", phase === "later" ? "text-muted-foreground" : "text-foreground")}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={8} cy={8} r={6.25} />
      {phase === "now" ? <circle cx={8} cy={8} r={3.25} fill="currentColor" stroke="none" /> : null}
      {phase === "next" ? <path d="M8 4.75a3.25 3.25 0 0 1 0 6.5z" fill="currentColor" stroke="none" /> : null}
      {phase === "shipped" ? <path d="M5.25 8.25l1.9 1.9 3.6-3.9" /> : null}
    </svg>
  );
}

/**
 * A public roadmap in horizons, not dates: Now, Next and Later (and, if you
 * like, Shipped) as columns of cards, each with a title, one line on why it
 * matters, an area tag and a status in words. A horizon is a promise you can
 * keep, where a date is one you cannot, and a "Plans change" footnote is built
 * in for that reason. A card with a link is one stretched link and the rest
 * stay plain, so nothing is clickable that goes nowhere. Columns are labelled
 * lists with their counts in the heading; on a phone they stack, each under
 * its own heading, and from 768px they sit side by side as lanes.
 */
export function RoadmapColumns({
  title,
  description,
  columns,
  shippedHref,
  note = NOTE,
  headingLevel = 2,
  linkAs: Link = "a",
  labels: custom,
  className,
  ...props
}: RoadmapColumnsProps) {
  const labels = { ...LABELS, ...custom };
  const id = useId();
  const Title = `h${headingLevel}` as "h1" | "h2" | "h3";
  const Column = `h${title ? headingLevel + 1 : headingLevel}` as "h1" | "h2" | "h3" | "h4";
  const showNote = note !== null && note !== false;

  return (
    <section data-slot="roadmap-columns" className={cn("w-full break-words", className)} {...props}>
      {title || description ? (
        <header className="mb-10 max-w-2xl">
          {title ? <Title className="text-3xl leading-[1.1] font-medium tracking-[-0.04em] text-balance sm:text-4xl">{title}</Title> : null}
          {description ? <p className={cn("text-base leading-relaxed text-pretty text-muted-foreground", title && "mt-4")}>{description}</p> : null}
        </header>
      ) : null}

      {/* Each lane spans two rows (its heading and its cards) of the board's own grid, so the cards of every lane start on one line however long a heading wraps. */}
      <div className={cn("grid grid-cols-1 gap-10 md:auto-rows-auto md:grid-rows-[auto_1fr] md:gap-4", GRID[columns.length] ?? "md:grid-cols-2 lg:grid-cols-3")}>
        {columns.map((column) => {
          const phase = phaseOf(column);
          const count = column.items.length;
          const headingId = `${id}-${column.id}`;
          return (
            <div key={column.id} className="flex min-w-0 flex-col md:row-span-2 md:grid md:grid-cols-1 md:grid-rows-subgrid md:gap-y-0 md:rounded-2xl md:bg-muted/40 md:p-3">
              <header className="pb-4 md:px-2 md:pt-1 md:pb-3">
                <div className="flex items-center gap-2.5">
                  {phase ? <PhaseMark phase={phase} /> : null}
                  <Column id={headingId} className="min-w-0 text-lg leading-snug font-medium tracking-[-0.02em] [overflow-wrap:anywhere]">
                    {column.title}
                    <span className="sr-only">
                      {" "}
                      ({count} {count === 1 ? labels.item : labels.items})
                    </span>
                  </Column>
                  <span aria-hidden="true" className="ml-auto text-sm text-muted-foreground tabular-nums">
                    {count}
                  </span>
                </div>
                {column.description ? <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{column.description}</p> : null}
              </header>

              {count === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground md:self-start">{labels.empty}</p>
              ) : (
                <ul role="list" aria-labelledby={headingId} className="flex flex-col gap-2.5">
                  {column.items.map((item) => (
                    <li
                      key={`${column.id}-${item.title}`}
                      className={cn(
                        "group/card relative flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
                        item.href && "hover:border-foreground/25 hover:shadow-sm",
                      )}
                    >
                      {item.status || item.tag ? (
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                          {item.status ? <Badge variant="secondary" className={CHIP}>
                              {item.status}
                            </Badge> : null}
                          {item.tag ? <Badge variant="outline" className={CHIP}>
                              {item.tag}
                            </Badge> : null}
                        </div>
                      ) : null}
                      <div>
                        <p className="text-[0.9375rem] leading-snug font-medium tracking-[-0.01em]">
                          {item.href ? (
                            <Link
                              href={item.href}
                              className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-ring/40"
                            >
                              <WithArrow text={item.title}>
                                <IconArrowUpRight
                                  aria-hidden="true"
                                  className="ml-1 inline size-3.5 align-[-0.1em] text-muted-foreground transition-[translate,color] duration-150 group-hover/card:text-foreground motion-safe:group-hover/card:translate-x-0.5 motion-safe:group-hover/card:-translate-y-0.5 motion-reduce:transition-none"
                                />
                              </WithArrow>
                            </Link>
                          ) : (
                            item.title
                          )}
                        </p>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      {showNote || shippedHref ? (
        <footer className="mt-8 flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          {showNote ? (
            <p className="flex max-w-xl gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <IconInfo aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span className="min-w-0">{note}</span>
            </p>
          ) : (
            <span />
          )}
          {shippedHref ? (
            <Link
              href={shippedHref}
              className={cn(
                "group self-start rounded-sm text-sm font-medium [overflow-wrap:anywhere] underline decoration-foreground/40 underline-offset-4 transition-colors duration-150 hover:decoration-foreground motion-reduce:transition-none sm:shrink-0",
                FOCUS,
              )}
            >
              <WithArrow text={labels.shipped}>
                <IconArrowRight aria-hidden="true" className="ml-1.5 inline size-4 align-[-0.2em] transition-transform duration-150 motion-safe:group-hover:translate-x-0.5 motion-reduce:transition-none" />
              </WithArrow>
            </Link>
          ) : null}
        </footer>
      ) : null}
    </section>
  );
}
