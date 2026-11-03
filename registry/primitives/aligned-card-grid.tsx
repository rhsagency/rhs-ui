import type { ComponentProps, CSSProperties } from "react";

import { Card } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

/** The rows a card can have, top to bottom. Any other name is a row of your own, filled with `AlignedCardGrid.Part`. */
export type AlignedCardPart = "media" | "title" | "body" | "footer" | (string & {});

/** The space between cards, in a row and between rows: a step, or any CSS length such as `2rem`. `sm` 0.75rem, `md` 1.25rem, `lg` 2rem. */
export type AlignedCardGridGap = "sm" | "md" | "lg" | (string & {});

export interface AlignedCardGridProps extends ComponentProps<"div"> {
  /** The narrowest a card may get, any CSS length. The grid fits as many columns as the width allows and lets the cards share what is left. Default `16rem`. */
  minCardWidth?: string;
  /** The space between cards. Default `md`. */
  gap?: AlignedCardGridGap;
  /** The rows every card is made of, top to bottom: the parts that exist. List only what you use, and a part nobody has takes no room. Default `media`, `title`, `body`, `footer`. */
  rows?: readonly AlignedCardPart[];
}

const GAPS: Record<string, string> = { sm: "0.75rem", md: "1.25rem", lg: "2rem" };

const DEFAULT_ROWS: readonly AlignedCardPart[] = ["media", "title", "body", "footer"];

/** A part's name as a custom property: letters, digits and dashes, so any row name is safe in a style attribute. */
const rowVar = (name: string) => `--acg-row-${name.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}`;

/**
 * Cards in a row that line up inside. Every card is a subgrid of the grid it
 * sits in, one row for each part, so the title, the body and the footer of
 * cards side by side share their rows: a two-line title in one card and a
 * four-line title in the next still start their bodies at the same height,
 * and the actions end on the same baseline. Compose a card from
 * `AlignedCardGrid.Card` and its parts (`Media`, `Title`, `Body`, `Footer`,
 * or `Part` for a row of your own); any part can be left out of a card, and
 * a row that no card uses collapses, because `rows` lists only what exists.
 * Where subgrid is missing the cards fall back to flex columns of equal
 * height with the footer pushed to the bottom. Pricing plans, product cards
 * and feature cards are the obvious uses; give the root `role="list"` and
 * each card `role="listitem"` when they are a list.
 */
export function AlignedCardGrid({ minCardWidth = "16rem", gap = "md", rows = DEFAULT_ROWS, className, style, ...props }: AlignedCardGridProps) {
  const rowVars = Object.fromEntries(rows.map((name, index) => [rowVar(name), index + 1]));
  return (
    <div
      data-slot="aligned-card-grid"
      style={{ "--acg-min": minCardWidth, "--acg-gap": GAPS[gap] ?? gap, "--acg-rows": Math.max(1, rows.length), ...rowVars, ...style } as CSSProperties}
      // auto-fit stretches a short row of cards across the width, so three plans fill a wide container.
      className={cn("grid gap-(--acg-gap) [grid-template-columns:repeat(auto-fit,minmax(min(var(--acg-min),100%),1fr))]", className)}
      {...props}
    />
  );
}

/**
 * One card: the surface of a `Card`, a subgrid with one row per part. The
 * grid's row gap sits between rows of cards and not inside them, because the
 * card gives its own rows no gap of their own. The card owns the room under
 * its last part, so it ends the same distance below its text whichever parts
 * are left out; pass `pb-0` when the last part is a picture that should reach
 * the bottom edge.
 */
function AlignedCardGridCard({ className, ...props }: ComponentProps<typeof Card>) {
  return (
    <Card
      data-slot="aligned-card-grid-card"
      className={cn(
        // The fallback: a flex column that fills its grid cell, so cards in a row are as tall as the tallest.
        // No padding on top (the parts have their own) and 20px at the bottom, so a card that leaves its footer out still has air under its text.
        "min-w-0 gap-0 overflow-hidden py-0 pb-5",
        // With subgrid, the card spans one grid row per part and shares those rows with the cards beside it.
        "supports-[grid-template-rows:subgrid]:grid supports-[grid-template-rows:subgrid]:grid-rows-subgrid supports-[grid-template-rows:subgrid]:[grid-row:span_var(--acg-rows)]",
        className,
      )}
      {...props}
    />
  );
}

/** The row a part sits in, from the `rows` of the grid, so a card that leaves a part out keeps the others where its neighbours have them. */
const place = (name: string): CSSProperties => ({ gridRow: `var(${rowVar(name)})` });

/** The room around a part's text. The media part has none, so a picture reaches the edge of the card. */
const PAD = "px-5";

export interface AlignedCardPartProps extends ComponentProps<"div"> {
  /** Which row of the grid this part sits in: one of the names in the grid's `rows`. */
  name: AlignedCardPart;
}

/** A row of your own: a price, a feature list, a badge. Give it a name from the grid's `rows`. */
function AlignedCardGridPart({ name, className, style, ...props }: AlignedCardPartProps) {
  return <div data-slot="aligned-card-grid-part" data-part={name} style={{ ...place(name), ...style }} className={cn("min-w-0", PAD, className)} {...props} />;
}

export interface AlignedCardMediaProps extends ComponentProps<"div"> {
  /** A fixed shape for the picture, as a CSS aspect ratio such as `4/3`. Every card then has the same height of media. */
  ratio?: string;
}

/** The picture row: it runs to the edge of the card. Give it an image, or a shape drawn with CSS. */
function AlignedCardGridMedia({ ratio, className, style, ...props }: AlignedCardMediaProps) {
  return (
    <div
      data-slot="aligned-card-grid-media"
      data-part="media"
      style={{ ...place("media"), ...(ratio ? { aspectRatio: ratio } : undefined), ...style }}
      className={cn("relative min-w-0 overflow-hidden bg-muted [&>img]:block [&>img]:size-full [&>img]:object-cover", className)}
      {...props}
    />
  );
}

export interface AlignedCardTitleProps extends ComponentProps<"h3"> {
  /** The heading level, so the cards sit right in the outline of the page. Default `h3`. */
  as?: "h2" | "h3" | "h4" | "p";
}

/** The title row: a heading that wraps over as many lines as it needs, while the cards beside it keep their bodies level with it. */
function AlignedCardGridTitle({ as = "h3", className, style, ...props }: AlignedCardTitleProps) {
  const Tag = as as "h3";
  return <Tag data-slot="aligned-card-grid-title" data-part="title" style={{ ...place("title"), ...style }} className={cn("min-w-0 pt-5 text-base leading-snug font-semibold tracking-[-0.02em] text-balance", PAD, className)} {...props} />;
}

/** The body row: the text that explains the card. */
function AlignedCardGridBody({ className, style, ...props }: ComponentProps<"div">) {
  return <div data-slot="aligned-card-grid-body" data-part="body" style={{ ...place("body"), ...style }} className={cn("min-w-0 pt-2 text-sm leading-relaxed text-pretty text-muted-foreground", PAD, className)} {...props} />;
}

/** The footer row: the actions, the price, the link. In a row of cards the footers share one baseline, however long the cards above them are. The room under it is the card's own. */
function AlignedCardGridFooter({ className, style, ...props }: ComponentProps<"div">) {
  return <div data-slot="aligned-card-grid-footer" data-part="footer" style={{ ...place("footer"), ...style }} className={cn("mt-auto flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 pt-5", PAD, className)} {...props} />;
}

AlignedCardGrid.Card = AlignedCardGridCard;
AlignedCardGrid.Media = AlignedCardGridMedia;
AlignedCardGrid.Title = AlignedCardGridTitle;
AlignedCardGrid.Body = AlignedCardGridBody;
AlignedCardGrid.Footer = AlignedCardGridFooter;
AlignedCardGrid.Part = AlignedCardGridPart;
