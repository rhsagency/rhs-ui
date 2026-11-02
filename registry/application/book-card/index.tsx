import { useId, type ComponentProps, type ReactNode } from "react";

import { BookCover } from "@rhs-ui/application/book-card/cover";
import { countText, dateText, fill, hashOf, listOf, priceText, scoreText, type DateInput } from "@rhs-ui/application/book-card/format";
import { RatingInline } from "@rhs-ui/commerce/rating-inline";
import { IconBookmark, IconCheck, IconClock } from "@rhs-ui/icons";
import { AspectRatio } from "@rhs-ui/primitives/aspect-ratio";
import { Badge } from "@rhs-ui/primitives/badge";
import { StatusBadge, type StatusDefinition } from "@rhs-ui/primitives/status-badge";
import { cn } from "@/lib/utils";

/** The ways to read it. A book can come in several. */
export type BookFormat = "print" | "ebook" | "audio";

/** Whether you can have it today: on the shelf, held for someone, or out on loan. */
export type BookAvailability = "available" | "reserved" | "out";

/** The cover picture. */
export interface BookCover {
  /** The picture, as an image address. */
  src: string;
  /** What it shows. Leave it out for a cover that only decorates, which is the usual case: the title is written right beside it. */
  alt?: string;
}

/** The words the card uses, for translation. `{date}`, `{rating}` and `{count}` are filled in. */
export interface BookCardLabels {
  /** Said to screen readers before the authors. Default "By". */
  by?: string;
  /** The name of the list of formats. Default "Formats". */
  formats?: string;
  /** The words of the formats. */
  formatNames?: Partial<Record<BookFormat, string>>;
  /** The words of the availability. */
  availabilities?: Partial<Record<BookAvailability, string>>;
  /** Said when the book is out and has a due date; the date is a `time` element. Default "Due back {date}". */
  due?: string;
  /** Said to screen readers before the price. Default "Price". */
  price?: string;
  /** What a screen reader hears for the stars when there is no count. Default "Rated {rating} out of 5". */
  rated?: string;
  /** What a screen reader hears for the stars, with the count. Default "Rated {rating} out of 5 from {count} ratings". */
  ratedCount?: string;
  /** The same for exactly one rating. Default "Rated {rating} out of 5 from 1 rating". */
  ratedOne?: string;
}

export interface BookCardProps extends Omit<ComponentProps<"article">, "title" | "children"> {
  /** The title. It is the one link of the card. */
  title: string;
  /** Who wrote it: written as "Ilse Verbeek, Tom Calder and Ana Ruiz" in the reader's language. */
  authors?: readonly string[];
  /** The cover, as an address or with its alt. It keeps a fixed 2:3 shape from the first paint. Without one, or when it fails to load, a typographic tile with the title stands in. */
  cover?: string | BookCover;
  /** The average rating, 0 to 5, drawn as stars with the score and the count. Leave it out and no stars are drawn. */
  rating?: number;
  /** How many ratings the score rests on. */
  ratingCount?: number;
  /** The formats it comes in, as word chips. */
  formats?: readonly BookFormat[];
  /** Whether it is on the shelf, reserved or out on loan. It is said in words, with a glyph, and never by colour alone. */
  availability?: BookAvailability;
  /** What it costs: a number is written in the currency and locale you name, in tabular numerals; a string is shown as you wrote it ("Free to borrow"). */
  price?: number | string;
  /** The ISO 4217 code of the currency of a numeric price. Default "EUR". */
  currency?: string;
  /** When a book that is out comes back: a Date, a timestamp or an ISO string; a date-only string ("2026-11-12") is the day it says in any time zone. Written next to the availability. */
  dueDate?: DateInput;
  /** The book's page. The title becomes a link and the whole card opens it. */
  href?: string;
  /** "horizontal" puts the cover beside the text, for lists; "vertical" puts it on a quiet shelf above the text, for grids. Default "horizontal". */
  orientation?: "horizontal" | "vertical";
  /** Heading level of the title. Default 3. */
  headingLevel?: 2 | 3 | 4;
  /** The language of the numbers and dates. Default "en-US". */
  locale?: string;
  /** The time zone the due date is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The words the card uses, for translation. */
  labels?: BookCardLabels;
}

const DEFAULT_LABELS = {
  by: "By",
  formats: "Formats",
  due: "Due back {date}",
  price: "Price",
  rated: "Rated {rating} out of 5",
  ratedCount: "Rated {rating} out of 5 from {count} ratings",
  ratedOne: "Rated {rating} out of 5 from 1 rating",
};

const DEFAULT_FORMATS: Record<BookFormat, string> = { print: "Print", ebook: "E-book", audio: "Audiobook" };
const DEFAULT_AVAILABILITY: Record<BookAvailability, string> = { available: "Available", reserved: "Reserved", out: "Checked out" };

/** Each state has its own glyph, fill and outline as well as its word, so none depends on colour. */
function definitions(words: Record<BookAvailability, string>): Record<BookAvailability, StatusDefinition> {
  return {
    available: { label: words.available, glyph: <IconCheck />, emphasis: "soft" },
    reserved: { label: words.reserved, glyph: <IconBookmark />, emphasis: "outline", className: "border-dashed" },
    out: { label: words.out, glyph: <IconClock />, emphasis: "quiet" },
  };
}

/** The jackets of a book without a cover: four quiet fills, picked by the title so the same book always wears the same one. */
const JACKETS = ["bg-muted text-foreground", "bg-foreground text-background", "bg-secondary text-secondary-foreground", "bg-card text-foreground"] as const;

/** A template with `{date}` in it, with the time element in its place. */
function withDate(template: string, date: ReactNode): ReactNode {
  const [before = "", ...after] = template.split("{date}");
  return (
    <>
      {before}
      {date}
      {after.join("{date}")}
    </>
  );
}

/**
 * The rating line: stars drawn to the exact average and the score, then the
 * count written in full ("1,284"), not shortened ("1.3k"). A shortened number
 * is written differently by Node and by the browser in some languages, and
 * the server and the browser have to agree. A screen reader hears `label`
 * for all of it, so the count is hidden from it.
 */
function Score({ value, count, label, locale, size, emptyText, className }: { value: number; count?: number; label?: string; locale: string; size: "sm" | "md"; emptyText?: string; className?: string }) {
  return (
    <span className={cn("inline-flex max-w-full flex-wrap items-center gap-y-0.5", size === "sm" ? "gap-x-1 text-xs" : "gap-x-1.5 text-sm", className)}>
      <RatingInline value={value} count={count} hideCount size={size} label={label} locale={locale} emptyText={emptyText} />
      {count !== undefined && count > 0 ? (
        <span aria-hidden="true" className="leading-none text-muted-foreground tabular-nums">
          ({countText(count, locale)})
        </span>
      ) : null}
    </span>
  );
}

/** What stretches the title's link over the whole card, and shows the focus on the card instead of on the words. */
const OPEN = "rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

/** The type of the tile by how much title there is: a short one is set large, a long word or a long title smaller, so nothing breaks in the middle of a word. */
function jacketType(title: string): string {
  const longest = Math.max(0, ...title.split(/\s+/).map((word) => word.length));
  if (longest >= 10 || title.length > 30) return "text-[length:11.5cqw]";
  if (longest > 7 || title.length > 16) return "text-[length:14.5cqw]";
  return "text-[length:19cqw]";
}

/**
 * The tile that stands in for a cover: the title set large on a quiet jacket
 * with a spine line and a short rule, scaled with the width of the cover so it
 * reads at 90px and at 200px. It sits under a real cover too, so while the
 * picture loads, or if it never does, the book is still a book.
 */
function Jacket({ title, author }: { title: string; author?: string }) {
  return (
    <div aria-hidden="true" className={cn("@container absolute inset-0 overflow-hidden", JACKETS[hashOf(title) % JACKETS.length])}>
      <span className="absolute inset-y-0 left-[9%] w-px bg-current opacity-15" />
      <div className="flex size-full flex-col justify-between py-[12cqw] pr-[9cqw] pl-[16cqw]">
        <div>
          <span className={cn("line-clamp-5 block leading-[1.06] font-semibold tracking-[-0.03em] text-balance [overflow-wrap:anywhere]", jacketType(title))}>{title}</span>
          <span className="mt-[7cqw] block h-px w-[14cqw] bg-current opacity-50" />
        </div>
        {author ? <span className="line-clamp-2 text-[length:7.5cqw] leading-[1.35] font-medium tracking-[0.1em] uppercase opacity-70">{author}</span> : null}
      </div>
    </div>
  );
}

/**
 * A book in a catalogue, for a library, a bookshop or a reading list: the
 * cover in a fixed 2:3 box (a typographic tile with the title when the picture
 * is missing or fails), the title as the one link of the card, the authors, a
 * rating drawn to the exact average, the formats as word chips, and whether
 * you can have it today, said in words with a glyph: Available, Reserved, or
 * Checked out with the day it is due back. A price, when there is one, sits in
 * tabular numerals at the foot. It keeps no state and renders on the server;
 * only the cover picture is a tiny client component, so that it can take
 * itself away when it fails to load.
 */
export function BookCard({
  title,
  authors,
  cover,
  rating,
  ratingCount,
  formats,
  availability,
  price,
  currency = "EUR",
  dueDate,
  href,
  orientation = "horizontal",
  headingLevel = 3,
  locale = "en-US",
  timeZone = "UTC",
  labels,
  className,
  ...props
}: BookCardProps) {
  const text = { ...DEFAULT_LABELS, ...labels };
  const formatNames = { ...DEFAULT_FORMATS, ...labels?.formatNames };
  const states = definitions({ ...DEFAULT_AVAILABILITY, ...labels?.availabilities });
  const titleId = useId();
  const Heading = `h${headingLevel}` as "h2" | "h3" | "h4";
  const vertical = orientation === "vertical";
  const picture = typeof cover === "string" ? { src: cover } : cover;
  const due = availability === "out" && dueDate !== undefined ? dateText(dueDate, locale, timeZone, { day: "numeric", month: "short" }) : null;
  const authorText = authors?.length ? listOf(authors, locale) : "";
  const stars =
    rating === undefined
      ? undefined
      : ratingCount === undefined
        ? fill(text.rated, { rating: scoreText(rating, locale) })
        : fill(ratingCount === 1 ? text.ratedOne : text.ratedCount, { rating: scoreText(rating, locale), count: countText(ratingCount, locale) });

  const jacket = (
    <div className="relative w-full overflow-hidden rounded-md border border-border bg-muted shadow-sm">
      <AspectRatio ratio={2 / 3}>
        <Jacket title={title} author={authors?.[0]} />
        {picture ? <BookCover src={picture.src} alt={picture.alt} /> : null}
      </AspectRatio>
    </div>
  );

  return (
    <article
      data-slot="book-card"
      data-availability={availability}
      data-orientation={orientation}
      aria-labelledby={titleId}
      className={cn(
        "group/book-card @container relative flex min-w-0 overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-[border-color,box-shadow] duration-150 motion-reduce:transition-none",
        "has-[[data-slot=book-card-open]:focus-visible]:border-ring has-[[data-slot=book-card-open]:focus-visible]:ring-[3px] has-[[data-slot=book-card-open]:focus-visible]:ring-ring/40",
        vertical ? "flex-col" : "gap-4 p-4 @md:gap-5 @md:p-5",
        href && "hover:border-foreground/30 hover:shadow-sm",
        className,
      )}
      {...props}
    >
      {vertical ? (
        <div className="grid place-items-center border-b border-border bg-muted/50 px-5 py-6">
          <div className="w-2/3 max-w-44">{jacket}</div>
        </div>
      ) : (
        <div className="w-20 shrink-0 self-start @xs:w-24 @md:w-28">{jacket}</div>
      )}

      <div className={cn("flex min-w-0 flex-1 flex-col", vertical && "p-3 @[11rem]:p-4")}>
        <Heading id={titleId} className="text-[0.9375rem] leading-snug font-semibold tracking-[-0.01em] text-balance">
          {href ? (
            <a data-slot="book-card-open" href={href} className={OPEN}>
              <span className="line-clamp-3 [overflow-wrap:anywhere]">{title}</span>
            </a>
          ) : (
            <span className="line-clamp-3 [overflow-wrap:anywhere]">{title}</span>
          )}
        </Heading>

        {authorText ? (
          <p className="relative mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
            <span className="sr-only">{text.by} </span>
            {authorText}
          </p>
        ) : null}

        {rating !== undefined ? <Score value={rating} count={ratingCount} size="sm" label={stars} locale={locale} className="mt-2" /> : null}

        {formats?.length ? (
          <ul aria-label={text.formats} className="mt-3 flex flex-wrap gap-1.5">
            {formats.map((format) => (
              <li key={format}>
                <Badge variant="outline">{formatNames[format]}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {availability || price !== undefined ? (
          <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-4">
            {availability ? (
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5">
                <StatusBadge status={availability} statuses={states} size="md" />
                {due ? (
                  <span className="text-[0.8125rem] leading-5 text-muted-foreground">
                    {withDate(
                      text.due,
                      <time dateTime={due.iso} className="font-medium text-foreground tabular-nums">
                        {due.text}
                      </time>,
                    )}
                  </span>
                ) : null}
              </div>
            ) : null}
            {price !== undefined ? (
              <p className="text-[0.9375rem] leading-5 font-semibold tabular-nums">
                <span className="sr-only">{text.price}: </span>
                {typeof price === "number" ? priceText(price, currency, locale) : price}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}
