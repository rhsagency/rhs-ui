import { Children, type ComponentProps, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/** The mark between two items: a centred dot, a slash, a thin vertical bar, or only space. */
export type InlineListSeparator = "dot" | "slash" | "pipe" | "none";

/** The space between two items, separator included: `sm` 0.9em, `md` 1.25em, `lg` 1.75em, or any CSS length. */
export type InlineListGap = "sm" | "md" | "lg" | (string & {});

/** The type size: `xs` 12px, `sm` 14px, `md` 16px. */
export type InlineListSize = "xs" | "sm" | "md";

export interface InlineListProps extends Omit<ComponentProps<"div">, "children"> {
  /** The items, in order. Anything empty (`null`, `false`) is skipped, so a conditional item leaves no stray separator. */
  children: ReactNode;
  /** The mark between items. Default `dot`. */
  separator?: InlineListSeparator;
  /** The space between items. Default `md`. */
  gap?: InlineListGap;
  /** `ul` keeps the list semantics for assistive technology, `div` is plain text. Default `div`. */
  as?: "div" | "ul";
  /** Where the lines sit when the items wrap. Default `start`. */
  align?: "start" | "center" | "end";
  /** The type size. Default `sm`. */
  size?: InlineListSize;
  /** Keep every item on one line, so a wrap only ever happens between items. Turn it off for items that can be long. Default `true`. */
  nowrap?: boolean;
}

const GAPS: Record<string, string> = { sm: "0.9em", md: "1.25em", lg: "1.75em" };

const SIZE: Record<InlineListSize, string> = { xs: "text-xs leading-5", sm: "text-sm leading-6", md: "text-base leading-7" };

const ALIGN: Record<NonNullable<InlineListProps["align"]>, string> = { start: "text-start", center: "text-center", end: "text-end" };

/**
 * The separators are shapes painted behind a space, written out whole because Tailwind reads class names from the source. A dot is a
 * circle, a slash a diagonal hairline and a pipe a vertical one, all sized in em so they follow the type.
 */
const MARK: Record<InlineListSeparator, string> = {
  dot: "bg-[image:radial-gradient(circle,currentColor_0.1em,transparent_0.14em)]",
  slash: "bg-[image:linear-gradient(to_bottom_right,transparent_calc(50%-0.5px),currentColor_calc(50%-0.5px),currentColor_calc(50%+0.5px),transparent_calc(50%+0.5px))] bg-[length:0.5em_0.9em] bg-center bg-no-repeat",
  pipe: "bg-[image:linear-gradient(currentColor,currentColor)] bg-[length:1px_0.9em] bg-center bg-no-repeat",
  none: "",
};

/**
 * A line of small facts that wraps without ever dangling a separator: a
 * byline, a row of legal links, a fact line under a listing. A text
 * separator (` · `) ends up at the start or the end of a wrapped line; here
 * the separator is a shape painted behind the one space between two items,
 * and the browser drops that space where the line breaks, so the shape goes
 * with it. It never starts a line, never ends one, and never follows the last
 * item, in any alignment. There is no script and no measuring, so it is the
 * same on the server. With `as="ul"` the items stay a list and the
 * separators are hidden from assistive technology.
 */
export function InlineList({ children, separator = "dot", gap = "md", as = "div", align = "start", size = "sm", nowrap = true, className, style, ...props }: InlineListProps) {
  const Root = as as "div";
  const Item = (as === "ul" ? "li" : "span") as "span";
  const items = Children.toArray(children);
  return (
    <Root
      data-slot="inline-list"
      data-separator={separator}
      role={as === "ul" ? "list" : undefined}
      style={{ "--il-gap": GAPS[gap] ?? gap, ...style } as CSSProperties}
      className={cn("m-0 block list-none p-0 text-muted-foreground", SIZE[size], ALIGN[align], className)}
      {...props}
    >
      {items.map((item, index) => (
        <Item key={index} data-slot="inline-list-item" className="inline">
          <span className={cn(nowrap && "whitespace-nowrap")}>{item}</span>
          {index < items.length - 1 ? (
            // The space is the break opportunity and the width of the gap: its word spacing is what is left of the gap once the space itself is taken off.
            <span aria-hidden="true" data-slot="inline-list-separator" className={cn("whitespace-normal text-muted-foreground/60 [word-spacing:calc(var(--il-gap)-0.26em)]", MARK[separator])}>
              {" "}
            </span>
          ) : null}
        </Item>
      ))}
    </Root>
  );
}
