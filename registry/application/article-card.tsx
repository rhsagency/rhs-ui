import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { Avatar, AvatarFallback, AvatarImage, initialsOf } from "@rhs-ui/primitives/avatar";
import { Badge } from "@rhs-ui/primitives/badge";
import { Card } from "@rhs-ui/primitives/card";
import { cn } from "@/lib/utils";

/** The picture at the top, or beside the text. */
export interface ArticleCardImage {
  /** The picture's address. */
  src: string;
  /** What it shows. Leave it empty for a picture that only decorates, which is the usual case for a cover. */
  alt?: string;
  /** Its real width and height, so the browser knows the shape before it has the file. */
  width?: number;
  height?: number;
  /** A tiny version of it as a data URL (what Next.js calls blurDataURL). It sits blurred behind the picture until the picture has loaded, so the box is never empty. */
  placeholder?: string;
}

/** Who wrote it. */
export interface ArticleCardAuthor {
  /** Their name: "Mara Okafor". */
  name: string;
  /** Their portrait, as an image address. Initials stand in while it loads, or when there is none. */
  image?: string;
}

export interface ArticleCardProps extends Omit<ComponentProps<"article">, "title"> {
  /** Where the article lives. The title is the link, and its target stretches over the whole card. */
  href: string;
  /** The headline. Cut to two lines, so cards in a row keep one height. */
  title: string;
  /** The summary. Cut to three lines. */
  excerpt?: string;
  /** The cover picture. It is boxed in a fixed shape (`aspect`) from the first paint, so a list never jumps while pictures arrive. */
  image?: ArticleCardImage;
  /** Your own picture element in place of the plain `img`: next/image with `fill`, a video poster. It has to fill its box (absolutely positioned, `size-full`, `object-cover`). */
  media?: ReactNode;
  /** The topic, as a badge: "Engineering". */
  category?: string;
  /** Who wrote it. */
  author?: ArticleCardAuthor;
  /** When it was published: a Date, an ISO string or a timestamp. A date-only string such as "2026-10-14" is a calendar day: it is written as that day in any `timeZone`, and stays a date-only string in the `time` element. A full timestamp is written in `timeZone`. */
  date?: Date | string | number;
  /** How long it takes to read, as you want it said: "6 min read". */
  readingTime?: string;
  /** "vertical" stacks the picture over the text. "horizontal" does the same on a narrow card and puts the picture beside the text once the card is 40rem wide, by the width of the card itself, not the screen. Default "vertical". */
  orientation?: "vertical" | "horizontal";
  /** The shape of the picture box above the text: width divided by height. Default 1.6 (16 by 10). */
  aspect?: number;
  /** The language of the date. Default "en-US". */
  locale?: string;
  /** The time zone the date is written in, so the server and the browser agree. Default "UTC". */
  timeZone?: string;
  /** The title's element, so the page outline stays right. Default "h3". */
  titleAs?: "h2" | "h3" | "h4";
}

/** A date-only string such as "2026-10-14": a calendar day, which belongs to no time zone. */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The date for the reader and for the `datetime` attribute. A calendar day is written as the day it says: `new Date("2026-10-14")` is midnight
 * UTC, which in a zone west of UTC is still the day before, so a date-only string is written in UTC whatever zone is asked for, and it stays a
 * date-only string in `datetime`. An unknown locale or zone falls back to US English and UTC instead of taking the page down.
 */
function written(input: Date | string | number, locale: string, timeZone: string): { text: string; iso: string } | null {
  const at = new Date(input);
  if (Number.isNaN(at.getTime())) return null;
  const day = typeof input === "string" && CALENDAR_DAY.test(input);
  const zone = day ? "UTC" : timeZone;
  let text: string;
  try {
    text = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: zone }).format(at);
  } catch {
    text = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(at);
  }
  return { text, iso: day ? input : at.toISOString() };
}

/**
 * A post or article preview as one link: a cover picture, the topic and the
 * date, a headline, a summary, and the author with the reading time. The
 * headline is the link and its target stretches over the whole card, so a click
 * anywhere on it opens the article (the text on it is not selectable by
 * dragging) and the focus ring goes around the whole card. The cover
 * is boxed in a fixed shape before it loads, with a blurred placeholder behind
 * it, so nothing moves when pictures arrive; the headline is cut to two lines
 * and the summary to three, and the author sits at the bottom, so cards of
 * different lengths line up in a grid. The date is a `time` element written
 * in the locale and zone you give. The horizontal layout moves the picture
 * beside the text when the card itself is 40rem wide, which makes the same
 * card right in a grid, a related-posts row and a full-width feed.
 */
export function ArticleCard({ href, title, excerpt, image, media, category, author, date, readingTime, orientation = "vertical", aspect = 1.6, locale = "en-US", timeZone = "UTC", titleAs: Title = "h3", className, ...props }: ArticleCardProps) {
  const horizontal = orientation === "horizontal";
  const published = date === undefined ? null : written(date, locale, timeZone);
  const hasMedia = Boolean(media) || Boolean(image);

  return (
    <article data-slot="article-card" data-orientation={orientation} className={cn("@container h-full", className)} {...props}>
      <Card
        className={cn(
          "group/article relative h-full gap-0 overflow-hidden py-0 transition-[border-color,box-shadow] duration-200 hover:border-ring/40 hover:shadow-sm has-[a:focus-visible]:border-ring has-[a:focus-visible]:ring-[3px] has-[a:focus-visible]:ring-ring/40 motion-reduce:transition-none",
          horizontal && "@[40rem]:flex-row",
        )}
      >
        {hasMedia ? (
          <div data-slot="article-card-media" className={cn("relative shrink-0 overflow-hidden border-b border-border bg-muted", horizontal && "@[40rem]:flex @[40rem]:w-72 @[40rem]:border-r @[40rem]:border-b-0")}>
            <div style={{ "--aspect": aspect } as CSSProperties} className={cn("relative aspect-(--aspect) w-full", horizontal && "@[40rem]:aspect-auto @[40rem]:min-h-48 @[40rem]:flex-1")}>
              {image?.placeholder ? <div aria-hidden="true" className="absolute inset-0 scale-110 bg-cover bg-center blur-xl" style={{ backgroundImage: `url("${image.placeholder}")` }} /> : null}
              {media ??
                (image ? (
                  // eslint-disable-next-line @next/next/no-img-element -- framework-neutral default; pass `media` to use next/image
                  <img
                    src={image.src}
                    alt={image.alt ?? ""}
                    width={image.width}
                    height={image.height}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-out group-hover/article:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover/article:scale-100"
                  />
                ) : null)}
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 @[40rem]:p-6">
          {category || published ? (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
              {category ? <Badge variant="secondary">{category}</Badge> : null}
              {published ? (
                <time dateTime={published.iso} className="tabular-nums">
                  {published.text}
                </time>
              ) : null}
            </p>
          ) : null}

          <Title className="text-base leading-snug font-semibold tracking-[-0.02em] text-balance @[40rem]:text-lg">
            <a
              href={href}
              className="line-clamp-2 rounded-sm outline-none after:absolute after:inset-0 after:rounded-xl group-hover/article:underline group-hover/article:decoration-1 group-hover/article:underline-offset-4"
            >
              {title}
            </a>
          </Title>

          {excerpt ? <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{excerpt}</p> : null}

          {author || readingTime ? (
            <footer className="mt-auto flex items-center gap-2.5 pt-3 text-[0.8125rem] text-muted-foreground">
              {author ? (
                <>
                  <Avatar size="sm" aria-hidden="true">
                    {author.image ? <AvatarImage src={author.image} alt="" /> : null}
                    <AvatarFallback>{initialsOf(author.name) || "?"}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 truncate font-medium text-foreground">
                    <span className="sr-only">By </span>
                    {author.name}
                  </span>
                </>
              ) : null}
              {author && readingTime ? (
                <span aria-hidden="true" className="shrink-0">
                  ·
                </span>
              ) : null}
              {readingTime ? <span className="shrink-0 whitespace-nowrap">{readingTime}</span> : null}
            </footer>
          ) : null}
        </div>
      </Card>
    </article>
  );
}
