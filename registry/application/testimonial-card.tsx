import type { ComponentProps } from "react";

import { ExpandableText } from "@rhs-ui/application/expandable-text";
import { IconArrowUpRight } from "@rhs-ui/icons";
import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Card } from "@rhs-ui/primitives/card";
import { Rating } from "@rhs-ui/primitives/rating";
import { cn } from "@/lib/utils";

/** The person who said it. */
export interface TestimonialAuthor {
  /** Their name: "Ana Costa". */
  name: string;
  /** What they do: "Head of design". */
  role?: string;
  /** Where: "Northwind". Written after the role, "Head of design, Northwind". */
  company?: string;
  /** A portrait, as an image address. Initials stand in while it loads, or when there is none. */
  image?: string;
}

/** The words the card uses, for translation. `{rating}` and `{max}` are filled in. */
export interface TestimonialCardLabels {
  /** The toggle on a long quote. Default "Read more". */
  more?: string;
  /** The toggle once it is open. Default "Read less". */
  less?: string;
  /** The rating in words, for screen readers and as the only place it is written. Default "Rated {rating} out of {max}". */
  rated?: string;
  /** Said after the name when the card links somewhere. Default "Read the full story". */
  story?: string;
}

export interface TestimonialCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** What they said. A long one is folded to `lines` lines with a "Read more" toggle. */
  quote: string;
  /** Who said it. */
  author: TestimonialAuthor;
  /** A score from 0 to `ratingMax`, halves allowed. Drawn as stars and written in words for screen readers. Leave it out for no stars. */
  rating?: number;
  /** The top of the scale. Default 5. */
  ratingMax?: number;
  /** Where the whole card goes: the case study, the review. The name becomes the link and its target stretches over the card. */
  href?: string;
  /** A larger, quieter card for the one quote that leads a section: bigger type, a tinted surface. */
  featured?: boolean;
  /** How many lines of the quote show before it folds. Default 6, and 7 for a featured card. */
  lines?: number;
  /** The words the card uses, for translation. */
  labels?: TestimonialCardLabels;
}

const DEFAULT_LABELS = {
  more: "Read more",
  less: "Read less",
  rated: "Rated {rating} out of {max}",
  story: "Read the full story",
} satisfies Required<TestimonialCardLabels>;

const fill = (template: string, values: Record<string, string>) => template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");

/**
 * One customer quote as a card: a `figure` with the words in a `blockquote`
 * and the person in its `figcaption`, so the attribution belongs to the
 * quote for anything that reads the page. The person has a portrait or their
 * initials, a role and a company; an optional rating is drawn as stars and
 * written in words ("Rated 5 out of 5"), since stars alone say nothing to a
 * screen reader. A long quote folds with a "Read more" toggle, and with `href`
 * the name links to the full story and its target covers the card, the toggle
 * staying a button of its own on top of it. The card has no margin and
 * no width of its own and fills the height of its grid cell, with the person
 * pinned to the bottom, so it drops into grids, carousels and marquees as it is.
 */
export function TestimonialCard({ quote, author, rating, ratingMax = 5, href, featured = false, lines, labels, className, ...props }: TestimonialCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const byline = [author.role, author.company].filter(Boolean).join(", ");

  return (
    <Card
      data-slot="testimonial-card"
      data-featured={featured || undefined}
      className={cn(
        "group/testimonial relative m-0 h-full gap-0 px-6 py-6 transition-[border-color,box-shadow] duration-200 motion-reduce:transition-none sm:px-7 sm:py-7",
        // An opaque tint mixed from the card's own colour: a see-through fill would be composited over the page, and in the dark theme (where the card is lighter than the page) it would hardly differ from a normal card.
        featured && "bg-[color-mix(in_oklab,var(--muted)_60%,var(--card))] py-7 sm:px-9 sm:py-9",
        href && "hover:border-ring/40 hover:shadow-sm has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/40",
        className,
      )}
      {...props}
    >
      <figure className={cn("flex h-full flex-col gap-5", featured && "gap-7")}>
        {rating !== undefined ? (
          <div className="flex items-center">
            <span aria-hidden="true">
              <Rating readOnly value={rating} max={ratingMax} size={featured ? 18 : 16} />
            </span>
            <span className="sr-only">{fill(text.rated, { rating: String(rating), max: String(ratingMax) })}</span>
          </div>
        ) : null}

        {/* The toggle sits above the link that covers the card, so it stays a button of its own. */}
        <blockquote className="min-w-0 [&_button]:relative [&_button]:z-10">
          <ExpandableText
            lines={lines ?? (featured ? 7 : 6)}
            moreLabel={text.more}
            lessLabel={text.less}
            textClassName={cn("text-foreground", featured ? "text-lg leading-snug tracking-[-0.015em] sm:text-xl" : "text-[0.9375rem] leading-relaxed")}
          >
            {quote}
          </ExpandableText>
        </blockquote>

        <figcaption className="mt-auto flex items-center gap-3 pt-1">
          <Avatar size={featured ? "lg" : "default"}>
            {author.image ? <AvatarImage src={author.image} alt="" /> : null}
            <AvatarFallback aria-hidden="true">{initialsOf(author.name) || "?"}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 gap-0.5 text-sm leading-snug">
            <cite className="font-medium text-foreground not-italic">
              {href ? (
                <a href={href} className="rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl">
                  {author.name}
                  <span className="sr-only">{`. ${text.story}`}</span>
                </a>
              ) : (
                author.name
              )}
            </cite>
            {byline ? <span className="text-muted-foreground [overflow-wrap:anywhere]">{byline}</span> : null}
          </div>
          {href ? <IconArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-muted-foreground transition-[color,transform] duration-200 group-hover/testimonial:-translate-y-0.5 group-hover/testimonial:translate-x-0.5 group-hover/testimonial:text-foreground motion-reduce:transition-none" /> : null}
        </figcaption>
      </figure>
    </Card>
  );
}
