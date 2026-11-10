import { useId, type ComponentProps, type ReactNode } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { cn } from "@/lib/utils";

export interface ResultLogo {
  /** The customer's name: what a screen reader says for the mark. */
  name: string;
  /** Their mark as an SVG or an image, drawn about 28px tall in the text colour. Without one the name is set as text. */
  mark?: ReactNode;
  /** The outcome in plain words: "Cut support tickets by 41 percent". */
  result: string;
  /** The part of `result` to set heavier, written exactly as it appears in it: "41 percent". Without it the first number in the result, with its unit, is used. */
  metric?: string;
  /** The story. When set the whole cell is one link to it; without it the cell is not a link. */
  href?: string;
}

export interface LogoResultsGridLabels {
  /** The quiet line after a result that has a story. Default "Read the story". */
  readStory: string;
}

export interface LogoResultsGridProps extends Omit<ComponentProps<"section">, "title" | "children"> {
  /** The heading of the section. */
  title: string;
  /** One sentence under the title. */
  description?: string;
  /** Six to nine customers read best. Three across on a desktop, two on a tablet, one on a phone; a short last row is closed by its last cell, which takes the free columns. */
  items: readonly ResultLogo[];
  /** Words for the fixed text, for a site that is not in English. */
  labels?: Partial<LogoResultsGridLabels>;
}

const LABELS: LogoResultsGridLabels = { readStory: "Read the story" };

/** The first number in a result, with the unit that follows it when there is a common one: "41 percent", "3 times", "4 days". */
const FIRST_FIGURE = /[+\-−]?\d[\d.,]*(?:\s?(?:%|×|(?:percent|x|times|hours?|hrs?|days?|weeks?|months?|minutes?|mins?|seconds?|secs?)\b))?/i;

/** Cuts a result into what comes before the figure, the figure and what follows it. */
function splitResult(result: string, metric?: string): readonly [string, string, string] {
  if (metric) {
    const at = result.indexOf(metric);
    return at < 0 ? [result, "", ""] : [result.slice(0, at), metric, result.slice(at + metric.length)];
  }
  const match = FIRST_FIGURE.exec(result);
  if (!match) return [result, "", ""];
  const figure = match[0].replace(/[.,]+$/, "");
  return [result.slice(0, match.index), figure, result.slice(match.index + figure.length)];
}

/** Every mark is drawn at one height, whatever shape it comes in; the width follows. */
const MARK = "inline-flex items-center text-foreground [&_img]:h-7 [&_img]:w-auto [&_img]:max-w-full [&_svg]:h-7 [&_svg]:w-auto [&_svg]:max-w-full";

const CELL = "flex h-full flex-col gap-4 p-6 sm:gap-6 sm:p-8";

/**
 * A last row that is short is closed by its last cell, which takes the free
 * columns, so the wall never ends on a blank cell: on two columns (640 to
 * 1023px) an odd last cell takes both; on three, a last cell alone in its row
 * takes all three and one beside a single cell takes the other two. Written
 * out whole so Tailwind sees every class.
 */
const FILL_LAST_ROW =
  "sm:max-lg:[&>li:last-child:nth-child(odd)]:col-span-2 lg:[&>li:last-child:nth-child(3n+1)]:col-span-3 lg:[&>li:last-child:nth-child(3n+2)]:col-span-2";

/**
 * A customer wall in which every logo has earned its place: each hairline cell
 * shows the customer's mark, one outcome line in plain words ("Cut support
 * tickets by 41 percent") with the figure set heavier in tabular digits so the
 * eye lands on it, and a quiet "Read the story" arrow. When a cell has a story
 * the whole cell is one link, with a focus ring inside it and the arrow moving
 * on hover; a cell without one is simply not a link. A count that does not
 * tile (seven or eight on a desktop, an odd number on a tablet) still ends on a
 * full row: the last cell stretches across the free columns. It proves
 * something that a bare logo wall cannot, and stays small enough to sit between
 * two sections. No state of its own, so it renders on the server.
 */
export function LogoResultsGrid({ title, description, items, labels, className, ...props }: LogoResultsGridProps) {
  const words = { ...LABELS, ...labels };
  const heading = useId();

  return (
    <section data-slot="logo-results-grid" aria-labelledby={heading} className={cn("py-16 sm:py-24", className)} {...props}>
      <header className="mx-auto max-w-2xl text-center">
        <h2 id={heading} className="text-3xl font-medium tracking-[-0.04em] text-balance sm:text-4xl">
          {title}
        </h2>
        {description ? <p className="mt-3 text-base leading-relaxed text-pretty text-muted-foreground">{description}</p> : null}
      </header>
      {/* The grid is pushed a hairline out of its frame on the right and below, so every cell can own its right and bottom rule and the frame closes the shape. */}
      <div className="mt-12 overflow-hidden rounded-xl border border-border sm:mt-16">
        <ul role="list" className={cn("-mr-px -mb-px grid sm:grid-cols-2 lg:grid-cols-3", FILL_LAST_ROW)}>
          {items.map((item) => {
            const [before, figure, after] = splitResult(item.result, item.metric);
            const body = (
              <>
                <span aria-hidden="true" className={MARK}>
                  {item.mark ?? <span className="text-lg font-semibold tracking-[-0.02em]">{item.name}</span>}
                </span>
                <span className="sr-only">{item.name}: </span>
                <span className="block text-lg leading-snug tracking-[-0.01em] text-pretty text-muted-foreground">
                  {before}
                  {figure ? <strong className="font-medium text-foreground tabular-nums">{figure}</strong> : null}
                  {after}
                </span>
                {item.href ? (
                  <span className="mt-auto inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors duration-150 group-hover/cell:text-foreground group-focus-visible/cell:text-foreground motion-reduce:transition-none sm:pt-2">
                    {words.readStory}
                    <IconArrowRight aria-hidden="true" className="size-4 transition-transform duration-150 motion-safe:group-hover/cell:translate-x-0.5 motion-reduce:transition-none" />
                  </span>
                ) : null}
              </>
            );
            return (
              <li key={item.name} className="border-r border-b border-border">
                {item.href ? (
                  <a
                    href={item.href}
                    className={cn(CELL, "group/cell outline-none transition-colors duration-150 hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:ring-inset motion-reduce:transition-none")}
                  >
                    {body}
                  </a>
                ) : (
                  <div className={CELL}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
