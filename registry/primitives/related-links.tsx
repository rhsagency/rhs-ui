import { useId, type ComponentProps, type ElementType } from "react";

import { IconArrowRight } from "@rhs-ui/icons";
import { Badge } from "@rhs-ui/primitives/badge";
import { cn } from "@/lib/utils";

export interface RelatedLink {
  /** The title of the page: the link's text and its accessible name. */
  title: string;
  /** Where the page is. */
  href: string;
  /** What kind of page it is, in a word: "Guide", "API", "Video". */
  kind?: string;
  /** One line about why it is worth opening. */
  summary?: string;
  /** Reading or watching time in minutes. */
  minutes?: number;
}

export interface RelatedLinksLabels {
  /** The time to read or watch, one wording for every kind; `{minutes}` is the number. Default "{minutes} min". */
  minutes?: string;
}

export interface RelatedLinksProps extends Omit<ComponentProps<"nav">, "children" | "aria-labelledby"> {
  /** The heading above the list, which also names the navigation landmark. Default "Keep reading". */
  heading?: string;
  /** The pages. An empty list renders nothing at all, not a heading over nothing. */
  links: readonly RelatedLink[];
  /** The level of the heading, 2 to 6, to fit the page it sits in. Default 2. */
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  /** `list` is one column; `columns` is two from the sm breakpoint up. Default "list". */
  layout?: "list" | "columns";
  /** Renders the links. Defaults to "a"; pass your router's Link. */
  linkAs?: ElementType;
  /** The locale the minutes are written in. Default "en-US". */
  locale?: string;
  /** Words for the time, for another language. */
  labels?: RelatedLinksLabels;
}

/**
 * The short "keep reading" list at the end of an article or a doc page. Each row is a title with, when there is
 * one, its kind (Guide, API, Video), a line about it and how many minutes it takes, between hairlines. The whole row
 * is the link but only the title is its name, so a screen reader hears a clean list of titles. Rows are at least 56px
 * tall for a thumb, the arrow moves a little on hover only where motion is allowed, and the list sits in a
 * navigation landmark named by its own heading. With nothing to show it renders nothing at all.
 */
export function RelatedLinks({ heading = "Keep reading", links, headingLevel = 2, layout = "list", linkAs: Link = "a", locale = "en-US", labels, className, ...props }: RelatedLinksProps) {
  const id = useId();
  if (!links.length) return null;
  const Heading = `h${headingLevel}` as const;
  const numbers = new Intl.NumberFormat(locale);
  const minutesText = labels?.minutes ?? "{minutes} min";

  return (
    <nav data-slot="related-links" aria-labelledby={`${id}-heading`} className={cn("grid gap-3", className)} {...props}>
      {/* Inset like the rows, so the heading and the titles start at the same edge. */}
      <Heading id={`${id}-heading`} className="px-3 text-base font-semibold tracking-[-0.02em] text-balance">
        {heading}
      </Heading>
      <ul className={cn("m-0 grid list-none p-0", layout === "columns" && "gap-x-10 sm:grid-cols-2")}>
        {links.map((link) => (
          <li key={`${link.title}-${link.href}`} className={cn("group/row relative border-b border-border first:border-t", layout === "columns" && "sm:[&:nth-child(2)]:border-t")}>
            <div className="flex min-h-14 items-center gap-4 px-3 py-4">
              <div className="grid min-w-0 flex-1 gap-1.5">
                {link.kind || link.minutes !== undefined ? (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {link.kind ? <Badge variant="muted">{link.kind}</Badge> : null}
                    {link.minutes !== undefined ? <span className="tabular-nums">{minutesText.replace("{minutes}", numbers.format(link.minutes))}</span> : null}
                  </p>
                ) : null}
                {/* The link stretches over exactly the row, and the row's text is inset from its sides so the focus ring, drawn inside, has room around it and nothing leaves the list: the row is the target and the title is the name. */}
                <Link
                  href={link.href}
                  className="w-fit font-medium tracking-[-0.01em] text-foreground underline-offset-4 outline-none after:absolute after:inset-0 after:rounded-lg group-hover/row:underline focus-visible:after:ring-[3px] focus-visible:after:ring-inset focus-visible:after:ring-ring/40"
                >
                  {link.title}
                </Link>
                {link.summary ? <p className="line-clamp-2 text-sm text-muted-foreground">{link.summary}</p> : null}
              </div>
              <IconArrowRight
                aria-hidden="true"
                className="size-4 shrink-0 text-muted-foreground transition-[transform,color] duration-150 group-hover/row:text-foreground group-focus-within/row:text-foreground motion-safe:group-hover/row:translate-x-0.5 motion-safe:group-focus-within/row:translate-x-0.5 motion-reduce:transition-none"
              />
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
}
