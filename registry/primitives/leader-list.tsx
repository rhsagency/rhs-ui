import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

/** How the leader between the label and the value is drawn: a row of dots, short dashes or one hairline. */
export type LeaderStyle = "dots" | "dashes" | "line";

/** The type size of the whole list: `sm` 13px, `md` 15px, `lg` 16px. */
export type LeaderListSize = "sm" | "md" | "lg";

export interface LeaderListItem {
  /** A stable key, for when two rows could carry the same label. Without it the label (when it is text) and the position are used. */
  id?: string;
  /** The name of the row: a dish, a time, a chapter. A long label wraps onto a second line. */
  label: ReactNode;
  /** The figure on the right: a price, a page, a duration. It never wraps and uses tabular figures. */
  value: ReactNode;
  /** A quieter line under the label that explains it: the ingredients, the speaker, a note. */
  detail?: ReactNode;
}

export interface LeaderListProps extends Omit<ComponentProps<"div">, "children"> {
  /** The rows, in order. */
  items: readonly LeaderListItem[];
  /** How the leader is drawn. Default `dots`. */
  leader?: LeaderStyle;
  /** `ul` renders a list of rows, `dl` renders term and description pairs. Default `ul`. */
  as?: "ul" | "dl";
  /** The type size, and with it the space between rows. Default `md`. */
  size?: LeaderListSize;
}

const SIZE: Record<LeaderListSize, string> = {
  sm: "gap-y-2 text-[0.8125rem] leading-5",
  md: "gap-y-3 text-[0.9375rem] leading-6",
  lg: "gap-y-4 text-base leading-7",
};

/**
 * The leader is a thin box in the colour of the text, painted with a gradient
 * that is sized in em, so the dots grow with the type. Dots sit on the baseline.
 * In forced colours (high contrast) the browser takes backgrounds away, so the
 * same box turns into a border of the matching style.
 */
const LEADER: Record<LeaderStyle, string> = {
  dots: "h-[0.21em] bg-[image:radial-gradient(circle,currentColor_0.072em,transparent_0.098em)] bg-[length:0.43em_0.21em] bg-repeat-x bg-left-bottom forced-colors:h-0 forced-colors:border-b-2 forced-colors:border-dotted forced-colors:border-current forced-colors:bg-none",
  dashes: "h-px bg-[image:repeating-linear-gradient(to_right,currentColor_0,currentColor_0.3em,transparent_0.3em,transparent_0.6em)] forced-colors:h-0 forced-colors:border-b forced-colors:border-dashed forced-colors:border-current forced-colors:bg-none",
  line: "h-px bg-current forced-colors:h-0 forced-colors:border-b forced-colors:border-solid forced-colors:border-current forced-colors:bg-none",
};

function key(item: LeaderListItem, index: number): string {
  return `${item.id ?? (typeof item.label === "string" ? item.label : "row")}-${index}`;
}

/**
 * Rows that read label, leader, value: a menu, a schedule, a receipt, a table
 * of contents. The leader is drawn in CSS and fills exactly the space between
 * the two, so the dots start a little after the last word and stop before the
 * value, never running into either. A long label wraps onto a second line,
 * and the leader and the value stay on the last line of it. The value never
 * wraps and uses tabular figures, so a column of prices lines up. With
 * `as="dl"` the rows are term and description pairs; otherwise a list. The
 * leader is decorative and hidden from assistive technology, so it is never
 * read out as a string of dots.
 */
export function LeaderList({ items, leader = "dots", as = "ul", size = "md", className, ...props }: LeaderListProps) {
  const Root = as as "div";
  const Row = (as === "dl" ? "div" : "li") as "div";
  const Label = (as === "dl" ? "dt" : "span") as "span";
  const Value = (as === "dl" ? "dd" : "span") as "span";
  const Detail = (as === "dl" ? "dd" : "span") as "span";
  return (
    <Root data-slot="leader-list" data-leader={leader} role={as === "ul" ? "list" : undefined} className={cn("m-0 grid list-none p-0", SIZE[size], className)} {...props}>
      {items.map((item, index) => (
        <Row
          key={key(item, index)}
          data-slot="leader-list-row"
          // Bottom-aligned as a fallback; where the browser can, the value joins the last baseline of a label that wraps.
          className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-3 supports-[align-items:last_baseline]:[align-items:last_baseline]"
        >
          {/* The padding and the negative margin cancel out: they only give a focus ring inside the label room before the clip. */}
          <Label data-slot="leader-list-label" className="-m-1 min-w-0 [overflow-wrap:anywhere] overflow-clip p-1">
            {item.label}
            {/* A word joiner keeps the leader on the line of the last word instead of alone on a line of its own. */}
            {"\u2060"}
            <span aria-hidden="true" className={cn("ms-[0.5em] -me-[100vw] inline-block w-screen align-baseline text-muted-foreground/50", LEADER[leader])} />
          </Label>
          <Value data-slot="leader-list-value" className="m-0 text-end whitespace-nowrap tabular-nums">
            {item.value}
          </Value>
          {item.detail ? (
            <Detail data-slot="leader-list-detail" className="m-0 col-start-1 -mt-0.5 block text-[0.8125em] leading-snug text-pretty text-muted-foreground">
              {item.detail}
            </Detail>
          ) : null}
        </Row>
      ))}
    </Root>
  );
}
